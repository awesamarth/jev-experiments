# Feed Referee releases

Distribute Feed Referee as a **versioned GitHub Release in this repository**, with an extension-only ZIP attached. Website deployments remain independent. No separate repository or Chrome Web Store submission is required for this manual-install distribution.

## Prepare locally

1. Confirm the version in `extensions/feed-referee/manifest.json` and update version-specific documentation when it changes. Tag format: `feed-referee-v<VERSION>`.
2. Review the [extension verification notes](../extensions/feed-referee/README.md#verification--release-gates). Record the live checks actually performed; fixtures do not establish production reliability or model accuracy.
3. Run the focused extension checks, site lint/build, and `bun run extension:package`.
4. Inspect the resulting ZIP. It must contain only the nine allowlisted runtime files under `feed-referee/`, with `manifest.json` directly inside that directory. No keys, profiles, tests, or recordings.
5. Extract and load that exact package in an isolated Chrome/Chromium profile. Confirm the popup opens paused without a key. For a real X check, use an explicitly authorized user key and profile. Do not enter credentials in release notes or screenshots.
6. Review the version's release notes, website screenshots, and curated demo before publishing.

## Publish only after explicit approval

Commit and push the reviewed extension, website, assets, documentation, and tests first. Do not tag the previous website-only commit. Create the release as a **draft** against the approved commit; use the actual pushed commit hash rather than a placeholder:

```sh
gh release create feed-referee-v1.1.0 \
  dist/feed-referee-v1.1.0.zip \
  dist/feed-referee-v1.1.0.zip.sha256 \
  --repo awesamarth/jev-experiments \
  --target <APPROVED_PUSHED_COMMIT_SHA> \
  --title "Feed Referee v1.1.0" \
  --notes-file releases/feed-referee-v1.1.0.md \
  --draft
```

Inspect the draft and its assets. Publish only with approval:

```sh
gh release edit feed-referee-v1.1.0 \
  --repo awesamarth/jev-experiments \
  --draft=false
```

After publishing, verify that the ZIP downloads and matches the SHA-256 file. Check the README install instructions and the deployed product page. The website's **Download extension ↗** goes to the repository's **Feed Referee** section; that section points to Releases and includes a source-download fallback. There is no hardcoded link to an unpublished release.

GitHub automatically adds full-repository “Source code” archives. The release notes should clearly direct users to the smaller **`feed-referee-v1.1.0.zip`** asset instead.
