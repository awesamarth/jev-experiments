import { describe, expect, test } from "bun:test";
import { DEFAULTS, cacheKey, flagsFor, isTimeline, parseScores, requestFor, settingsFrom, shouldCollapse, validTweet } from "../extensions/feed-referee/core.js";
const tweet = { id: "1234567890", text: "A concrete update on our project.", quoted: "" };

describe("Feed Referee boundaries", () => {
  test("starts paused, sanitizes controls, clamps budgets", () => {
    expect(settingsFrom()).toEqual(DEFAULTS);
    expect(DEFAULTS.dailyLimit).toBe(2000);
    expect(settingsFrom({ dailyLimit: 200 }).dailyLimit).toBe(200); // Preserve explicit saved budgets.
    expect(settingsFrom({ filters: ["formulaic", "promo"] }).filters).toEqual(["promo"]); // Never reinterpret an old collapse choice.
    expect(settingsFrom({ dailyLimit: 1000000, threshold: 0, filters: ["promo", "bad", "promo"] })).toMatchObject({ dailyLimit: 2000, threshold: 0.7, filters: ["promo"] });
  });
  test("X tweet pages allowed; private/composer routes and impostor origins excluded", () => {
    for (const path of ["/home", "/someone", "/someone/with_replies", "/someone/status/10000", "/search?q=hello", "/i/bookmarks", "/i/lists/12345", "/explore", "/notifications"]) expect(isTimeline(`https://x.com${path}`)).toBe(true);
    expect(isTimeline("https://twitter.com/home/?a=1")).toBe(true);
    for (const path of ["/messages", "/messages/12345", "/i/chat/12345", "/compose/post", "/i/flow/login", "/settings", "/%6dessages"]) expect(isTimeline(`https://x.com${path}`)).toBe(false);
    for (const url of ["https://x.com.evil.test/home", "http://x.com/home", "not a url"]) expect(isTimeline(url)).toBe(false);
  });
  test("validates text/id lengths before inference", () => {
    expect(validTweet(tweet)).toBe(true);
    expect(validTweet({ ...tweet, id: "javascript:bad" })).toBe(false);
    expect(validTweet({ ...tweet, text: "hi" })).toBe(false);
    expect(validTweet({ ...tweet, text: "x".repeat(6001) })).toBe(false);
    expect(validTweet({ ...tweet, quoted: "x".repeat(3001) })).toBe(false);
  });
  test("cache changes when post or quoted context changes", async () => {
    const key = await cacheKey(tweet);
    expect(key).toMatch(/^cache:[a-f0-9]{64}$/);
    expect(await cacheKey({ ...tweet })).toBe(key);
    expect(await cacheKey({ ...tweet, truncated: false })).toBe(key);
    expect(await cacheKey({ ...tweet, truncated: true })).not.toBe(key);
    expect(await cacheKey({ ...tweet, text: tweet.text + " edited" })).not.toBe(key);
    expect(await cacheKey({ ...tweet, quoted: "Context changes the meaning." })).not.toBe(key);
  });
  test("no external author or tweet ID in API payload; independent questions", () => {
    const request = requestFor(tweet);
    expect(request.state).toEqual({ post: tweet.text, quoted_context: null });
    const partial = requestFor({ ...tweet, truncated: true });
    expect(partial.state.post_is_truncated).toBe(true);
    expect(partial.questions.ragebait.instructions).toContain("do not invent the omitted ending");
    expect(partial.questions.ai_generated.instructions.partial_text).toContain("do not invent the omitted ending");
    expect(Object.keys(request.questions)).toEqual(["ragebait", "promo", "ai_generated", "engagement_farming"]);
    expect(request.questions.engagement_farming.instructions).toContain("primarily engagement farming");
    expect(request.questions.ai_generated.instructions.question).toContain("recognizable style");
    expect(Object.values(request.questions).every(question => question.type === "noul")).toBe(true);
  });
  test("rejects partial/malformed probabilities, rather than fabricating labels", () => {
    const answers = Object.fromEntries(["ragebait", "promo", "ai_generated", "engagement_farming"].map(key => [key, { type: "noul", noul: 0.7 }]));
    expect(parseScores({ answers })).toEqual({ ragebait: 0.7, promo: 0.7, ai_generated: 0.7, engagement_farming: 0.7 });
    expect(() => parseScores({ answers: { ragebait: answers.ragebait, promo: answers.promo, formulaic: answers.ai_generated } })).toThrow();
    for (const noul of [-1, 2, "0.5", null, NaN]) expect(() => parseScores({ answers: { ...answers, promo: { type: "noul", noul } } })).toThrow();
    expect(() => parseScores({ answers: {} })).toThrow();
  });
  test("independent labels, optional collapse, and inclusive thresholds", () => {
    const scores = { ragebait: 0.95, promo: 0.85, ai_generated: 0.2, engagement_farming: 0.3 };
    expect(flagsFor(scores)).toEqual([["ragebait", 0.95], ["promo", 0.85]]);
    expect(shouldCollapse(scores, DEFAULTS)).toBe(false);
    expect(shouldCollapse(scores, { ...DEFAULTS, enabled: true, collapse: true })).toBe(true);
    expect(shouldCollapse(scores, { ...DEFAULTS, enabled: true, collapse: true, filters: ["ai_generated", "engagement_farming"] })).toBe(false);
  });
});
