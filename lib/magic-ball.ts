export const MAGIC_BALL_RESPONSES = [
  "It is certain",
  "It is decidedly so",
  "Without a doubt",
  "Yes definitely",
  "You may rely on it",
  "As I see it, yes",
  "Most likely",
  "Outlook good",
  "Yes",
  "Signs point to yes",
  "Reply hazy, try again",
  "Ask again later",
  "Better not tell you now",
  "Cannot predict now",
  "Concentrate and ask again",
  "Don't count on it",
  "My reply is no",
  "My sources say no",
  "Outlook not so good",
  "Very doubtful",
] as const;

export type MagicBallResponse = (typeof MAGIC_BALL_RESPONSES)[number];
export type MagicBallCategory = "affirmative" | "neutral" | "negative";

export function getRandomMagicBallResponse(
  category: MagicBallCategory,
): MagicBallResponse {
  const start =
    category === "affirmative" ? 0 : category === "neutral" ? 10 : 15;
  const end = category === "affirmative" ? 10 : category === "neutral" ? 15 : 20;
  const responses = MAGIC_BALL_RESPONSES.slice(start, end);

  return responses[Math.floor(Math.random() * responses.length)];
}
