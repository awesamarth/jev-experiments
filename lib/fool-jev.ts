export const FOOL_JEV_QUESTIONS = [
  {
    id: "identity",
    text: "State your name, clearance level, and business at Jumbrella Corporation.",
    useWhen: "Always ask first to establish the claimed identity, clearance, and cover story.",
  },
  {
    id: "sponsor",
    text: "Which Jumbrella employee authorized your entry?",
    useWhen: "Useful when the visitor has not named a specific internal sponsor who can verify them.",
  },
  {
    id: "division",
    text: "Which Jumbrella division are you assigned to?",
    useWhen: "Useful for checking whether the visitor can identify a plausible internal division.",
  },
  {
    id: "purpose",
    text: "What work are you here to perform?",
    useWhen: "Useful when the purpose of the visit is vague, generic, or incomplete.",
  },
  {
    id: "work_order",
    text: "Give me the incident, appointment, or work-order number.",
    useWhen: "Useful for demanding a concrete operational reference that should support the visit.",
  },
  {
    id: "credentials",
    text: "What Jumbrella clearance credential are you carrying?",
    useWhen: "Useful for verifying the badge, credential, or authorization claimed by the visitor.",
  },
  {
    id: "destination",
    text: "Which laboratory or containment sector are you entering?",
    useWhen: "Useful for checking whether the visitor knows the restricted area they supposedly need.",
  },
  {
    id: "biosafety",
    text: "What protective equipment were you instructed to wear inside your assigned sector?",
    useWhen: "Useful for testing whether the visitor understands the safety requirements relevant to their claimed work.",
  },
  {
    id: "cargo",
    text: "Are you carrying any biological samples, chemicals, or sealed equipment?",
    useWhen: "Useful for checking declared materials and whether they fit the visitor's cover story.",
  },
  {
    id: "verification",
    text: "Who can confirm your clearance right now?",
    useWhen: "Useful as a final verification request after the visitor has made specific claims.",
  },
] as const;

export type FoolJevQuestionId = (typeof FOOL_JEV_QUESTIONS)[number]["id"];

export type FoolJevExchange = {
  questionId: FoolJevQuestionId;
  question: string;
  answer: string;
};

export const FIRST_FOOL_JEV_QUESTION = FOOL_JEV_QUESTIONS[0];

export function getFoolJevQuestion(id: FoolJevQuestionId) {
  return FOOL_JEV_QUESTIONS.find((question) => question.id === id);
}
