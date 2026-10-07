const $ = id => document.getElementById(id);
let initialized = false;
let confirmed = null;
let revision = 0;
let pending = 0;
let keyTimer;
let keySubmitted = "";

async function send(message) {
  const result = await chrome.runtime.sendMessage(message);
  if (!result?.ok) throw new Error(result?.error || "Extension unavailable. Reload it and retry.");
  return result.value;
}
function showStatus(state) {
  confirmed = state;
  $("status").dataset.state = !state.hasKey || !state.running ? "off" : state.lastIssue || state.usage.requests >= state.settings.dailyLimit ? "issue" : "on";
  $("status").textContent = !state.hasKey ? "Add your own key to get started." : !state.running ? "Paused · your feed is untouched." : state.lastIssue || (state.usage.requests >= state.settings.dailyLimit ? "Daily request limit reached. Cached labels still work." : "On · checking visible posts on X.");
  $("usage").textContent = `${state.usage.requests} / ${state.settings.dailyLimit} requests today · ${state.usage.inputTokens.toLocaleString()} input + ${state.usage.outputTokens.toLocaleString()} output tokens reported`;
  $("enabled").checked = state.running;
  $("key").placeholder = state.hasKey ? "Paste a replacement key (optional)" : "Paste your API key";
  $("key-state").textContent = state.hasKey ? `Key present · ${state.remembered ? "saved on this device" : "this browser session only"}.` : "No key stored. We never supply ours.";
  $("forget").disabled = !state.hasKey;
}
function populate(state) {
  $("collapse").checked = state.settings.collapse;
  $("threshold").value = Math.round(state.settings.threshold * 100);
  $("limit").value = state.settings.dailyLimit;
  $("remember").checked = state.remembered;
  for (const input of document.querySelectorAll('[name="filter"]')) input.checked = state.settings.filters.includes(input.value);
  updateControls();
  showStatus(state);
}
function updateControls() {
  $("filters").disabled = !$("collapse").checked;
  $("threshold-value").textContent = `${$("threshold").value}%`;
}
// Send only changed fields. The worker serializes writes, so quick edits cannot
// overwrite unrelated settings and a pending save never drops a later Off click.
async function save(message, feedback = "Saved automatically.") {
  if (!initialized) return;
  const mine = ++revision;
  pending++;
  $("feedback").textContent = "Saving…";
  try {
    const state = await send({ type: "referee:update", ...message });
    if (mine === revision) {
      showStatus(state);
      $("feedback").textContent = feedback;
    }
    return true;
  } catch (error) {
    if (message.key !== undefined && keySubmitted === message.key) keySubmitted = "";
    if (mine === revision) {
      $("feedback").textContent = error.message;
      // Reconcile a rejected edit with storage without ever reading the key.
      try {
        const state = await send({ type: "referee:get" });
        if (mine === revision) populate(state);
      } catch { /* Keep the error visible; do not claim the change was saved. */ }
    }
    return false;
  } finally { pending--; }
}
function keyEdit() {
  const key = $("key").value.trim();
  if (!key || key === keySubmitted) return {};
  if (key.length > 512 || /[\s\x00-\x1f\x7f]/.test(key)) {
    $("feedback").textContent = "API keys cannot contain spaces or control characters.";
    return null;
  }
  return { key, remember: $("remember").checked };
}
function flushKey() {
  clearTimeout(keyTimer);
  keyTimer = undefined;
  const edit = keyEdit();
  if (!edit?.key || !initialized) return;
  keySubmitted = edit.key;
  // Saving a new key never starts inference with a partially entered credential.
  save({ ...edit, settings: { enabled: false } }, "Key saved. Turn on the referee when ready.");
}
$("enabled").addEventListener("change", () => {
  const enabled = $("enabled").checked;
  if (!enabled) {
    save({ settings: { enabled: false } }, "Paused.");
    return;
  }
  clearTimeout(keyTimer);
  keyTimer = undefined;
  const edit = keyEdit();
  if (!edit) { $("enabled").checked = confirmed?.running || false; return; }
  if (edit.key) keySubmitted = edit.key;
  save({ ...edit, settings: { enabled: true } }, "On. Visible posts will be checked on X.");
});
$("collapse").addEventListener("change", () => {
  updateControls();
  save({ settings: { collapse: $("collapse").checked } });
});
for (const input of document.querySelectorAll('[name="filter"]')) input.addEventListener("change", () => {
  save({ settings: { filters: Array.from(document.querySelectorAll('[name="filter"]:checked'), node => node.value) } });
});
$("threshold").addEventListener("input", () => {
  updateControls();
  save({ settings: { threshold: Number($("threshold").value) / 100 } });
});
$("limit").addEventListener("input", () => {
  if (!$("limit").validity.valid) {
    $("feedback").textContent = "Enter a whole-number daily limit from 10 to 2000. Previous limit is unchanged.";
    return;
  }
  save({ settings: { dailyLimit: Number($("limit").value) } });
});
$("remember").addEventListener("change", () => {
  save({ remember: $("remember").checked });
});
$("key").addEventListener("input", () => {
  clearTimeout(keyTimer);
  revision++;
  if (!$("key").value.trim()) { keyTimer = undefined; return; }
  $("feedback").textContent = "Key will save automatically. New keys leave the referee paused.";
  keyTimer = setTimeout(flushKey, 450);
});
$("key").addEventListener("change", flushKey);
$("key").addEventListener("paste", () => setTimeout(flushKey, 0));
$("key").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); flushKey(); } });
window.addEventListener("pagehide", flushKey);
$("settings").addEventListener("submit", event => { event.preventDefault(); flushKey(); });
$("forget").addEventListener("click", () => {
  clearTimeout(keyTimer);
  keyTimer = undefined;
  keySubmitted = "";
  $("key").value = "";
  save({ key: "", settings: { enabled: false } }, "Key removed. Referee paused.");
});
$("clear").addEventListener("click", async () => {
  $("clear").disabled = true;
  const mine = ++revision;
  pending++;
  try {
    await send({ type: "referee:clear" });
    if (mine === revision) $("feedback").textContent = "Stored cache cleared. Reload X to clear displayed judgments. Request budget unchanged.";
  } catch (error) {
    if (mine === revision) $("feedback").textContent = error.message;
  } finally { pending--; $("clear").disabled = false; }
});
await send({ type: "referee:get" }).then(state => {
  populate(state);
  initialized = true;
  $("controls").disabled = false;
  $("enabled").disabled = false;
}).catch(error => { $("status").textContent = error.message; });
setInterval(async () => {
  if (!initialized || pending || keyTimer) return;
  const mine = revision;
  try {
    const state = await send({ type: "referee:get" });
    if (!pending && !keyTimer && mine === revision) showStatus(state);
  } catch { /* Keep the last confirmed state when unavailable. */ }
}, 3000);
