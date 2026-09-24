export const FOOL_JEV_QUESTIONS = [
  {
    id: "identity",
    text: "State your name and your business here.",
    useWhen: "Always ask first to establish the claimed identity and cover story.",
  },
  {
    id: "host",
    text: "Who exactly are you here to see?",
    useWhen: "Useful when the visitor has not named a specific host who can verify them.",
  },
  {
    id: "purpose",
    text: "What is the precise purpose of your visit?",
    useWhen: "Useful when the reason for entry is vague, generic, or incomplete.",
  },
  {
    id: "department",
    text: "Which department requested your presence?",
    useWhen: "Useful for checking whether the claimed visit fits an internal team.",
  },
  {
    id: "appointment",
    text: "What time is your appointment, and how was it arranged?",
    useWhen: "Useful for testing logistical details in an appointment-based story.",
  },
  {
    id: "credentials",
    text: "What credentials or access badge do you have?",
    useWhen: "Useful for verifying credentials claimed by an official, employee, or contractor.",
  },
  {
    id: "destination",
    text: "Which part of the building do you need access to?",
    useWhen: "Useful for checking whether the visitor knows where they are supposedly going.",
  },
  {
    id: "last_visit",
    text: "When were you last inside this facility?",
    useWhen: "Useful when the visitor implies prior familiarity with the building.",
  },
  {
    id: "notification",
    text: "Why wasn't security notified before your arrival?",
    useWhen: "Useful for challenging an unexpected or poorly documented visit.",
  },
  {
    id: "verification",
    text: "Who can I contact right now to verify your story?",
    useWhen: "Useful as a final verification request after the visitor has given specific claims.",
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
