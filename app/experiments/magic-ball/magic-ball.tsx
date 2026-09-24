"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const EXAMPLES = [
  "Should I eat Indian food tonight?",
  "Is something interesting gonna happen today?",
  "Am I a werewolf?",
];

type Result = {
  answer: string;
  category: "affirmative" | "neutral" | "negative";
  probability: number;
  confidence: number;
  model: string;
};

export function MagicBall() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isManuallyShaking, setIsManuallyShaking] = useState(false);
  const [error, setError] = useState("");
  const shakeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shakeTimeout.current) clearTimeout(shakeTimeout.current);
    };
  }, []);

  function shakeBall() {
    if (isThinking) return;

    if (shakeTimeout.current) clearTimeout(shakeTimeout.current);
    setIsManuallyShaking(false);

    requestAnimationFrame(() => {
      setIsManuallyShaking(true);
      shakeTimeout.current = setTimeout(() => {
        setIsManuallyShaking(false);
      }, 900);
    });
  }

  async function askBall(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length < 3 || isThinking) return;

    setIsThinking(true);
    setResult(null);
    setError("");

    try {
      const [response] = await Promise.all([
        fetch("/api/jev/magic-ball", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmedQuestion }),
        }),
        new Promise((resolve) => setTimeout(resolve, 950)),
      ]);

      const data = (await response.json()) as Result & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "The ball is hazy right now.");
      }

      setResult(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The ball is hazy right now.",
      );
    } finally {
      setIsThinking(false);
    }
  }

  const answer = isThinking
    ? "Consulting Jev"
    : result?.answer ?? "8";
  const verdict = result
    ? result.category === "affirmative"
      ? "yes"
      : result.category === "negative"
        ? "no"
        : "maybe"
    : null;

  return (
    <main className="relative min-h-[calc(100vh-57px)] overflow-hidden bg-[#211d31] text-[#f7f7f2]">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#fff_0.7px,transparent_0.7px)] [background-size:7px_7px]" />
      <div className="pointer-events-none absolute -left-40 top-1/3 size-[34rem] rounded-full bg-[#ed7d9b]/20 blur-[130px]" />
      <div className="pointer-events-none absolute -right-40 top-0 size-[40rem] rounded-full bg-[#665be8]/25 blur-[150px]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-57px)] max-w-[1500px] lg:grid-cols-[0.85fr_1.15fr]">
        <section className="flex flex-col justify-between border-white/20 px-5 py-10 sm:px-10 lg:border-r lg:px-12 lg:py-14">
          <div>
            <p className="mb-6 font-mono text-[10px] uppercase text-white/55">
              Experiment 02 · Choice · Jev latest
            </p>
            <h1 className="max-w-xl text-6xl font-medium leading-[0.83] tracking-[-0.07em] sm:text-8xl lg:text-[7.5rem]">
              Magic
              <br />
              Jev Ball
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
              Ask what&apos;s on your mind. Jev decides yes, no, or maybe. The ball chooses the words.
            </p>
          </div>

          <form onSubmit={askBall} className="mt-12 max-w-xl">
            <label htmlFor="magic-question" className="mb-3 block font-mono text-[10px] uppercase text-white/60">
              Ask a yes-or-no question
            </label>
            <div className="border border-white/50 bg-black/20 p-2 focus-within:border-[#ed7d9b]">
              <textarea
                id="magic-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value.slice(0, 500))}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Should I ask out my crush?"
                rows={3}
                disabled={isThinking}
                className="w-full resize-none bg-transparent p-3 text-lg outline-none placeholder:text-white/30 disabled:opacity-60"
              />
              <div className="flex items-center justify-between border-t border-white/20 pt-2">
                <div className="flex items-center gap-3 pl-2 font-mono text-[9px] text-white/40">
                  <span>{question.length}/500</span>
                  <span>⌘ / Ctrl + Enter</span>
                </div>
                <button
                  type="submit"
                  disabled={question.trim().length < 3 || isThinking}
                  className="cursor-pointer border border-white bg-[#f7f7f2] px-5 py-3 font-mono text-[10px] uppercase text-[#1e1e1e] transition-colors hover:bg-[#ed7d9b] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {isThinking ? "Shaking..." : "Ask the ball →"}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuestion(example)}
                  disabled={isThinking}
                  className="cursor-pointer border border-white/25 px-2 py-1.5 font-mono text-[9px] text-white/55 transition-colors hover:border-white hover:text-white disabled:cursor-not-allowed"
                >
                  {example}
                </button>
              ))}
            </div>

            {error ? (
              <p role="alert" className="mt-4 border-l-2 border-[#ed7d9b] pl-3 text-sm text-[#ffb4c6]">
                {error}
              </p>
            ) : null}
          </form>
        </section>

        <section className="relative flex min-h-[36rem] items-center justify-center overflow-hidden px-4 py-12 sm:px-10">
          <div className="absolute left-5 top-5 font-mono text-[9px] uppercase text-white/45">
            TS.JEV.M8B / Live
          </div>
          <button
            type="button"
            onClick={shakeBall}
            aria-label="Shake the Magic Jev Ball"
            className="cursor-pointer rounded-full [perspective:1200px] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#ed7d9b]"
          >
            <div className={isThinking || isManuallyShaking ? "animate-[magic-shake_500ms_ease-in-out_infinite]" : "animate-[magic-float_5s_ease-in-out_infinite]"}>
              <div className="relative aspect-square w-[min(82vw,39rem)] rounded-full border border-white/15 bg-[radial-gradient(circle_at_28%_20%,#a7a4aa_0%,#4a484f_8%,#19191d_29%,#050506_61%,#000_77%)] shadow-[0_50px_90px_rgba(0,0,0,0.65),inset_-30px_-35px_60px_rgba(0,0,0,0.9)]">
                <div className="absolute left-[18%] top-[10%] h-[17%] w-[29%] -rotate-[28deg] rounded-[50%] bg-white/25 blur-2xl" />
                <div className="absolute inset-[18%] rounded-full border border-white/15 bg-[radial-gradient(circle_at_42%_34%,#323139,#09090b_65%)] shadow-[inset_0_12px_30px_rgba(0,0,0,0.95),0_0_0_10px_rgba(0,0,0,0.2)]">
                  <div className="absolute left-1/2 top-1/2 h-[64%] w-[74%] -translate-x-1/2 -translate-y-[66%] [clip-path:polygon(50%_0,100%_100%,0_100%)] bg-[#665be8] drop-shadow-[0_0_30px_rgba(113,99,255,0.8)]" />
                  <div aria-live="polite" className="absolute left-1/2 top-[52%] z-10 flex w-[34%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
                    <p className={`${result || isThinking ? "text-[clamp(0.68rem,1.65vw,1.15rem)]" : "text-[clamp(4rem,11vw,8rem)]"} w-full font-mono font-medium uppercase leading-[1.05] text-white [text-wrap:balance]`}>
                      {answer}
                    </p>
                    {result && !isThinking ? (
                      <span className="mt-2 whitespace-nowrap font-mono text-[clamp(0.58rem,1.2vw,0.75rem)] uppercase text-white/65">
                        {verdict} · {Math.round(result.probability * 100)}%
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </button>

          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between font-mono text-[9px] uppercase text-white/45">
            <span>{result ? `${result.category} response` : "Awaiting question"}</span>
            <span>{result?.model ?? "jev-latest"}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
