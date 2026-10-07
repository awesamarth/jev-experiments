(() => {
  if (globalThis.__feedReferee) return;
  globalThis.__feedReferee = true;
  const labels = {
    ragebait: ["Ragebait", "Provocation aimed at anger or hostile engagement. Criticism, disagreement, or bad news alone do not count."],
    promo: ["Promo", "Primarily promoting a product, service, project, brand, or signup. Promotion is not necessarily bad or deceptive."],
    ai_generated: ["AI Slop", "AI-like writing patterns, including canned reactions and topic-adapted filler. This is a style estimate, not proof of AI authorship."],
    engagement_farming: ["Engagement-farming", "Primarily extracting replies, likes, reposts, or follows rather than sharing substance or inviting genuine conversation."],
  };
  let state = null;
  let route = "";
  let dead = false;
  let scanning = false;
  let theme = "light";
  let active = 0;
  const records = new Map();
  const own = element => element?.closest?.("feed-referee-badge,feed-referee-collapse,feed-referee-panel");
  const postRoute = () => location.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})(?:\/(?:photo|video)\/\d+)?\/?$/);
  const supportedRoute = () => {
    try {
      return !/^\/(?:messages|chat|grok|compose|drafts|settings|account|login|logout|signup|i\/(?:chat|messages|grok|compose|drafts|flow|settings|account))(?:\/|$)/i.test(decodeURIComponent(location.pathname));
    } catch { return false; }
  };
  const canRun = () => !dead && supportedRoute() && state?.running;
  const css = `
    :host{all:initial;font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--fr-fg,#0f1419);--fr-bg:#fff;--fr-fg:#0f1419;--fr-line:#cfd9de;--fr-muted:#536471;color-scheme:light;box-sizing:border-box}
    :host([theme=dim]){--fr-bg:#15202b;--fr-fg:#f7f9f9;--fr-line:#536471;--fr-muted:#aab8c2;color-scheme:dark}
    :host([theme=dark]){--fr-bg:#000;--fr-fg:#e7e9ea;--fr-line:#3e4144;--fr-muted:#8b98a5;color-scheme:dark}
    :host([compact]) .probability{display:none}
    *{box-sizing:border-box}button{font:inherit;cursor:pointer}button:focus-visible{outline:2px solid #1d9bf0;outline-offset:3px}
    .badge{display:inline-flex;align-items:center;height:18px;max-width:100%;gap:4px;padding:1px 5px;border:1px solid var(--fr-line);border-radius:999px;background:var(--fr-bg);color:var(--fr-fg);font-size:10px;line-height:14px;font-weight:600;white-space:nowrap}.label{min-width:0;overflow:hidden;text-overflow:ellipsis}.probability,.extra{flex:none}
    .badge:hover{filter:brightness(.94)}.badge[data-label=ragebait]{border-color:#c27682}.badge[data-label=promo]{border-color:#a08b36}.badge[data-label=ai_generated]{border-color:#8b83aa}.badge[data-label=engagement_farming]{border-color:#438e98}.extra{font-size:10px;opacity:.65}
    .card{width:100%;background:var(--fr-bg);color:var(--fr-fg);border:1px solid var(--fr-line);border-radius:14px;padding:16px;box-shadow:0 6px 28px #0003;font-size:13px;line-height:1.5}
    h2{font-size:15px;margin:0;font-weight:700}header{display:flex;align-items:center;justify-content:space-between;gap:10px}.close{background:none;border:0;color:var(--fr-fg);font-size:22px;line-height:1;padding:4px 6px}
    ul{padding:0;margin:12px 0;list-style:none}li{margin:12px 0}strong{display:flex;justify-content:space-between;gap:16px}p{margin:4px 0}.muted{color:var(--fr-muted);font-size:11px}.rule{border-top:1px solid var(--fr-line);padding-top:10px}
    .notice{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--fr-line);background:var(--fr-bg);color:var(--fr-fg);border-radius:12px;padding:12px 14px;font-size:12px}.show{border:1px solid var(--fr-line);background:var(--fr-bg);color:var(--fr-fg);border-radius:999px;padding:6px 12px;white-space:nowrap;font-weight:600}
    @media(max-width:600px){.badge{max-width:115px;font-size:10px;padding:1px 5px}.probability{display:none}}
  `;
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function host(tag) {
    const node = document.createElement(tag);
    node.setAttribute("theme", theme);
    const shadow = node.attachShadow({ mode: "closed" });
    const style = el("style", css);
    shadow.append(style);
    // Never let clicking our controls trigger a tweet navigation/action.
    node.addEventListener("click", event => event.stopPropagation());
    node.addEventListener("keydown", event => event.stopPropagation());
    return { node, shadow };
  }
  async function send(message) {
    try {
      const response = await chrome.runtime.sendMessage(message);
      return response?.ok ? response.value : null;
    } catch {
      dead = true;
      cleanup();
      return null;
    }
  }
  function postText(node) {
    // innerText changes when a post is collapsed. Read the same text before/after
    // hiding, preserve line breaks/emoji, and exclude non-visible helper content.
    const copy = node.cloneNode(true);
    for (const hidden of copy.querySelectorAll('[aria-hidden="true"], [hidden], script, style, [data-testid="tweet-text-show-more-link"]')) hidden.remove();
    for (const image of copy.querySelectorAll('img')) image.replaceWith(document.createTextNode(image.alt || ""));
    for (const br of copy.querySelectorAll('br')) br.replaceWith(document.createTextNode("\n"));
    return copy.textContent.trim();
  }
  function tweetFor(article) {
    if (!article.closest('[data-testid="primaryColumn"]') || article.closest('[role="dialog"], [contenteditable]:not([contenteditable="false"]), [data-testid="DMDrawer"]')) return null;
    if (article.querySelector('[contenteditable]:not([contenteditable="false"]), [data-testid^="tweetTextarea_"], [data-testid="dmComposerTextInput"]')) return null;
    const header = article.querySelector('[data-testid="User-Name"]');
    if (!header) return null;
    const timestamp = Array.from(article.querySelectorAll('a[href*="/status/"]')).find(link => link.querySelector('time') && !link.closest('[data-testid="quoteTweet"], div[role="link"][tabindex="0"]'));
    const url = (header.querySelector('a[href*="/status/"]') || timestamp)?.getAttribute("href");
    let id = url?.match(/\/status\/(\d+)/)?.[1];
    const detail = postRoute();
    // Expanded posts can move the timestamp out of User-Name. If it is absent,
    // use the opened post's route only when its author matches the header.
    if (!id && detail) {
      const author = header.querySelector('a[href]')?.getAttribute("href")?.replace(/\/$/, "");
      if (author?.toLowerCase() === `/${detail[1]}`.toLowerCase()) id = detail[2];
    }
    if (!id) return null;
    const texts = Array.from(article.querySelectorAll('[data-testid="tweetText"]')).filter(node => node.closest('article[data-testid="tweet"]') === article);
    // Quotes are context, never independent classification targets. Read loaded
    // post text even before expansion; a quote's Show more never blocks its parent.
    const first = texts[0];
    if (!first || first.closest('[data-testid="quoteTweet"], div[role="link"][tabindex="0"]')) return null;
    const truncated = Array.from(article.querySelectorAll('[data-testid="tweet-text-show-more-link"]')).some(node =>
      node.closest('article[data-testid="tweet"]') === article && !node.closest('[data-testid="quoteTweet"], div[role="link"][tabindex="0"]')
    );
    const text = postText(first);
    const quoted = texts.slice(1).map(postText).join("\n");
    if (text.length < 12 || text.length > 6000 || quoted.length > 3000) return null;
    return { header, tweet: { id, text, quoted, truncated }, signature: JSON.stringify([id, text, quoted, truncated]) };
  }
  function flags(rec) {
    return Object.entries(rec.scores || {}).filter(([key, p]) => labels[key] && p >= 0.7).sort((a, b) => b[1] - a[1]);
  }
  function restore(rec) {
    if (rec.hidden) {
      for (const { node, display, priority } of rec.hidden) {
        if (node.style.getPropertyValue("display") !== "none") continue;
        if (display) node.style.setProperty("display", display, priority);
        else node.style.removeProperty("display");
      }
      rec.hidden = null;
    }
    rec.notice?.remove();
    rec.notice = null;
  }
  function removeUI(rec) {
    closePanel(rec, false);
    restore(rec);
    rec.badge?.remove();
    rec.badge = null;
    if (rec.header) sizing.unobserve(rec.header);
  }
  function cleanup() {
    for (const rec of records.values()) {
      removeUI(rec);
      visibility.unobserve(rec.article);
    }
    records.clear();
  }
  function closePanel(rec, focus = true) {
    if (!rec.panel) return;
    rec.panel.remove();
    rec.panel = null;
    rec.button?.setAttribute("aria-expanded", "false");
    if (rec.dismiss) document.removeEventListener("pointerdown", rec.dismiss, true);
    if (rec.escape) document.removeEventListener("keydown", rec.escape, true);
    rec.dismiss = null;
    rec.escape = null;
    if (focus) rec.button?.focus();
  }
  function openPanel(rec) {
    if (rec.panel) return closePanel(rec);
    for (const other of records.values()) closePanel(other, false);
    const { node, shadow } = host("feed-referee-panel");
    node.style.cssText = "position:fixed;z-index:2147483646;display:block;width:min(330px,calc(100vw - 24px));";
    const card = el("section", undefined, "card");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Feed Referee judgment");
    const head = el("header");
    const close = el("button", "×", "close");
    close.type = "button"; close.setAttribute("aria-label", "Close judgment");
    close.addEventListener("click", () => closePanel(rec));
    head.append(el("h2", "Feed Referee"), close);
    const list = el("ul");
    for (const [key, probability] of flags(rec)) {
      const item = el("li");
      const strong = el("strong");
      strong.append(el("span", labels[key][0]), el("span", `${Math.round(probability * 100)}%`));
      item.append(strong, el("p", labels[key][1]));
      list.append(item);
    }
    card.append(head, list, el("p", "These are Jev’s probability estimates, not verified facts. The descriptions explain each label, not why Jev assigned it.", "muted rule"), el("p", "Visible text only. Images, videos, and linked pages are not evaluated. Controls are in the extension popup.", "muted"));
    if (rec.tweet.truncated) card.append(el("p", "Based on the text X has loaded so far. Expanding the post can update this judgment.", "muted"));
    shadow.append(card);
    document.body.append(node);
    rec.panel = node;
    rec.button.setAttribute("aria-expanded", "true");
    const position = () => {
      const box = rec.badge?.getBoundingClientRect();
      if (!box) return;
      const height = node.getBoundingClientRect().height;
      node.style.left = `${Math.max(12, Math.min(box.left, innerWidth - node.getBoundingClientRect().width - 12))}px`;
      node.style.top = `${Math.max(12, box.bottom + height + 12 <= innerHeight ? box.bottom + 8 : box.top - height - 8)}px`;
    };
    position();
    rec.dismiss = event => { if (!event.composedPath().includes(node) && !event.composedPath().includes(rec.badge)) closePanel(rec, false); };
    rec.escape = event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closePanel(rec); } };
    document.addEventListener("pointerdown", rec.dismiss, true);
    document.addEventListener("keydown", rec.escape, true);
    close.focus();
  }
  function render(rec) {
    if (!canRun() || !rec.article.isConnected || !rec.scores) return;
    const found = flags(rec);
    if (!found.length) return;
    if (!rec.badge?.isConnected) {
      const { node, shadow } = host("feed-referee-badge");
      node.style.cssText = "display:inline-flex;align-self:center;align-items:center;flex:0 0 auto;margin-inline-start:6px;vertical-align:middle;height:18px;max-width:min(160px,40%);min-width:0;";
      const [key, probability] = found[0];
      const button = el("button", undefined, "badge");
      button.type = "button";
      button.dataset.label = key;
      button.setAttribute("aria-label", `Feed Referee: ${found.map(([k, p]) => `${labels[k][0]} ${Math.round(p * 100)} percent`).join(", ")}. View judgment.`);
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-expanded", "false");
      button.title = button.getAttribute("aria-label");
      button.append(el("span", labels[key][0], "label"), el("span", `· ${Math.round(probability * 100)}%`, "probability"));
      if (found.length > 1) button.append(el("span", `+${found.length - 1}`, "extra"));
      button.addEventListener("click", event => { event.preventDefault(); openPanel(rec); });
      shadow.append(button);
      // Inline with display name / @handle, not underneath the tweet or in its action bar.
      // Detail pages may stack name and handle vertically. Keep the badge in
      // the name row rather than adding a third line beneath the handle.
      let mount = rec.header;
      if (getComputedStyle(mount).flexDirection === "column") {
        const name = mount.querySelector('a[href]');
        for (let row = name?.parentElement; row && row !== mount; row = row.parentElement) {
          if (getComputedStyle(row).flexDirection === "row") { mount = row; break; }
        }
      }
      mount.append(node);
      rec.badge = node;
      rec.button = button;
      node.toggleAttribute("compact", rec.header.getBoundingClientRect().width < 360);
      sizing.observe(rec.header);
    }
    const collapse = !postRoute() && state.settings.collapse && state.settings.filters.some(key => rec.scores[key] >= state.settings.threshold);
    if (rec.notice && !rec.notice.isConnected) restore(rec);
    if (collapse && !rec.revealed && !rec.notice) {
      closePanel(rec, false);
      const { node, shadow } = host("feed-referee-collapse");
      node.style.cssText = "display:block;flex:1;min-width:0;padding:12px 0;";
      const notice = el("div", undefined, "notice");
      const show = el("button", "Show tweet", "show");
      show.type = "button";
      show.addEventListener("click", () => { rec.revealed = true; restore(rec); rec.button?.focus(); });
      notice.append(el("span", `Feed Referee · ${found.map(([key]) => labels[key][0]).join(" / ")}`), show);
      shadow.append(notice);
      // Keep the article measurable for X's virtualized timeline. Hide its
      // contents, not the article that X observes for height/impressions.
      rec.hidden = Array.from(rec.article.children).map(child => ({
        node: child, display: child.style.getPropertyValue("display"), priority: child.style.getPropertyPriority("display"),
      }));
      for (const { node: child } of rec.hidden) child.style.setProperty("display", "none", "important");
      rec.article.prepend(node);
      rec.notice = node;
    } else if (!collapse) restore(rec);
  }
  function updateTheme() {
    let color = getComputedStyle(document.body).backgroundColor;
    if (color === "rgba(0, 0, 0, 0)") color = getComputedStyle(document.documentElement).backgroundColor;
    const rgb = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    const luminance = rgb?.length === 3 ? rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722 : 255;
    const next = luminance < 10 ? "dark" : luminance < 130 ? "dim" : "light";
    if (next !== theme) {
      theme = next;
      for (const node of document.querySelectorAll("feed-referee-badge,feed-referee-panel,feed-referee-collapse")) node.setAttribute("theme", theme);
    }
  }
  const sizing = new ResizeObserver(entries => {
    for (const entry of entries) {
      const badge = entry.target.querySelector('feed-referee-badge');
      badge?.toggleAttribute("compact", entry.contentRect.width < 360);
    }
  });
  const visibility = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const rec = records.get(entry.target);
      if (!rec) continue;
      rec.visible = entry.isIntersecting && entry.intersectionRatio > 0;
      if (rec.visible) rec.since = Date.now();
    }
  }, { threshold: [0, .1] });
  function scan() {
    scanning = false;
    syncRoute();
    if (!canRun()) return;
    updateTheme();
    for (const [article, rec] of records) {
      if (!article.isConnected || !article.matches('article[data-testid="tweet"]') || !article.closest('[data-testid="primaryColumn"]') || article.closest('[role="dialog"]')) {
        removeUI(rec); visibility.unobserve(article); records.delete(article);
      }
    }
    for (const article of document.querySelectorAll('[data-testid="primaryColumn"] article[data-testid="tweet"]')) {
      const data = tweetFor(article);
      const previous = records.get(article);
      if (!data || (previous && (previous.signature !== data.signature || previous.header !== data.header))) {
        if (previous) { removeUI(previous); visibility.unobserve(article); records.delete(article); }
        if (!data) continue;
      }
      if (!records.has(article)) {
        const rec = { article, ...data, visible: false, since: Date.now(), retryAt: 0, failures: 0, scores: null, pending: false, revealed: false };
        records.set(article, rec);
        visibility.observe(article);
      } else if (previous?.scores) render(previous);
    }
    pump();
  }
  function schedule() {
    if (scanning || !canRun()) return;
    scanning = true;
    setTimeout(scan, 160);
  }
  async function evaluate(rec) {
    rec.pending = true;
    active++;
    try {
      const result = await send({ type: "referee:evaluate", tweet: rec.tweet });
      if (!canRun() || !rec.article.isConnected || records.get(rec.article) !== rec) return;
      const now = tweetFor(rec.article);
      if (!now || now.signature !== rec.signature) return schedule();
      if (result?.scores) { rec.scores = result.scores; render(rec); }
      else {
        const code = result?.error;
        if (code === "busy") rec.retryAt = Date.now() + 2000 + Math.random() * 1000;
        else if (code === "budget") rec.retryAt = new Date().setUTCHours(24, 0, 0, 0);
        else if (code === "paused" || code === "auth" || code === "rejected") rec.retryAt = Date.now() + 30_000;
        else {
          rec.failures++;
          rec.retryAt = rec.failures >= 3 ? Infinity : Math.max(result?.retryAt || 0, Date.now() + 30_000 * 2 ** (rec.failures - 1));
        }
      }
    } finally { rec.pending = false; active--; }
  }
  function pump() {
    if (!canRun() || document.visibilityState !== "visible") return;
    for (const rec of records.values()) {
      if (active >= 2) break;
      if (!rec.visible || rec.scores || rec.pending || rec.retryAt > Date.now() || Date.now() - rec.since < 600) continue;
      const current = tweetFor(rec.article);
      if (!current || current.signature !== rec.signature || current.header !== rec.header) { schedule(); continue; }
      evaluate(rec);
    }
  }
  function apply(value) {
    const resumed = !state?.running && value.running;
    state = value;
    if (!canRun()) return cleanup();
    for (const rec of records.values()) {
      // A worker error broadcast must not cancel another post's retry delay.
      if (resumed) { rec.retryAt = 0; rec.failures = 0; }
      render(rec);
    }
    schedule();
  }
  chrome.runtime.onMessage.addListener(message => {
    if (message.type === "referee:state") apply(message.value);
  });
  new MutationObserver(mutations => {
    if (mutations.some(mutation => !own(mutation.target))) schedule();
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["href", "data-testid"] });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      for (const rec of records.values()) rec.since = Date.now();
      schedule();
    }
  });
  window.addEventListener("scroll", () => { for (const rec of records.values()) closePanel(rec, false); }, { passive: true });
  window.addEventListener("resize", () => { for (const rec of records.values()) closePanel(rec, false); schedule(); });
  function syncRoute() {
    if (dead || location.pathname === route) return;
    route = location.pathname;
    cleanup();
    if (supportedRoute()) send({ type: "referee:get" }).then(value => { if (value) apply(value); });
  }
  window.addEventListener("popstate", syncRoute);
  window.addEventListener("pageshow", () => {
    if (!dead && supportedRoute()) send({ type: "referee:get" }).then(value => { if (value) apply(value); });
  });
  setInterval(() => {
    if (dead) return;
    syncRoute();
    if (canRun()) { updateTheme(); pump(); }
  }, 750);
  setInterval(() => {
    if (!dead && supportedRoute()) send({ type: "referee:get" }).then(value => {
      if (value && (value.running !== state?.running || JSON.stringify(value.settings) !== JSON.stringify(state?.settings))) apply(value);
    });
  }, 15_000);
})();
