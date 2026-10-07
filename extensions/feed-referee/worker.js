import { API_URL, CACHE_TTL, cacheKey, isTimeline, parseScores, requestFor, settingsFrom, validTweet } from "./core.js";

// Neither the page nor our content script can read credentials from extension storage.
const ready = Promise.all([
  chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
  chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
]);
let chain = Promise.resolve();
function locked(fn) {
  const next = chain.then(fn, fn);
  chain = next.catch(() => {});
  return next;
}
const inFlight = new Map();
const controllers = new Set();
let generation = 0;
const day = () => new Date().toISOString().slice(0, 10);
async function state() {
  await ready;
  const [local, session] = await Promise.all([
    chrome.storage.local.get(["settings", "apiKey", "rememberKey", "usage"]),
    chrome.storage.session.get(["apiKey", "cooldown", "lastIssue"]),
  ]);
  return {
    settings: settingsFrom(local.settings),
    key: session.apiKey || local.apiKey || "",
    remembered: typeof local.rememberKey === "boolean" ? local.rememberKey : !!local.apiKey,
    usage: local.usage?.day === day() ? local.usage : { day: day(), requests: 0, inputTokens: 0, outputTokens: 0 },
    cooldown: session.cooldown || 0,
    lastIssue: session.lastIssue || "",
  };
}
async function publicState() {
  const s = await state();
  return { settings: s.settings, hasKey: !!s.key, remembered: s.remembered, usage: s.usage, cooldown: s.cooldown, lastIssue: s.lastIssue, running: s.settings.enabled && !!s.key };
}
async function notify() {
  const value = await publicState();
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.filter(tab => tab.id).map(tab => chrome.tabs.sendMessage(tab.id, { type: "referee:state", value }).catch(() => {})));
}
function abortPending() {
  generation++;
  for (const controller of controllers) controller.abort();
}
async function update(message) {
  await locked(async () => {
    const s = await state();
    const settings = settingsFrom({ ...s.settings, ...message.settings });
    if (message.key !== undefined || typeof message.remember === "boolean") {
      const replacing = message.key !== undefined;
      const raw = replacing ? message.key : s.key;
      if (typeof raw !== "string" || raw.length > 512 || /[\s\x00-\x1f\x7f]/.test(raw)) throw new Error("Invalid API key format.");
      const key = raw.trim();
      const remember = typeof message.remember === "boolean" ? message.remember : s.remembered;
      await chrome.storage.local.set({ rememberKey: remember });
      if (remember && key) {
        await chrome.storage.local.set({ apiKey: key });
        await chrome.storage.session.remove("apiKey");
      } else {
        await chrome.storage.local.remove("apiKey");
        if (key) await chrome.storage.session.set({ apiKey: key });
        else await chrome.storage.session.remove("apiKey");
      }
      if (replacing) {
        await chrome.storage.session.remove(["cooldown", "lastIssue"]);
        abortPending();
      }
    }
    const current = await state();
    if (settings.enabled && !current.key) throw new Error("Add your TypeSafe API key before enabling.");
    if (!settings.enabled) abortPending();
    await chrome.storage.local.set({ settings });
  });
  await notify();
  return publicState();
}
async function setIssue(message, until = 0, disable = false) {
  await locked(async () => {
    await chrome.storage.session.set({ lastIssue: message, cooldown: until });
    if (disable) {
      const s = await state();
      await chrome.storage.local.set({ settings: { ...s.settings, enabled: false } });
      abortPending();
    }
  });
  await notify();
}
async function pruneCache() {
  const all = await chrome.storage.local.get(null);
  const entries = Object.entries(all).filter(([key]) => key.startsWith("cache:")).sort((a, b) => b[1].at - a[1].at);
  const remove = entries.filter(([, entry], index) => index >= 1000 || Date.now() - entry.at > CACHE_TTL).map(([key]) => key);
  if (remove.length) await chrome.storage.local.remove(remove);
}
async function classify(tweet, key, keyHash, run) {
  const controller = new AbortController();
  controllers.add(controller);
  const timer = setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(requestFor(tweet)), signal: controller.signal,
      credentials: "omit", redirect: "error", cache: "no-store", referrerPolicy: "no-referrer",
    });
    if (run !== generation) return { error: "paused" };
    if (response.status === 401 || response.status === 403) {
      await setIssue("API key rejected. Update your key to resume.", 0, true);
      return { error: "auth" };
    }
    if (response.status === 429 || response.status === 529 || response.status >= 500) {
      const header = response.headers.get("retry-after");
      const seconds = header === null ? NaN : Number(header);
      const retryMs = Number.isFinite(seconds) ? seconds * 1000 : (Date.parse(header || "") - Date.now());
      const until = Date.now() + Math.min(300_000, Math.max(30_000, Number.isFinite(retryMs) ? retryMs : 30_000));
      await setIssue("Jev is busy or rate-limited. Retrying after a pause.", until);
      return { error: "backoff", retryAt: until };
    }
    if (!response.ok) {
      await setIssue("Jev rejected a request. Paused to avoid repeated charges; check the extension before resuming.", 0, true);
      return { error: "rejected" };
    }
    const body = await response.json();
    const scores = parseScores(body);
    await locked(async () => {
      if (run !== generation) return;
      const s = await state();
      const usage = { ...s.usage };
      for (const [from, to] of [["input_tokens", "inputTokens"], ["output_tokens", "outputTokens"]]) {
        const count = body.usage?.[from];
        if (Number.isSafeInteger(count) && count >= 0) usage[to] += count;
      }
      await chrome.storage.local.set({ [keyHash]: { at: Date.now(), scores }, usage });
      // Do not overwrite a cooldown reported by another concurrent request.
      if (s.cooldown <= Date.now()) await chrome.storage.session.remove(["lastIssue", "cooldown"]);
      await pruneCache();
    });
    return run === generation ? { scores } : { error: "paused" };
  } catch (error) {
    if (run !== generation) return { error: "paused" };
    const until = Date.now() + 30_000;
    await setIssue(error?.name === "AbortError" ? "Jev timed out. Feed unchanged; retrying after a pause." : "Could not reach Jev or read its response. Feed unchanged; retrying after a pause.", until);
    return { error: "backoff", retryAt: until };
  } finally {
    clearTimeout(timer);
    controllers.delete(controller);
    inFlight.delete(keyHash);
  }
}
async function evaluate(tweet) {
  if (!validTweet(tweet)) return { error: "unsupported" };
  const keyHash = await cacheKey(tweet);
  const prepared = await locked(async () => {
    const s = await state();
    if (!s.settings.enabled || !s.key) return { result: { error: "paused" } };
    const cached = (await chrome.storage.local.get(keyHash))[keyHash];
    if (cached && Date.now() - cached.at < CACHE_TTL) return { result: { scores: cached.scores, cached: true } };
    if (inFlight.has(keyHash)) return { job: inFlight.get(keyHash) };
    if (s.cooldown > Date.now()) return { result: { error: "backoff", retryAt: s.cooldown } };
    if (s.usage.requests >= s.settings.dailyLimit) return { result: { error: "budget" } };
    if (inFlight.size >= 2) return { result: { error: "busy", retryAt: Date.now() + 1500 } };
    // Reserve before sending, across all tabs. Failed requests/retries count too.
    await chrome.storage.local.set({ usage: { ...s.usage, requests: s.usage.requests + 1 } });
    const job = classify(tweet, s.key, keyHash, generation);
    inFlight.set(keyHash, job);
    return { job };
  });
  return prepared.job ? await prepared.job : prepared.result;
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  const popup = sender.id === chrome.runtime.id && sender.url === chrome.runtime.getURL("popup.html");
  const trustedPage = sender.id === chrome.runtime.id && sender.frameId === 0;
  const feed = trustedPage && isTimeline(sender.url);
  if (!message || (!popup && !feed)) return;
  const run = async () => {
    await ready;
    if (message.type === "referee:get") return publicState();
    if (feed && message.type === "referee:evaluate") return evaluate(message.tweet);
    if (popup && message.type === "referee:update") return update(message);
    if (popup && message.type === "referee:clear") {
      await locked(async () => {
        abortPending();
        const all = await chrome.storage.local.get(null);
        await chrome.storage.local.remove(Object.keys(all).filter(key => key.startsWith("cache:")));
      });
      return { ok: true };
    }
    throw new Error("Unsupported message");
  };
  run().then(value => respond({ ok: true, value }), () => respond({ ok: false, error: "Could not complete that action. Check your key and settings, then retry." }));
  return true;
});
chrome.runtime.onInstalled.addListener(() => { ready.then(pruneCache).catch(() => {}); });
