## Feed Referee

**Less bait. Your call.** A browser extension from Jev Experiments that adds a second opinion to your X feed, powered by TypeSafe's Jev.

[See the product page and demo](https://jev-experiments.awesamarth.dev/experiments/feed-referee) · [Privacy & limits](https://jev-experiments.awesamarth.dev/experiments/feed-referee/privacy)

### What's included

- Four independent judgments: **Ragebait**, **Promo**, **AI Slop**, and **Engagement-farming**.
- Compact inline badges with probabilities and rubric definitions on click.
- Support for visible posts across Home, profiles, post pages/replies, search, lists, and bookmarks.
- Optional collapsing with selected labels and a probability threshold. **Show tweet** always restores a collapsed post. Individual post pages remain uncollapsed.
- Autosaving popup controls, immediate pause, a daily request cap, and content-matched caching.
- Your own TypeSafe key, with direct API requests and optional device-local key storage. No Jev Experiments backend or embedded key.

### Download and install

Requires **desktop Chrome 120+ or a compatible Chromium browser**, plus **your own TypeSafe API key**. This is an unpacked extension, not a Chrome Web Store listing.

1. Under **Assets** below, download **`feed-referee-v1.1.0.zip`**. The automatically generated “Source code” archives contain the whole website and are not needed.
2. Extract the ZIP and keep the **`feed-referee`** folder in a permanent location.
3. Open **`chrome://extensions`** and enable **Developer mode**.
4. Click **Load unpacked** and select the **`feed-referee`** folder that directly contains **`manifest.json`**.
5. Pin Feed Referee. Open its popup, add your own TypeSafe key, read the data-sharing notice, and set your daily request cap.
6. Switch **Referee enabled** on, then open or reload X. The extension starts paused; collapsing is off by default.

No website server, Bun installation, or database is needed to use the extension. The `.sha256` asset is an optional download-integrity checksum.

### Know the limits

- API usage is billed to your TypeSafe account. The daily cap counts attempts including failures/retries; it is not a dollar spending limit. New installs default to 2,000 attempts per UTC day and can be set lower.
- Post text and quoted context go directly to TypeSafe, including protected posts you can view. DMs, composers, drafts, account/settings screens, and dialogs are excluded. Images, videos, and linked pages are not analyzed.
- Labels can be wrong. **AI Slop is a writing-style estimate, not proof of AI authorship.** The demo is edited real footage, not an accuracy or speed benchmark.
- Keys are session-only unless Remember key is selected. Device storage is not encrypted or synced.
- X changes its layout frequently. Compatibility may require updates; automated fixtures do not guarantee behavior on every live surface.

### Updating an unpacked installation

Pause the extension, replace the files in its existing unpacked folder with the new release's files, and click **Reload** on its card in `chrome://extensions`. Reload your X tabs. Keep the same folder to avoid installing a second copy. A session-only key may need to be entered again. New/replacement keys leave the referee paused until you enable it.

[Report an issue](https://github.com/awesamarth/jev-experiments/issues). Please do not include API keys, cookies, private posts, or browser profiles in reports.
