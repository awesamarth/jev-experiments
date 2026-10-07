# Feed Referee

Manifest V3 Chrome/Chromium extension. All extension-initiated network requests go directly to TypeSafe's Jev endpoint. No application backend or embedded key. Not yet published to the Chrome Web Store.

[Product page & demo](https://jev-experiments.awesamarth.dev/experiments/feed-referee) · [Downloads](https://github.com/awesamarth/jev-experiments/releases) · [Hosted privacy & limits](https://jev-experiments.awesamarth.dev/experiments/feed-referee/privacy)

## Download and install

Requires desktop Chrome 120+ or a compatible Chromium browser and your own TypeSafe key. No website server, Bun installation, or database is needed.

Download the versioned **Feed Referee ZIP** from [Releases](https://github.com/awesamarth/jev-experiments/releases), not the automatically generated full-repository source archives. Extract it and keep the `feed-referee` folder somewhere permanent. If no release is available, use the repository's **Code → Download ZIP** and locate `extensions/feed-referee`, or clone the repository.

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select the extracted `feed-referee` folder, or this source directory. The selected folder must directly contain `manifest.json`.
3. Pin Feed Referee, open its popup, and paste your **own TypeSafe API key**.
4. Read the data-sharing notice and choose your budget. All changes save automatically; no Save button is needed. The On/Off switch applies immediately. New/replacement keys save on paste or after a brief typing pause and leave the referee paused until you enable it. It starts **off** by default.
5. Open or reload `https://x.com/home`.

To update, pause the extension, replace the files in the existing unpacked folder, and click **Reload** on its card in `chrome://extensions`. Reload X tabs. Keep the same folder to avoid a duplicate installation. A session-only key may need to be entered again. New/replacement keys leave the referee paused until you enable it.

API keys are session-only unless **Remember key on this device** is selected. Stored keys are not encrypted; keep your device/profile secure. Changing **Remember key** immediately moves the existing key between session-only and device storage; re-entry is not required. Key access is restricted to trusted extension contexts. No keys are injected into the X page or returned to content-script messages.

## Behavior

- Badges appear inline in the display-name/@handle row. Only labels at >=70% are shown; this is a configurable product policy in `core.js`/`content.js`, not calibrated on a production validation set yet.
- Independent Jev judgments: ragebait, promotion, AI Slop (AI-like writing patterns), and engagement farming. **Text-only AI authorship estimates are unreliable and are not proof of AI use.**
- Click a badge for a keyboard-accessible detail panel with rubric definitions and probabilities, not invented explanations.
- All controls are in the extension popup. Collapsing is off by default and only applies to selected labels above the configured threshold. **Show tweet** restores any collapsed post.
- Processes visible supported posts across X, including Home, profiles, post pages, search, lists and bookmarks, in active tabs after a short dwell. Only tweet articles in the main content column are eligible. DMs, composers, drafts, dialog content and account/settings routes are excluded. No screenshots, media analysis or auto-interactions.
- Show more does not block classification. Loaded text is evaluated with a truncation caveat, and expansion can update the judgment. Quotes are context only; their Show more control never blocks the main post and they receive no separate badge/request.
- Navigation and Back reuse content-matched cached judgments without another Jev request. Edited/expanded text is treated as new evidence. Individual post pages show labels without collapsing the post or its replies.
- New installs default to 2,000 requests per day. Existing saved budgets are preserved; change them in the popup if desired. Previously selected Formulaic collapse filters are removed, not silently reinterpreted as AI Slop. Select the new collapse labels explicitly on existing installs.
- At most two network requests concurrently across tabs. Session cooldowns and a persistent daily UTC request cap prevent unbounded retries/spend. Each attempt counts, including failures. The cap is not a dollar spending limit.
- Cache is content/version-aware, hash-keyed, bounded to 1,000 entries, and expires after seven days. No tweet text stored on disk by the extension.
- No remote executable code, inline script, telemetry, cookies, or third-party libraries.

## Files

- `manifest.json`: minimum permissions, MV3 service worker, content script.
- `core.js`: rubrics, parsing, validation, settings, hashing.
- `ai-style.js`: example-based AI-like style rubric. Tuned against a small user-supplied sample, not verified AI/human authorship data; false positives and misses remain.
- `worker.js`: trusted credential handling, direct Jev requests, dedupe, quota, cache, cooldowns.
- `content.js`: X DOM adapter, visibility scheduling, inline badges, details, reversible collapse.
- `popup.*`: settings/consent/key management; `privacy.html`: data and limitations disclosure.

## Verification / release gates

Run the offline suites:

```sh
bun test tests/feed-referee.test.js tests/feed-referee-dom.test.js tests/feed-referee-worker.test.js
```

- Policy tests: settings, payloads, probabilities, caching keys and collapse thresholds.
- DOM tests: isolated Chromium, reduced/anonymized X structure and explicitly synthetic scores. Cover inline placement at 320/390/600/1100px, quoted context, unsupported posts, measurable collapse/reveal, native click preservation, Escape/focus, recycled IDs, late results, backoff, route cleanup and three themes.
- Worker tests: mocked Chrome storage and HTTP, credential boundaries, cross-tab dedupe/concurrency, durable quota/cache, worker recreation, auth errors, cooldown, cancellation and malformed responses.

An operator-supplied saved Home DOM and its stylesheet were also inspected and exercised offline. The private snapshot stays gitignored; its scripts and account state are not executed. These fixture checks alone do **not** establish live X virtualization compatibility, real extension network behavior, or model quality.

The operator has also manually used the unpacked extension in a logged-in browser. The curated demo shows real badges and detail panels on Home, bookmarks, and a profile, plus popup controls and collapse/reveal. This is observed usage, not exhaustive compatibility testing or an accuracy benchmark. Prompt tuning used a small, unverified sample, not a labeled authorship dataset.

Before each release, verify the exact packaged build and record which live checks were performed. Broader coverage still needs real-feed checks for recycled tweets; text/quoted/long/media-only posts; multi-tab dedupe; light, dim, and dark themes; keyboard interaction; pause; rate limits/auth failures; worker restart; and narrow layouts. Real API testing requires explicit use of an operator-supplied key. Do not mark these complete from fixtures or the demo alone.

## Packaging

From the repository root, run `bun run extension:package` (requires the `zip` command). It creates a versioned ZIP and SHA-256 file in ignored `dist/`, with exactly the allowlisted runtime files under `feed-referee/`. The script does not publish anything. See [release instructions](../../releases/README.md) for the approval-gated GitHub release process.

Only package runtime files. Exclude tests, profiles, cookies, API keys, recordings, source maps, and local `.env` files. Chrome profiles used for testing belong outside the extension directory and are gitignored. Web Store distribution will also require accurate store privacy disclosures and a hosted privacy-policy URL.
