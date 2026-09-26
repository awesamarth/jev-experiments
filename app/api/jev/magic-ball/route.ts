import {
  getRandomMagicBallResponse,
  type MagicBallCategory,
} from "@/lib/magic-ball";

type JevChoiceAnswer = {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};

type JevResponse = {
  model: string;
  answers: { fortune?: JevChoiceAnswer };
  usage: { input_tokens: number; output_tokens: number };
};

async function callJev(apiKey: string, question: string) {
  const body = JSON.stringify({
    state: { question },
    model: "jev-latest",
    questions: {
      fortune: {
        type: "choice",
        instructions:
          "Decide whether the best playful Magic 8 Ball answer to `question` is affirmative, neutral, or negative.",
        criteria: {
          affirmative:
            "The answer is yes, advisable, likely, or supported by ordinary knowledge.",
          neutral:
            "The answer is genuinely unclear, balanced, unknowable from the question, or best deferred.",
          negative:
            "The answer is no, inadvisable, unlikely, or contradicted by ordinary knowledge.",
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

  const question =
    typeof payload === "object" &&
    payload !== null &&
    "question" in payload &&
    typeof payload.question === "string"
      ? payload.question.trim()
      : "";

  if (question.length < 3 || question.length > 500) {
    return Response.json(
      { error: "Ask a question between 3 and 500 characters." },
      { status: 400 },
    );
  }

  const apiKey = process.env.TYPESAFE_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "The Jev API key is not configured." },
      { status: 500 },
    );
  }

  try {
    const response = await callJev(apiKey, question);

    if (!response.ok) {
      console.error("Jev Magic Ball request failed", response.status);
      return Response.json(
        { error: "The ball is hazy right now. Try again." },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const result = (await response.json()) as JevResponse;
    const answer = result.answers.fortune;

    if (
      !answer ||
      answer.type !== "choice" ||
      !["affirmative", "neutral", "negative"].includes(answer.choice)
    ) {
      throw new Error("Unexpected Jev response shape");
    }

    const category = answer.choice as MagicBallCategory;

    return Response.json({
      answer: getRandomMagicBallResponse(category),
      category,
      probability: answer.probabilities[category] ?? 0,
      probabilities: {
        affirmative: answer.probabilities.affirmative ?? 0,
        neutral: answer.probabilities.neutral ?? 0,
        negative: answer.probabilities.negative ?? 0,
      },
      confidence: answer.confidence,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error("Magic Ball error", error);
    return Response.json(
      { error: "The ball is hazy right now. Try again." },
      { status: 502 },
    );
  }
}
