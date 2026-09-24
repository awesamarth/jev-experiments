"use client";

import { FormEvent, useState } from "react";
import {
  FIRST_FOOL_JEV_QUESTION,
  type FoolJevExchange,
  type FoolJevQuestionId,
} from "@/lib/fool-jev";

const ADMIT_THRESHOLD = 0.87;
const MAX_QUESTIONS = 10;

type GuardQuestion = {
  id: FoolJevQuestionId;
  text: string;
};

type Evaluation = {
  authorizationProbability: number;
  nextQuestion: GuardQuestion | null;
  model: string;
};

type GameStatus = "playing" | "won" | "lost";

export function FoolJev() {
  const [conversation, setConversation] = useState<FoolJevExchange[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<GuardQuestion>({
    id: FIRST_FOOL_JEV_QUESTION.id,
    text: FIRST_FOOL_JEV_QUESTION.text,
  });
  const [answer, setAnswer] = useState("");
  const [probability, setProbability] = useState(0);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState("jev-latest");

  const displayedRound =
    status === "playing"
      ? Math.min(conversation.length + 1, MAX_QUESTIONS)
      : conversation.length;

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer || isEvaluating || status !== "playing") return;

    const nextConversation: FoolJevExchange[] = [
      ...conversation,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer: trimmedAnswer,
      },
    ];

    setIsEvaluating(true);
    setError("");

    try {
      const [response] = await Promise.all([
        fetch("/api/jev/fool-jev", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation: nextConversation }),
        }),
        new Promise((resolve) => setTimeout(resolve, 750)),
      ]);

      const data = (await response.json()) as Evaluation & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "The checkpoint system failed.");
      }

      setConversation(nextConversation);
      setProbability(data.authorizationProbability);
      setModel(data.model);
      setAnswer("");

      if (data.authorizationProbability >= ADMIT_THRESHOLD) {
        setStatus("won");
      } else if (nextConversation.length >= MAX_QUESTIONS || !data.nextQuestion) {
        setStatus("lost");
      } else {
        setCurrentQuestion(data.nextQuestion);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The checkpoint system failed.",
      );
    } finally {
      setIsEvaluating(false);
    }
  }

  function resetGame() {
    setConversation([]);
    setCurrentQuestion({
      id: FIRST_FOOL_JEV_QUESTION.id,
      text: FIRST_FOOL_JEV_QUESTION.text,
    });
    setAnswer("");
    setProbability(0);
    setStatus("playing");
    setIsEvaluating(false);
    setError("");
    setModel("jev-latest");
  }

  const percentage = Math.round(probability * 100);
  const statusColor =
    status === "won"
      ? "#62d39b"
      : status === "lost"
        ? "#ed6d72"
        : "#e7b85c";

  return (
    <main className="min-h-[calc(100vh-57px)] bg-[#c9cfca] text-[#171918]">
      <div className="grid min-h-[calc(100vh-57px)] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative flex min-h-[42rem] flex-col overflow-hidden border-b border-black bg-[#252927] text-[#edf0eb] lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:42px_42px]" />

          <div className="relative flex items-center justify-between border-b border-white/20 px-5 py-3 font-mono text-[9px] uppercase text-white/55">
            <span>Checkpoint A-17</span>
            <span>{isEvaluating ? "Scanning testimony" : "Identity screening"}</span>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-6 py-10">
            <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden border border-white/30 bg-[#9da6a0]/10 shadow-[12px_12px_0_rgba(0,0,0,0.28)]">
              <div className="absolute inset-0 backdrop-blur-[2px]" />
              <div className="absolute inset-x-0 top-0 flex justify-between border-b border-white/20 px-3 py-2 font-mono text-[8px] uppercase text-white/45">
                <span>Camera 03</span>
                <span>Live</span>
              </div>

              <div className="absolute bottom-[16%] left-1/2 h-[47%] w-[31%] -translate-x-1/2 rounded-t-[48%] bg-[#0d0f0e] shadow-[0_0_70px_rgba(0,0,0,0.65)]" />
              <div className="absolute left-1/2 top-[20%] aspect-square w-[20%] -translate-x-1/2 rounded-full bg-[#0d0f0e]" />
              <div className="absolute bottom-0 left-0 right-0 h-[17%] border-t border-white/20 bg-black/30" />

              <div className="absolute inset-y-0 left-[13%] w-px bg-white/15" />
              <div className="absolute inset-y-0 right-[13%] w-px bg-white/15" />

              {isEvaluating ? (
                <div className="absolute inset-x-0 top-0 h-px animate-[security-scan_1.1s_linear_infinite] bg-[#e7b85c] shadow-[0_0_18px_3px_rgba(231,184,92,0.75)]" />
              ) : null}

              <div
                className="absolute inset-0 border-[3px] opacity-0 transition-opacity duration-300"
                style={{
                  borderColor: statusColor,
                  opacity: status === "playing" ? 0 : 1,
                }}
              />

              <div className="absolute bottom-4 left-4 font-mono text-[8px] uppercase text-white/45">
                Subject: unverified visitor
              </div>
            </div>
          </div>

          <div className="relative border-t border-white/20 bg-black/15 px-5 py-5 sm:px-8">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase text-white/45">Authorization probability</p>
                <p className="mt-1 text-5xl font-medium tracking-[-0.06em]">{percentage}%</p>
              </div>
              <div className="text-right font-mono text-[9px] uppercase text-white/45">
                <p>Admit threshold</p>
                <p className="mt-1 text-base text-white">87%</p>
              </div>
            </div>

            <div className="relative h-4 border border-white/40 bg-black/30">
              <div
                className="h-full transition-[width,background-color] duration-700 ease-out"
                style={{ width: `${percentage}%`, backgroundColor: statusColor }}
              />
              <div className="absolute bottom-[-5px] top-[-5px] left-[87%] w-px bg-white">
                <span className="absolute -top-4 -translate-x-1/2 font-mono text-[7px] text-white/65">87</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-[42rem] flex-col bg-[#e8e9e3]">
          <div className="flex items-center justify-between border-b border-black px-5 py-3 font-mono text-[9px] uppercase sm:px-8">
            <span>Interrogation log</span>
            <span>Question {String(displayedRound).padStart(2, "0")} / 10</span>
          </div>

          <div className="flex flex-1 flex-col px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
            <div className="security-scrollbar mb-8 max-h-64 space-y-3 overflow-y-auto border-l border-black/25 pl-4 pr-3">
              {conversation.length === 0 ? (
                <p className="font-mono text-[9px] uppercase text-black/40">No testimony recorded.</p>
              ) : (
                conversation.map((exchange, index) => (
                  <div key={exchange.questionId} className="grid gap-1 text-sm sm:grid-cols-[2rem_1fr]">
                    <span className="font-mono text-[9px] text-black/35">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="font-medium">Guard: {exchange.question}</p>
                      <p className="mt-1 text-black/60">Visitor: {exchange.answer}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {status === "playing" ? (
              <div className="mt-auto">
                <p className="mb-4 font-mono text-[9px] uppercase text-black/45">Current question</p>
                <h1 className="max-w-3xl text-4xl font-medium leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                  {currentQuestion.text}
                </h1>

                <form onSubmit={submitAnswer} className="mt-8">
                  <div className="border border-black bg-[#f7f7f2] p-2 focus-within:shadow-[6px_6px_0_#171918]">
                    <textarea
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value.slice(0, 1000))}
                      onKeyDown={(event) => {
                        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      rows={5}
                      readOnly={isEvaluating}
                      placeholder="Make your story convincing..."
                      aria-label="Your answer to the guard"
                      className="w-full resize-none bg-transparent p-3 text-base leading-relaxed outline-none placeholder:text-black/30 read-only:opacity-50 sm:text-lg"
                    />
                    <div className="flex items-center justify-between border-t border-black/20 pt-2">
                      <div className="flex gap-3 pl-2 font-mono text-[8px] uppercase text-black/40">
                        <span>{answer.length}/1000</span>
                        <span>⌘ / Ctrl + Enter</span>
                      </div>
                      <button
                        type="submit"
                        disabled={!answer.trim() || isEvaluating}
                        className="cursor-pointer border border-black bg-[#171918] px-5 py-3 font-mono text-[9px] uppercase text-white transition-colors hover:bg-[#e7b85c] hover:text-black disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {isEvaluating ? "Evaluating..." : "Submit testimony →"}
                      </button>
                    </div>
                  </div>
                  {error ? (
                    <p role="alert" className="mt-4 border-l-2 border-[#c53f45] pl-3 text-sm text-[#8d2429]">
                      {error}
                    </p>
                  ) : null}
                </form>
              </div>
            ) : (
              <div className="my-auto border-y border-black py-10">
                <p className="font-mono text-[10px] uppercase text-black/45">Final decision</p>
                <h1 className={`mt-3 text-6xl font-medium leading-[0.86] tracking-[-0.065em] sm:text-8xl ${status === "won" ? "text-[#17643f]" : "text-[#9d292f]"}`}>
                  {status === "won" ? "Access granted." : "Access denied."}
                </h1>
                <p className="mt-6 max-w-lg text-lg">
                  {status === "won"
                    ? `You fooled Jev in ${conversation.length} ${conversation.length === 1 ? "answer" : "answers"}.`
                    : "Ten answers weren't enough to make your story believable."}
                </p>
                <button
                  type="button"
                  onClick={resetGame}
                  className="mt-8 cursor-pointer border border-black bg-[#171918] px-5 py-3 font-mono text-[10px] uppercase text-white transition-colors hover:bg-[#e7b85c] hover:text-black"
                >
                  Try another story ↻
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-black px-5 py-3 font-mono text-[8px] uppercase text-black/45 sm:px-8">
            <span>{isEvaluating ? "Jev is reviewing the complete testimony" : "Session state: memory only"}</span>
            <span>{model}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
