import type { AccountReport, AccountPost, AccountScores } from "@/lib/account-scorer";

type FxProfile = {
  name?: string;
  screen_name?: string;
  description?: string;
  avatar_url?: string;
  followers?: number;
  protected?: boolean;
};

type FxPost = {
  id?: string;
  text?: string;
  created_at?: string;
  author?: { screen_name?: string };
  replying_to?: unknown;
  replying_to_status?: unknown;
  reposted_by?: unknown;
};

type FxResponse = {
  code?: number;
  user?: FxProfile;
  results?: FxPost[];
  cursor?: { bottom?: string };
};

type JevScoreAnswer = { type: "score"; score: number };
type JevResponse = { model: string; answers: Record<string, JevScoreAnswer> };
type Dimension = keyof AccountScores;

const reportCache = new Map<string, { report: AccountReport; expiresAt: number }>();
const REPORT_TTL_MS = 5 * 60_000;

const dimensions: Record<Dimension, { instructions: string; criteria: string[]; weight: number }> = {
  signal: {
    instructions: "How much useful insight or substance is present in these X posts? Judge their text, not likes or follower count.",
    criteria: [
      "Almost no substance: empty reactions, generic announcements, or filler.",
      "Occasional useful point, but most posts offer little beyond a basic observation.",
      "Some concrete ideas or helpful observations mixed with routine posts.",
      "Most posts offer specific insights, useful detail, or perspectives worth reading.",
      "Consistently rich, specific ideas or useful information that readers can take away.",
    ],
    weight: 0.35,
  },
  originality: {
    instructions: "How original are the ideas and phrasing in these X posts? Judge the supplied text only.",
    criteria: [
      "Mostly recycled slogans, copied talking points, or boilerplate.",
      "Familiar ideas with little distinctive phrasing or perspective.",
      "Mix of familiar ideas and some personal or distinctive observations.",
      "Frequently brings a distinct perspective, concrete experience, or fresh phrasing.",
      "Consistently surprising, clearly individual thinking or unmistakable voice.",
    ],
    weight: 0.3,
  },
  clarity: {
    instructions: "How clearly do these X posts communicate their point to a reader? Judge the supplied text only.",
    criteria: [
      "Usually hard to follow or missing the context needed to understand the point.",
      "Many posts are vague, rambling, or difficult to parse.",
      "Generally understandable, though some posts lack context or precision.",
      "Most posts are easy to follow, well framed, and concise enough for the idea.",
      "Consistently crisp and immediately comprehensible without losing nuance.",
    ],
    weight: 0.2,
  },
  habits: {
    instructions: "How healthy are this account's posting habits in the supplied X posts? Look for variety, genuine engagement, and repetitive promotion; do not guess about posts outside this sample.",
    criteria: [
      "Almost entirely repetitive spam, self-promotion, or low-effort engagement bait.",
      "Mostly repetitive promotion or very similar low-effort posts.",
      "Mixed: some authentic contributions, some repetition or promotion.",
      "Mostly varied, intentional posting or genuine participation with limited repetition.",
      "Consistently varied, thoughtful contributions without repetitive promotion or bait.",
    ],
    weight: 0.15,
  },
};

function normalizeHandle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let handle = value.trim().replace(/^@/, "");
  if (/^https?:\/\//i.test(handle)) {
    try {
      const url = new URL(handle);
      if (!["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname.toLowerCase())) return null;
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length !== 1) return null;
      handle = parts[0];
    } catch {
      return null;
    }
  }
  return /^[A-Za-z0-9_]{1,15}$/.test(handle) ? handle : null;
}

async function fxGet(path: string): Promise<FxResponse> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`https://api.fxtwitter.com/2/profile/${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(9_000),
    });
    if (response.status === 429) throw new Error("FxTwitter rate limited");
    const data = (await response.json()) as FxResponse;
    if (response.ok && data.code === 200) return data;
    // FxTwitter sometimes returns a transient 404 for an otherwise valid timeline page.
    if (attempt === 0 && (response.status === 404 || response.status >= 500 || data.code === 404)) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      continue;
    }
    throw new Error(`FxTwitter HTTP ${response.status}, code ${data.code ?? "unknown"}`);
  }
  throw new Error("FxTwitter unavailable");
}

async function fetchAccount(handle: string): Promise<{ profile: FxProfile; posts: AccountPost[]; replies: AccountPost[] }> {
  const encoded = encodeURIComponent(handle);
  const [profileResult, firstPageResult] = await Promise.allSettled([
    fxGet(encoded),
    fxGet(`${encoded}/statuses?count=40&with_replies=true`),
  ]);

  if (profileResult.status === "rejected" || firstPageResult.status === "rejected") {
    throw new Error("FxTwitter profile or timeline unavailable");
  }

  const profile = profileResult.value.user;
  if (!profile || profile.protected) throw new Error("Public profile unavailable");

  const posts: AccountPost[] = [];
  const replies: AccountPost[] = [];
  const seen = new Set<string>();
  let page = firstPageResult.value;

  for (let pageNumber = 0; pageNumber < 6; pageNumber += 1) {
    if (!Array.isArray(page.results)) throw new Error("FxTwitter timeline unavailable");

    for (const post of page.results) {
      if (!post.id || !post.text || seen.has(post.id) || post.reposted_by) continue;
      if (post.author?.screen_name?.toLowerCase() !== handle.toLowerCase()) continue;
      seen.add(post.id);
      const isReply = Boolean(post.replying_to || post.replying_to_status);
      const bucket = isReply ? replies : posts;
      const limit = isReply ? 15 : 25;
      if (bucket.length >= limit) continue;
      if (post.text.replace(/https?:\/\/\S+/g, "").trim().length < 15) continue;
      bucket.push({
        id: post.id,
        text: post.text.slice(0, 600),
        date: post.created_at ?? "",
        url: `https://x.com/${handle}/status/${post.id}`,
      });
    }

    if ((posts.length >= 25 && replies.length >= 15) || !page.cursor?.bottom) break;
    const params = new URLSearchParams({ count: "40", with_replies: "true", cursor: page.cursor.bottom });
    try {
      page = await fxGet(`${encoded}/statuses?${params}`);
    } catch (error) {
      // Don't discard a usable sample when a later cursor intermittently fails.
      if (posts.length + replies.length >= 10 && posts.length >= 3) break;
      throw error;
    }
  }

  if (posts.length + replies.length < 10 || posts.length < 3) {
    throw new Error("Not enough original public posts to score this account");
  }

  return { profile, posts, replies };
}

async function evaluateAccount(apiKey: string, posts: AccountPost[], replies: AccountPost[]) {
  const questions: Record<string, { type: "score"; instructions: string; criteria: string[] }> = {};
  for (const group of (["posts", "replies"] as const)) {
    if (group === "replies" && replies.length === 0) continue;
    for (const [dimension, definition] of Object.entries(dimensions)) {
      questions[`${group}_${dimension}`] = {
        type: "score",
        instructions: `${definition.instructions} Evaluate only \`${group}\`.`,
        criteria: definition.criteria,
      };
    }
  }

  const response = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      state: {
        posts: posts.map(({ text, date }) => ({ text, date })),
        ...(replies.length ? { replies: replies.map(({ text, date }) => ({ text, date })) } : {}),
      },
      model: "jev-latest",
      questions,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) throw new Error(`Jev HTTP ${response.status}`);
  const result = (await response.json()) as JevResponse;
  const scores = {} as AccountScores;
  const replyWeight = replies.length ? 0.3 : 0;

  for (const dimension of Object.keys(dimensions) as Dimension[]) {
    const primary = result.answers?.[`posts_${dimension}`];
    const conversational = replies.length ? result.answers?.[`replies_${dimension}`] : null;
    if (
      primary?.type !== "score" ||
      !Number.isFinite(primary.score) || primary.score < 0 || primary.score > 4 ||
      (replies.length && (conversational?.type !== "score" || !Number.isFinite(conversational.score) || conversational.score < 0 || conversational.score > 4))
    ) {
      throw new Error("Unexpected Jev score response");
    }
    scores[dimension] = Math.round(((primary.score * (1 - replyWeight)) + ((conversational?.score ?? 0) * replyWeight)) * 25);
  }

  const overall = Math.round((Object.keys(dimensions) as Dimension[]).reduce(
    (sum, dimension) => sum + scores[dimension] * dimensions[dimension].weight, 0,
  ));
  return { scores, overall, model: result.model };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const handle = normalizeHandle(
    typeof payload === "object" && payload !== null && "handle" in payload ? payload.handle : null,
  );
  if (!handle) {
    return Response.json({ error: "Enter a valid public X handle." }, { status: 400 });
  }
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) return Response.json({ error: "The Jev API key is not configured." }, { status: 500 });

  const cacheKey = handle.toLowerCase();
  const cached = reportCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return Response.json(cached.report);

  try {
    const { profile, posts, replies } = await fetchAccount(handle);
    const { scores, overall, model } = await evaluateAccount(apiKey, posts, replies);
    const report: AccountReport = {
      handle: profile.screen_name ?? handle,
      name: profile.name ?? handle,
      bio: profile.description ?? "",
      avatar: profile.avatar_url ?? "",
      followers: profile.followers ?? null,
      posts,
      replies,
      scores,
      overall,
      model,
    };
    if (reportCache.size >= 100) reportCache.delete(reportCache.keys().next().value!);
    reportCache.set(cacheKey, { report, expiresAt: Date.now() + REPORT_TTL_MS });
    return Response.json(report);
  } catch (error) {
    console.error("Account Scorer error", error);
    const insufficient = error instanceof Error && error.message.includes("Not enough original");
    return Response.json(
      { error: insufficient ? "Not enough public posts to score this account." : "Couldn't fetch or score this account right now. Try again." },
      { status: insufficient ? 422 : 502 },
    );
  }
}
