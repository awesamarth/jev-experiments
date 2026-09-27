export const CATEGORIES = ["bug", "refund", "feature", "praise", "question"] as const;
export type Category = (typeof CATEGORIES)[number];
export type TriageCard = { id: string; text: string; category: Category };

export const TRIAGE_CARDS: TriageCard[] = [
  { id: "bug-1", text: "The app crashes when I tap Save.", category: "bug" },
  { id: "bug-2", text: "Search keeps showing a blank screen.", category: "bug" },
  { id: "bug-3", text: "My upload freezes at 99%.", category: "bug" },
  { id: "bug-4", text: "The password reset link goes to a 404.", category: "bug" },
  { id: "refund-1", text: "Please refund my last payment.", category: "refund" },
  { id: "refund-2", text: "I was charged twice. Return one charge.", category: "refund" },
  { id: "refund-3", text: "I'd like my money back for this order.", category: "refund" },
  { id: "refund-4", text: "Can you reverse my subscription payment?", category: "refund" },
  { id: "feature-1", text: "Could you add dark mode?", category: "feature" },
  { id: "feature-2", text: "Please let us export as CSV.", category: "feature" },
  { id: "feature-3", text: "I'd love keyboard shortcuts.", category: "feature" },
  { id: "feature-4", text: "A shared team inbox would be great.", category: "feature" },
  { id: "praise-1", text: "This update is fantastic. Thank you!", category: "praise" },
  { id: "praise-2", text: "Your support team was incredibly helpful.", category: "praise" },
  { id: "praise-3", text: "The new design looks amazing.", category: "praise" },
  { id: "praise-4", text: "Love how fast the app feels now.", category: "praise" },
  { id: "question-1", text: "Where can I find my invoices?", category: "question" },
  { id: "question-2", text: "Do you have a student plan?", category: "question" },
  { id: "question-3", text: "Is there an Android version?", category: "question" },
  { id: "question-4", text: "How do I change my email address?", category: "question" },
];

export function shuffleCards(): TriageCard[] {
  const cards = [...TRIAGE_CARDS];
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const swap = Math.floor((random[0] / 2 ** 32) * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards;
}
