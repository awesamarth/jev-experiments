import { CATEGORIES, TRIAGE_CARDS } from "@/lib/you-vs-jev";

type JevResult = {
  model: string;
  answers?: { intent?: { type: "choice"; choice: string } };
};

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const id = typeof payload === "object" && payload !== null && "id" in payload ? payload.id : null;
  const card = TRIAGE_CARDS.find((item) => item.id === id);
  if (!card) return Response.json({ error: "Unknown message." }, { status: 400 });

  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) return Response.json({ error: "The Jev API key is not configured." }, { status: 500 });

  try {
    const response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state: { message: card.text },
        model: "jev-latest",
        questions: {
          intent: {
            type: "choice",
            instructions: "Choose the primary purpose of this customer support message. Select exactly one category for `message`.",
            criteria: {
              bug: "Reports something broken, failing, or not working as expected.",
              refund: "Requests money back or a charge reversal.",
              feature: "Suggests a new capability or improvement that does not currently exist.",
              praise: "Primarily compliments the product or team.",
              question: "Asks for information or instructions without reporting a bug or requesting a refund or feature.",
            },
          },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.error("You vs Jev request failed", response.status);
      return Response.json(
        { error: "Jev couldn't classify this message. Retrying may help." },
        { status: response.status === 429 || response.status === 529 ? 429 : 502 },
      );
    }

    const result = (await response.json()) as JevResult;
    const intent = result.answers?.intent;
    if (!intent || intent.type !== "choice" || !CATEGORIES.some((category) => category === intent.choice)) {
      throw new Error("Unexpected Jev classification");
    }

    return Response.json({ category: intent.choice, model: result.model });
  } catch (error) {
    console.error("You vs Jev error", error);
    return Response.json({ error: "Jev couldn't classify this message. Retrying may help." }, { status: 502 });
  }
}
