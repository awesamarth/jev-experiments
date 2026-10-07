import { describe, expect, test } from "bun:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import * as core from "../extensions/feed-referee/core.js";

const source = (await readFile(new URL("../extensions/feed-referee/worker.js", import.meta.url), "utf8"))
  .replace(/^import .* from "\.\/core\.js";/, "const { API_URL, CACHE_TTL, cacheKey, isTimeline, parseScores, requestFor, settingsFrom, validTweet } = core;");
const id = "offline-test-extension";
const popup = { id, url: `chrome-extension://${id}/popup.html` };
const feed = { id, frameId: 0, url: "https://x.com/home", tab: { id: 1 } };
const post = (id = "10000") => ({ id, text: "Synthetic worker test post only.", quoted: "" });
const result = () => new Response(JSON.stringify({ answers: Object.fromEntries(["ragebait", "promo", "ai_generated", "engagement_farming"].map(k => [k, { type: "noul", noul: .8 }])), usage: { input_tokens: 100, output_tokens: 20 } }), { status: 200 });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
async function until(predicate) { for (let i = 0; i < 100; i++) { if (predicate()) return; await tick(); } throw new Error("Test condition not reached"); }
function harness({ local = {}, session = {}, fetcher = async () => result() } = {}) {
  let listener;
  const calls = [], access = [];
  const area = (data, name) => ({
    setAccessLevel: async value => { access.push([name, value.accessLevel]); },
    get: async keys => structuredClone(keys === null ? data : Object.fromEntries((typeof keys === "string" ? [keys] : keys).filter(k => k in data).map(k => [k, data[k]]))),
    set: async values => { Object.assign(data, structuredClone(values)); },
    remove: async keys => { for (const key of typeof keys === "string" ? [keys] : keys) delete data[key]; },
  });
  vm.runInNewContext(source, {
    core, AbortController, setTimeout, clearTimeout, Date,
    fetch: async (url, options) => { calls.push({ url, options }); return fetcher(url, options); },
    chrome: {
      storage: { local: area(local, "local"), session: area(session, "session") },
      tabs: { query: async () => [], sendMessage: async () => {} },
      runtime: { id, getURL: path => `chrome-extension://${id}/${path}`, onMessage: { addListener: fn => { listener = fn; } }, onInstalled: { addListener: () => {} } },
    },
  });
  return { calls, local, session, access,
    send(message, sender = popup) { return new Promise(resolve => { if (listener(message, sender, resolve) !== true) resolve(undefined); }); },
    enable() { return this.send({ type: "referee:update", key: "synthetic-test-key", settings: { enabled: true } }); },
    evaluate(tweet = post(), sender = feed) { return this.send({ type: "referee:evaluate", tweet }, sender); },
  };
}

describe("Feed Referee worker — mocked Chrome storage and HTTP", () => {
  test("restricts storage, starts paused, never returns credentials to content scripts", async () => {
    const h = harness();
    expect((await h.send({ type: "referee:get" }, feed)).value.running).toBe(false);
    expect(h.access).toEqual([["local", "TRUSTED_CONTEXTS"], ["session", "TRUSTED_CONTEXTS"]]);
    await h.enable();
    const publicState = await h.send({ type: "referee:get" }, feed);
    expect(publicState.value.hasKey).toBe(true);
    expect(JSON.stringify(publicState)).not.toContain("synthetic-test-key");
    expect(h.session.apiKey).toBe("synthetic-test-key");
    expect(h.local.apiKey).toBeUndefined();
    expect(await h.evaluate(post(), { ...feed, url: "https://x.com/messages" })).toBeUndefined();
    expect(await h.evaluate(post(), { ...feed, frameId: 1 })).toBeUndefined();
    expect(await h.evaluate(post(), { ...feed, id: "other-extension" })).toBeUndefined();
    expect((await h.send({ type: "referee:update", key: "stolen" }, feed)).ok).toBe(false);
  });

  test("deduplicates across tabs, bounds concurrency and counts attempts before fetch", async () => {
    const waiting = [];
    const h = harness({ fetcher: () => new Promise(resolve => waiting.push(resolve)) });
    await h.enable();
    const first = h.evaluate();
    const same = h.evaluate(post(), { ...feed, tab: { id: 2 } });
    const second = h.evaluate(post("20000"));
    await until(() => h.calls.length === 2);
    expect((await h.evaluate(post("30000"))).value.error).toBe("busy");
    expect(h.local.usage.requests).toBe(2);
    waiting.forEach(resolve => resolve(result()));
    const answers = await Promise.all([first, same, second]);
    expect(answers.every(a => a.value.scores.ragebait === .8)).toBe(true);
    expect(h.calls.length).toBe(2);
    const { url, options } = h.calls[0];
    expect(url).toBe(core.API_URL);
    expect(options.credentials).toBe("omit");
    expect(options.redirect).toBe("error");
    expect(options.headers.Authorization).toBe("Bearer synthetic-test-key");
  });

  test("cache stores scores, not raw posts; budgets/cache survive worker recreation", async () => {
    const h = harness(); await h.enable(); await h.evaluate();
    expect(h.local.usage).toMatchObject({ requests: 1, inputTokens: 100, outputTokens: 20 });
    expect(JSON.stringify(h.local)).not.toContain(post().text);
    const restarted = harness({ local: h.local, session: h.session });
    expect((await restarted.evaluate()).value.cached).toBe(true);
    expect(restarted.calls.length).toBe(0);
    for (const path of ["/example/status/10000", "/example", "/search?q=test", "/i/bookmarks", "/home"]) {
      expect((await restarted.evaluate(post(), { ...feed, url: `https://x.com${path}` })).value.cached).toBe(true);
    }
    expect(restarted.calls.length).toBe(0);
    h.local.usage.requests = 2000;
    expect((await restarted.evaluate(post("20000"))).value.error).toBe("budget");
    expect((await restarted.evaluate()).value.cached).toBe(true);
    // A browser restart clears session storage; a session-only key must not survive.
    const newSession = harness({ local: h.local });
    expect((await newSession.send({ type: "referee:get" })).value.running).toBe(false);
  });

  test("401/403 pause; rate limits preserve a shared Retry-After cooldown", async () => {
    for (const status of [401, 403]) {
      const h = harness({ fetcher: async () => new Response(null, { status }) });
      await h.enable(); expect((await h.evaluate()).value.error).toBe("auth");
      expect(h.local.settings.enabled).toBe(false);
      expect(h.local.usage.requests).toBe(1);
      expect((await h.evaluate()).value.error).toBe("paused");
      expect(h.calls.length).toBe(1);
    }
    const h = harness({ fetcher: async () => new Response(null, { status: 429, headers: { "Retry-After": "120" } }) });
    await h.enable(); expect((await h.evaluate()).value.error).toBe("backoff");
    expect(h.session.cooldown - Date.now()).toBeGreaterThan(115000);
    expect((await h.evaluate(post("20000"))).value.error).toBe("backoff");
    expect(h.calls.length).toBe(1);
  });

  test("pause/key removal aborts pending HTTP and cannot cache a late response", async () => {
    let finish;
    const h = harness({ fetcher: () => new Promise(resolve => { finish = resolve; }) });
    await h.enable(); const pending = h.evaluate();
    await until(() => !!finish);
    await h.send({ type: "referee:update", key: "", settings: { enabled: false } });
    expect(h.calls[0].options.signal.aborted).toBe(true);
    finish(result());
    expect((await pending).value.error).toBe("paused");
    expect(Object.keys(h.local).some(k => k.startsWith("cache:"))).toBe(false);
    expect(h.session.apiKey).toBeUndefined();
  });

  test("cache clear preserves usage and remembered-key removal pauses safely", async () => {
    const h = harness();
    await h.send({ type: "referee:update", key: "synthetic-test-key", remember: true, settings: { enabled: true } });
    expect(h.local.apiKey).toBe("synthetic-test-key");
    expect(h.session.apiKey).toBeUndefined();
    await h.evaluate(); await h.send({ type: "referee:clear" });
    expect(Object.keys(h.local).some(k => k.startsWith("cache:"))).toBe(false);
    expect(h.local.usage.requests).toBe(1);
    await h.send({ type: "referee:update", key: "", settings: { enabled: false } });
    expect(h.local.apiKey).toBeUndefined();
    expect((await h.send({ type: "referee:get" })).value.running).toBe(false);
  });

  test("malformed responses/network failures back off without caching fabricated scores", async () => {
    for (const fetcher of [async () => new Response('{"answers":{}}'), async () => { throw new Error("synthetic network failure"); }]) {
      const h = harness({ fetcher }); await h.enable();
      expect((await h.evaluate()).value.error).toBe("backoff");
      expect(h.local.usage.requests).toBe(1);
      expect(Object.keys(h.local).some(k => k.startsWith("cache:"))).toBe(false);
    }
  });
});
