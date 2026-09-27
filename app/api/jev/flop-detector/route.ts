type JevResponse = {
  model: string;
  answers: { will_bang?: { type: "noul"; noul: number } };
};

async function callJev(apiKey: string, tweet: string) {
  const body = JSON.stringify({
    state: { tweet },
    model: "jev-latest",
    questions: {
      will_bang: {
        type: "noul",
        instructions: "Is this tweet going to bang?",
        criteria: {
          true: "The text of `tweet` alone is likely to be compelling, memorable, or worth sharing to a general X audience.",
          false: "The text of `tweet` alone is unlikely to stand out or engage a general X audience. Do not assume any follower count, posting time, or algorithmic boost.",
        },
      },
    },
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if ((response.status === 429 || response.status === 529) && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      continue;
    }

    return response;
  }

  throw new Error("Jev request failed");
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const tweet =
    typeof payload === "object" &&
    payload !== null &&
    "tweet" in payload &&
    typeof payload.tweet === "string"
      ? payload.tweet.trim()
      : "";

  if (tweet.length < 1 || tweet.length > 280) {
    return Response.json(
      { error: "Write a tweet between 1 and 280 characters." },
      { status: 400 },
    );
  }

  const apiKey = process.env.TYPESAFE_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "The Jev API key is not configured." }, { status: 500 });
  }

  try {
    const response = await callJev(apiKey, tweet);

    if (!response.ok) {
      console.error("Jev Banger Alert request failed", response.status);
      return Response.json(
        { error: "Jev couldn't score this draft. Try again." },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const result = (await response.json()) as JevResponse;
    const probability = result.answers?.will_bang?.noul;

    if (
      result.answers?.will_bang?.type !== "noul" ||
      typeof probability !== "number" ||
      !Number.isFinite(probability) ||
      probability < 0 ||
      probability > 1
    ) {
      throw new Error("Unexpected Jev response shape");
    }

    const score = Math.round(probability * 100);
    const verdict = score > 70 ? "banger" : score >= 30 ? "mid" : "flop";

    return Response.json({ score, verdict, model: result.model });
  } catch (error) {
    console.error("Banger Alert error", error);
    return Response.json({ error: "Jev couldn't score this draft. Try again." }, { status: 502 });
  }
}
