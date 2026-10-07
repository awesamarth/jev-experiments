import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, setDefaultTimeout } from "bun:test";
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { fixture, tweet } from "./fixtures/feed-referee.js";

// Dwell/backoff/navigation checks intentionally cross several real timer ticks.
setDefaultTimeout(15_000);
let browser, page, context;
const content = await readFile(new URL("../extensions/feed-referee/content.js", import.meta.url), "utf8");
beforeAll(async () => { browser = await chromium.launch({ headless: true }); });
afterAll(async () => { await browser?.close(); });
beforeEach(async () => {
  context = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  page = await context.newPage();
  await context.route("**/*", route => route.request().url() === "https://x.com/home"
    ? route.fulfill({ contentType: "text/html", body: fixture() }) : route.abort());
  await page.goto("https://x.com/home");
  await page.evaluate(() => {
    window.calls = []; window.listeners = []; window.waiting = []; window.hold = false;
    window.scores = { ragebait: .91, promo: .78, ai_generated: .1, engagement_farming: .2 };
    window.state = { running: true, settings: { collapse: false, filters: ["ragebait", "promo", "ai_generated", "engagement_farming"], threshold: .85 } };
    window.broadcast = () => window.listeners.forEach(fn => fn({ type: "referee:state", value: structuredClone(window.state) }));
    window.chrome = { runtime: {
      onMessage: { addListener: fn => window.listeners.push(fn) },
      sendMessage: async message => {
        if (message.type === "referee:get") return { ok: true, value: structuredClone(window.state) };
        window.calls.push(message.tweet);
        if (window.hold) return await new Promise(resolve => window.waiting.push(resolve));
        return { ok: true, value: window.error || { scores: window.scores } };
      },
    } };
    // Test-only reference to closed roots; production roots stay closed.
    window.roots = new WeakMap();
    const attach = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (options) {
      const root = attach.call(this, options); window.roots.set(this, root); return root;
    };
  });
});
afterEach(async () => { await context?.close(); });
const start = () => page.addScriptTag({ content });
const badge = () => page.waitForFunction(() => document.querySelector("feed-referee-badge"));
const clickControl = selector => page.evaluate(selector => window.roots.get(document.querySelector(selector)).querySelector("button").click(), selector);

describe("Feed Referee offline DOM — synthetic scores, no API calls", () => {
  test("same-row badge stays clear of timestamp/menu at desktop and narrow widths", async () => {
    await start(); await badge();
    for (const width of [1100, 600, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
      const geometry = await page.evaluate(() => {
        const b = document.querySelector("feed-referee-badge");
        const rect = node => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, y: r.y + r.height / 2, width: r.width }; };
        return { b: rect(b), t: rect(b.parentElement.querySelector("time")), menu: rect(document.querySelector('[data-testid="caret"]')), inQuote: !!b.closest('[role="link"]') };
      });
      expect(geometry.b.left).toBeGreaterThanOrEqual(geometry.t.right);
      expect(geometry.b.right).toBeLessThanOrEqual(geometry.menu.left);
      expect(Math.abs(geometry.b.y - geometry.t.y)).toBeLessThan(2);
      expect(geometry.b.width).toBeGreaterThan(30);
      expect(geometry.inQuote).toBe(false);
    }
    expect(await page.evaluate(() => window.calls[0].quoted)).toContain("Synthetic quoted words");
    expect(await page.locator("feed-referee-badge").count()).toBe(1);
  });

  test("collapse preserves article measurement, restores contents and does not reclassify", async () => {
    await page.evaluate(() => { window.state.settings.collapse = true; document.querySelector('article > div').style.display = "flex"; });
    await start(); await page.waitForSelector("feed-referee-collapse");
    expect(await page.locator("article").evaluate(a => a.getBoundingClientRect().height)).toBeGreaterThan(30);
    expect(await page.locator('article > div').evaluate(n => getComputedStyle(n).display)).toBe("none");
    // Force rescanning while hidden; the text/signature must remain unchanged.
    await page.evaluate(() => document.querySelector('time').textContent = "4h");
    await page.waitForTimeout(450);
    expect(await page.evaluate(() => window.calls.length)).toBe(1);
    await clickControl("feed-referee-collapse");
    expect(await page.locator("feed-referee-collapse").count()).toBe(0);
    expect(await page.locator('article > div').evaluate(n => n.style.display)).toBe("flex");
    await page.evaluate(() => window.broadcast());
    expect(await page.locator("feed-referee-collapse").count()).toBe(0);
    await page.evaluate(() => { window.state.running = false; window.broadcast(); });
    expect(await page.locator("feed-referee-badge").count()).toBe(0);
  });

  test("details handle Escape/focus without triggering native tweet clicks", async () => {
    await start(); await badge();
    await page.evaluate(() => {
      window.nativeClicks = 0;
      document.querySelector('article').addEventListener('click', () => window.nativeClicks++);
    });
    await clickControl("feed-referee-badge");
    expect(await page.locator("feed-referee-panel").count()).toBe(1);
    expect(await page.evaluate(() => window.nativeClicks)).toBe(0);
    await page.keyboard.press("Escape");
    expect(await page.locator("feed-referee-panel").count()).toBe(0);
    expect(await page.evaluate(() => document.activeElement.tagName)).toBe("FEED-REFEREE-BADGE");
    await page.locator('[data-testid="like"]').click();
    expect(await page.evaluate(() => window.nativeClicks)).toBe(1);
  });

  test("skips quote-only, media-only, dialog and sidebar posts", async () => {
    await page.locator('main').evaluate((main, html) => main.innerHTML = html, [
      tweet({ id: "10001", quoteOnly: true }),
      tweet({ id: "10003", text: "" }), `<div role="dialog">${tweet({ id: "10004" })}</div>`,
      tweet({ id: "10006", text: '<span contenteditable="true">Private synthetic draft, never send this.</span>' }),
    ].join(""));
    await page.evaluate(html => { const aside = document.createElement('aside'); aside.innerHTML = html; document.body.append(aside); }, tweet({ id: "10005" }));
    await start(); await page.waitForTimeout(1700);
    expect(await page.evaluate(() => window.calls.length)).toBe(0);
  });

  test("labels loaded text before Show more, updates on expansion, never labels the quote", async () => {
    await page.locator('main').evaluate((main, html) => main.innerHTML = html, tweet({ more: true, quote: true }));
    await page.evaluate(() => {
      const quoteMore = document.createElement('button');
      quoteMore.dataset.testid = 'tweet-text-show-more-link'; quoteMore.textContent = 'Show more';
      document.querySelector('.quote [role="link"]').append(quoteMore);
    });
    await start(); await badge();
    expect(await page.evaluate(() => window.calls[0].truncated)).toBe(true);
    expect(await page.locator('[data-testid="tweet-text-show-more-link"]').count()).toBe(2);
    await page.evaluate(() => {
      document.querySelector('[data-testid="tweetText"]').textContent += ' This is the expanded ending.';
      document.querySelector('[data-testid="tweet-text-show-more-link"]').remove();
    });
    await page.waitForFunction(() => window.calls.length === 2);
    await badge();
    expect(await page.evaluate(() => window.calls[1].truncated)).toBe(false);
    expect(await page.evaluate(() => window.calls[1].text)).toContain('expanded ending');
    expect(await page.locator('.quote feed-referee-badge').count()).toBe(0);
    expect(await page.locator('feed-referee-badge').count()).toBe(1);
  });

  test("href-only recycling removes stale badges and re-evaluates the new ID", async () => {
    await start(); await badge();
    await page.evaluate(() => document.querySelector('[data-testid="User-Name"] time').closest('a').setAttribute('href', '/example/status/20000'));
    await page.waitForFunction(() => window.calls.length === 2);
    await badge();
    expect(await page.evaluate(() => window.calls.map(c => c.id))).toEqual(["10000", "20000"]);
    expect(await page.locator('feed-referee-badge').count()).toBe(1);
  });

  test("late result cannot label recycled content or posts moved into a dialog", async () => {
    await page.evaluate(() => { window.hold = true; });
    await start(); await page.waitForFunction(() => window.waiting.length === 1);
    await page.locator('[data-testid="tweetText"]').first().evaluate(n => n.textContent = "Changed synthetic text while the earlier request was pending.");
    await page.evaluate(() => window.waiting[0]({ ok: true, value: { scores: window.scores } }));
    await page.waitForTimeout(300);
    expect(await page.locator('feed-referee-badge').count()).toBe(0);
    await page.evaluate(() => { const dialog = document.createElement('div'); dialog.role = "dialog"; document.querySelector('main').append(dialog); dialog.append(document.querySelector('article')); });
    await page.waitForTimeout(1000);
    expect(await page.locator('feed-referee-badge').count()).toBe(0);
  });

  test("worker broadcasts respect backoff and route changes restore the feed", async () => {
    await page.evaluate(() => { window.error = { error: "backoff", retryAt: Date.now() + 60000 }; });
    await start(); await page.waitForFunction(() => window.calls.length === 1);
    await page.evaluate(() => window.broadcast());
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.calls.length)).toBe(1);
    await page.evaluate(() => { delete window.error; window.state.running = false; window.broadcast(); window.state.running = true; window.state.settings.collapse = true; window.broadcast(); });
    await page.waitForSelector('feed-referee-collapse');
    await page.evaluate(() => history.pushState({}, '', '/messages'));
    await page.waitForFunction(() => !document.querySelector('feed-referee-collapse'));
    expect(await page.locator('article > div').evaluate(n => getComputedStyle(n).display)).toBe("flex");
  });

  test("remounts badges through Home, expanded post, profile and Back; excludes private routes", async () => {
    await start(); await badge();
    for (const path of ["/example/status/10000", "/example", "/home"]) {
      await page.evaluate(({ path, html }) => {
        history.pushState({}, '', path);
        document.querySelector('main').innerHTML = html;
        if (path.includes('/status/')) document.querySelector('[data-testid="User-Name"] time').closest('a').remove();
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, { path, html: tweet({ quote: true }) });
      await badge();
      expect(await page.locator('feed-referee-badge').count()).toBe(1);
    }
    expect(await page.evaluate(() => window.calls.every(call => call.id === "10000"))).toBe(true);
    const before = await page.evaluate(() => window.calls.length);
    for (const path of ["/i/chat/12345", "/compose/post", "/messages"]) {
      await page.evaluate(path => { history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }, path);
      await page.waitForTimeout(200);
      expect(await page.locator('feed-referee-badge').count()).toBe(0);
    }
    expect(await page.evaluate(() => window.calls.length)).toBe(before);
  });

  test("tracks light, dim and lights-out themes without inference; preserves emoji and breaks", async () => {
    await page.locator('[data-testid="tweetText"]').first().evaluate(n => n.innerHTML = 'Synthetic line<br>Second line <img alt="🙂"><span aria-hidden="true">hidden helper</span>');
    await start(); await badge();
    expect(await page.evaluate(() => window.calls[0].text)).toBe("Synthetic line\nSecond line 🙂");
    for (const [color, theme] of [["#fff", "light"], ["#15202b", "dim"], ["#000", "dark"]]) {
      await page.evaluate(color => { document.body.style.backgroundColor = color; }, color);
      await page.waitForFunction(theme => document.querySelector('feed-referee-badge')?.getAttribute('theme') === theme, theme);
    }
    expect(await page.evaluate(() => window.calls.length)).toBe(1);
  });
});
