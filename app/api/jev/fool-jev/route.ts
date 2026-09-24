import {
  FOOL_JEV_QUESTIONS,
  getFoolJevQuestion,
  type FoolJevExchange,
  type FoolJevQuestionId,
} from "@/lib/fool-jev";

type NoulAnswer = { type: "noul"; noul: number };
type ChoiceAnswer = {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};

type JevResponse = {
  model: string;
  answers: {
    admit?: NoulAnswer;
    next_question?: ChoiceAnswer;
  };
  usage: { input_tokens: number; output_tokens: number };
};

function isQuestionId(value: string): value is FoolJevQuestionId {
  return FOOL_JEV_QUESTIONS.some((question) => question.id === value);
}

async function callJev(apiKey: string, body: string) {
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

  const rawConversation =
    typeof payload === "object" &&
    payload !== null &&
    "conversation" in payload &&
    Array.isArray(payload.conversation)
      ? payload.conversation
      : null;

  if (!rawConversation || rawConversation.length < 1 || rawConversation.length > 10) {
    return Response.json(
      { error: "Conversation must contain between 1 and 10 answers." },
      { status: 400 },
    );
  }

  const conversation: FoolJevExchange[] = [];
  const usedIds = new Set<FoolJevQuestionId>();

  for (const item of rawConversation) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("questionId" in item) ||
      typeof item.questionId !== "string" ||
      !isQuestionId(item.questionId) ||
      !("answer" in item) ||
      typeof item.answer !== "string"
    ) {
      return Response.json({ error: "Invalid conversation entry." }, { status: 400 });
    }

    const answer = item.answer.trim();
    const knownQuestion = getFoolJevQuestion(item.questionId);

    if (!knownQuestion || answer.length < 1 || answer.length > 1000 || usedIds.has(item.questionId)) {
      return Response.json({ error: "Invalid conversation entry." }, { status: 400 });
    }

    usedIds.add(item.questionId);
    conversation.push({
      questionId: item.questionId,
      question: knownQuestion.text,
      answer,
    });
  }

  const remaining = FOOL_JEV_QUESTIONS.filter(
    (question) => !usedIds.has(question.id),
  );

  const questions: Record<string, unknown> = {
    admit: {
      type: "noul",
      instructions:
        "Based on the complete `conversation`, is this visitor plausibly authorized to enter Jumbrella Corporation's restricted biochemical research facility? Judge the visitor's testimony as a high-security biochemical checkpoint guard would.",
      criteria: {
        true: "The story is specific, internally consistent, operationally plausible, responsive to the guard's questions, and demonstrates credible knowledge of clearance, personnel, restricted sectors, and biosafety requirements relevant to the claimed visit.",
        false:
          "The story is vague, evasive, contradictory, operationally implausible, unrelated to the questions, or lacks credible clearance and biosafety details required for entry into a restricted biochemical facility.",
      },
    },
  };

  if (remaining.length > 1) {
    questions.next_question = {
      type: "choice",
      instructions:
        "Which remaining guard question would be most useful to ask next to verify the visitor's story in `conversation`?",
      criteria: Object.fromEntries(
        remaining.map((question) => [
          question.id,
          { question: question.text, use_when: question.useWhen },
        ]),
      ),
    };
  }

  const apiKey = process.env.TYPESAFE_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "The Jev API key is not configured." },
      { status: 500 },
    );
  }

  try {
    const response = await callJev(
      apiKey,
      JSON.stringify({
        state: {
          setting:
            "A visitor is requesting entry at Jumbrella Corporation, a high-security biochemical research company with restricted laboratories and containment sectors.",
          conversation,
        },
        model: "jev-latest",
        questions,
      }),
    );

    if (!response.ok) {
      console.error("Jev Fool Jev request failed", response.status);
      return Response.json(
        { error: "The checkpoint system failed. Try again." },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const result = (await response.json()) as JevResponse;
    const admit = result.answers.admit;

    if (!admit || admit.type !== "noul" || typeof admit.noul !== "number") {
      throw new Error("Unexpected Jev Noul response");
    }

    let nextQuestion = null;

    if (remaining.length === 1) {
      nextQuestion = remaining[0];
    } else if (remaining.length > 1) {
      const selectedId = result.answers.next_question?.choice;

      if (!selectedId || !isQuestionId(selectedId)) {
        throw new Error("Unexpected Jev Choice response");
      }

      nextQuestion = getFoolJevQuestion(selectedId) ?? null;
    }

    return Response.json({
      authorizationProbability: admit.noul,
      nextQuestion,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error("Fool Jev error", error);
    return Response.json(
      { error: "The checkpoint system failed. Try again." },
      { status: 502 },
    );
  }
}
