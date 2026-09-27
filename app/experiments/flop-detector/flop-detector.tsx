"use client";

import { useState, type FormEvent } from "react";

type Verdict = "banger" | "mid" | "flop";
type Result = { score: number; verdict: Verdict; model: string };

const examples = [
  "The best feature is the one your users never have to think about.",
  "Just had coffee. Anyway, what's everyone working on?",
];

export function FlopDetector() {
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState("");

  function updateDraft(value: string) {
    setDraft(value.slice(0, 280));
    setResult(null);
    setError("");
  }

  async function scoreDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tweet = draft.trim();
    if (!tweet || isScoring) return;

    setResult(null);
    setError("");
    setIsScoring(true);

    try {
      const response = await fetch("/api/jev/flop-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tweet }),
      });
      const data = (await response.json()) as Result & { error?: string };

      if (!response.ok) throw new Error(data.error || "Jev couldn't score this draft.");
      if (
        !Number.isInteger(data.score) ||
        data.score < 0 ||
        data.score > 100 ||
        !["banger", "mid", "flop"].includes(data.verdict)
      ) {
        throw new Error("Jev returned an unexpected score. Try again.");
      }
      setResult(data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Jev couldn't score this draft.");
    } finally {
      setIsScoring(false);
    }
  }

  const score = result?.score ?? 0;
  const verdictColor = result?.verdict === "banger"
    ? "#145d46"
    : result?.verdict === "mid"
      ? "#51370f"
      : "#961e36";

  return (
    <main className="grid min-h-[calc(100vh-56px)] lg:grid-cols-2">
      <section className="flex min-h-[39rem] flex-col justify-between bg-[#1e1e1e] px-5 py-9 text-[#f7f7f2] sm:px-10 sm:py-12 lg:border-r lg:border-black lg:px-14">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#f5a45d]">
            Experiment 04 / Noul / Jev latest
          </p>
          <h1 className="mt-9 max-w-2xl text-[clamp(4rem,8vw,8.5rem)] font-medium leading-[0.84] tracking-[-0.075em]">
            Banger
            <br />
            Alert<span className="text-[#f5a45d]">.</span>
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">
            Is this tweet going to bang? Let Jev judge your draft before the timeline does.
          </p>
        </div>

        <form onSubmit={scoreDraft} className="mt-14 max-w-2xl">
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase text-white/55">
            <label htmlFor="tweet-draft">Your draft</label>
            <span>{draft.length} / 280</span>
          </div>
          <div className="border border-white/50 bg-white/[0.05] p-2 focus-within:border-[#f5a45d]">
            <textarea
              id="tweet-draft"
              value={draft}
              onChange={(event) => updateDraft(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Write the tweet you almost posted..."
              rows={5}
              maxLength={280}
              disabled={isScoring}
              className="block min-h-36 w-full resize-y bg-transparent p-3 text-lg leading-relaxed text-white outline-none placeholder:text-white/30 disabled:opacity-60 sm:text-xl"
            />
            <div className="flex items-center justify-between gap-3 border-t border-white/20 pt-2">
              <span className="pl-2 font-mono text-[9px] uppercase text-white/40">⌘ / Ctrl + Enter</span>
              <button
                type="submit"
                disabled={!draft.trim() || isScoring}
                className="cursor-pointer border border-[#f5a45d] bg-[#f5a45d] px-5 py-3 font-mono text-[10px] uppercase text-[#1e1e1e] transition-colors hover:bg-white hover:border-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isScoring ? "Asking Jev..." : result ? "Score again →" : "Score draft →"}
              </button>
            </div>
          </div>
          {error ? <p role="alert" className="mt-3 border-l-2 border-[#f5a45d] pl-3 text-sm text-[#ffd2aa]">{error}</p> : null}
          {!result && !isScoring ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[9px] uppercase text-white/40">Try a draft</span>
              {examples.map((example, index) => (
                <button
                  type="button"
                  key={example}
                  onClick={() => updateDraft(example)}
                  className="cursor-pointer border border-white/25 px-3 py-2 font-mono text-[9px] uppercase text-white/60 transition-colors hover:border-[#f5a45d] hover:text-white"
                >
                  Example {String(index + 1).padStart(2, "0")}
                </button>
              ))}
            </div>
          ) : null}
        </form>
      </section>

      <section className="relative flex min-h-[38rem] flex-col justify-between overflow-hidden bg-[#f5a45d] px-5 py-9 text-[#1e1e1e] sm:px-10 sm:py-12 lg:px-14">
        <div className="flex items-center justify-between border-b border-black/60 pb-4 font-mono text-[10px] uppercase tracking-wider">
          <span>Jev / pre-post check</span>
          <span>Signal 04</span>
        </div>

        <div aria-live="polite" className="relative my-10 flex flex-1 flex-col justify-center">
          <p className="font-mono text-[10px] uppercase tracking-widest">Will it bang?</p>
          <div className="mt-2 flex items-start gap-2 font-medium tracking-[-0.09em]">
            <span className="text-[clamp(8rem,19vw,19rem)] leading-[0.95] tabular-nums">
              {isScoring ? "··" : result ? score : "?"}
            </span>
            {result ? <span className="mt-5 text-4xl sm:text-6xl">%</span> : null}
          </div>
          <div className="mt-5 min-h-24">
            {result ? (
              <>
                <p className="text-[clamp(3.5rem,7vw,7rem)] font-semibold uppercase leading-none tracking-[-0.075em]" style={{ color: verdictColor }}>
                  {result.verdict}.
                </p>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-black/70 sm:text-base">
                  Jev&apos;s score for your draft.
                </p>
              </>
            ) : (
              <p className="max-w-md text-xl leading-snug text-black/70 sm:text-2xl">
                {isScoring ? "Jev is reading your draft..." : "One draft. One question. A brutally simple verdict."}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="relative h-7 border border-black bg-white/25">
            <div className="absolute inset-y-0 left-[30%] border-l border-black/60" />
            <div className="absolute inset-y-0 left-[70%] border-l border-black/60" />
            <div className="h-full bg-[#1e1e1e] transition-[width] duration-700 ease-out" style={{ width: `${score}%` }} />
          </div>
          <div className="relative mt-2 h-4 font-mono text-[9px] uppercase">
            <span className="absolute left-0">0 / Flop</span>
            <span className="absolute left-[30%] -translate-x-1/2">30 / Mid</span>
            <span className="absolute left-[70%] -translate-x-1/2">&gt;70 / Banger</span>
            <span className="absolute right-0">100</span>
          </div>
          <div className="mt-8 flex min-h-14 flex-wrap items-center justify-between gap-4 border-t border-black/60 pt-5">
            <span className="font-mono text-[9px] uppercase text-black/65">
              {result ? `${result.model} / scored text only` : "Awaiting draft / no X account needed"}
            </span>
            {result ? (
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(draft.trim())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-black bg-[#1e1e1e] px-6 py-3 font-mono text-[10px] uppercase text-white transition-colors hover:bg-white hover:text-black"
              >
                Post on X ↗
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
