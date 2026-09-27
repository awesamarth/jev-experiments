"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIES, shuffleCards, type Category, type TriageCard } from "@/lib/you-vs-jev";

type Answers = Record<string, Category>;
type Phase = "ready" | "racing";

function clock(milliseconds: number) {
  return `${(milliseconds / 1000).toFixed(1)}s`;
}

function score(deck: TriageCard[], answers: Answers) {
  return deck.reduce((total, card) => total + Number(answers[card.id] === card.category), 0);
}

function categoryLabel(category: Category) {
  return category === "feature" ? "feature request" : category;
}

export function YouVsJev() {
  const [deck, setDeck] = useState<TriageCard[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [humanAnswers, setHumanAnswers] = useState<Answers>({});
  const [jevAnswers, setJevAnswers] = useState<Answers>({});
  const [jevProgress, setJevProgress] = useState(0);
  const [humanFinishedMs, setHumanFinishedMs] = useState<number | null>(null);
  const [jevFinishedMs, setJevFinishedMs] = useState<number | null>(null);
  const [jevDnf, setJevDnf] = useState(false);
  const [jevRetrying, setJevRetrying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(0);
  const humanIndex = useRef(0);
  const runId = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const finished = phase === "racing" && humanFinishedMs !== null && (jevFinishedMs !== null || jevDnf);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (phase !== "racing" || finished) return;
    const interval = setInterval(() => setElapsed(performance.now() - startTime.current), 80);
    return () => clearInterval(interval);
  }, [phase, finished]);

  const answerHuman = useCallback((category: Category) => {
    if (phase !== "racing" || humanIndex.current >= deck.length) return;
    const card = deck[humanIndex.current];
    humanIndex.current += 1;
    setHumanAnswers((previous) => ({ ...previous, [card.id]: category }));
    if (humanIndex.current === deck.length) {
      setHumanFinishedMs(performance.now() - startTime.current);
    }
  }, [phase, deck]);

  useEffect(() => {
    if (phase !== "racing" || humanFinishedMs !== null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < CATEGORIES.length && String(index + 1) === event.key) {
        event.preventDefault();
        answerHuman(CATEGORIES[index]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, humanFinishedMs, answerHuman]);

  async function runJev(cards: TriageCard[], controller: AbortController, currentRun: number) {
    for (let index = 0; index < cards.length; index += 1) {
      let choice: Category | null = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        if (controller.signal.aborted || currentRun !== runId.current) return;
        try {
          const response = await fetch("/api/jev/you-vs-jev", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: cards[index].id }),
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(`Jev returned ${response.status}`);
          const result = (await response.json()) as { category: Category };
          if (!CATEGORIES.includes(result.category)) throw new Error("Unexpected category");
          choice = result.category;
          break;
        } catch {
          if (controller.signal.aborted || currentRun !== runId.current) return;
          if (attempt < 2) {
            setJevRetrying(true);
            await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 900));
          }
        }
      }
      if (controller.signal.aborted || currentRun !== runId.current) return;
      if (!choice) {
        setJevRetrying(false);
        setJevDnf(true);
        return;
      }
      setJevRetrying(false);
      setJevAnswers((previous) => ({ ...previous, [cards[index].id]: choice }));
      setJevProgress(index + 1);
      // The next request is issued only after this item's response has succeeded.
    }
    setJevFinishedMs(performance.now() - startTime.current);
  }

  function startGame() {
    controllerRef.current?.abort();
    runId.current += 1;
    let nextDeck = shuffleCards();
    if (deck.length && nextDeck.every((card, index) => card.id === deck[index].id)) nextDeck = shuffleCards();
    const controller = new AbortController();
    controllerRef.current = controller;
    humanIndex.current = 0;
    startTime.current = performance.now();
    setDeck(nextDeck);
    setHumanAnswers({});
    setJevAnswers({});
    setJevProgress(0);
    setHumanFinishedMs(null);
    setJevFinishedMs(null);
    setJevDnf(false);
    setJevRetrying(false);
    setElapsed(0);
    setPhase("racing");
    void runJev(nextDeck, controller, runId.current);
  }

  const humanProgress = Object.keys(humanAnswers).length;
  const humanCorrect = finished ? score(deck, humanAnswers) : 0;
  const jevCorrect = finished && !jevDnf ? score(deck, jevAnswers) : 0;
  const winner = !finished || jevDnf ? null :
    humanCorrect > jevCorrect ? "you" :
      jevCorrect > humanCorrect ? "jev" :
        (humanFinishedMs ?? Infinity) < (jevFinishedMs ?? Infinity) ? "you" : "jev";

  return (
    <main className="min-h-[calc(100vh-56px)]">
      <div className="grid min-h-[calc(100vh-56px)] lg:grid-cols-2">
        <section className="flex min-h-[42rem] flex-col justify-between bg-[#f7f7f2] px-5 py-9 text-[#1e1e1e] sm:px-10 sm:py-12 lg:border-r lg:border-black lg:px-14">
          <div>
            <div className="flex items-center justify-between border-b border-black pb-4 font-mono text-[10px] uppercase">
              <span>01 / You</span>
              <span>{phase === "ready" ? "Ready to race" : `${humanProgress} / 20`}</span>
            </div>
            {phase === "ready" ? (
              <>
                <p className="mt-8 font-mono text-[10px] uppercase tracking-wider">Experiment 06 / Speed test</p>
                <h1 className="mt-5 text-[clamp(4.8rem,8vw,9rem)] font-medium leading-[0.86] tracking-[-0.08em]">
                  You
                  <br />
                  vs Jev<span className="text-[#df58cb]">.</span>
                </h1>
                <p className="mt-7 max-w-lg text-lg leading-relaxed text-black/70">
                  Twenty tiny customer messages. Five categories: <strong className="font-semibold text-black">Bug</strong>, <strong className="font-semibold text-black">Refund</strong>, <strong className="font-semibold text-black">Feature request</strong>, <strong className="font-semibold text-black">Praise</strong>, and <strong className="font-semibold text-black">Question</strong>. Who sorts them better?
                </p>
              </>
            ) : finished ? (
              <div className="mt-12">
                <p className="font-mono text-[10px] uppercase">Final verdict</p>
                <h1 className="mt-6 text-[clamp(4rem,8vw,8rem)] font-medium leading-[0.88] tracking-[-0.075em]">
                  {jevDnf ? <>Jev<br />disconnected.</> : winner === "you" ? <>You<br />win.</> : <>Jev<br />wins.</>}
                </h1>
                <p className="mt-6 max-w-md text-base text-black/65">
                  {jevDnf ? "Jev couldn't finish the race. Your answers are still below." : "Most correct wins. If tied, fastest takes it."}
                </p>
                <a href="#race-results" className="mt-5 inline-flex items-center gap-2 border-b border-black pb-1 font-mono text-[10px] uppercase transition-opacity hover:opacity-60">
                  Scroll for results <span aria-hidden="true" className="inline-block animate-[result-nudge_1.6s_ease-in-out_infinite]">↓</span>
                </a>
              </div>
            ) : (
              <div className="mt-12">
                <p className="font-mono text-[10px] uppercase">{humanFinishedMs !== null ? "You finished / Jev is still sorting" : `Message ${String(humanProgress + 1).padStart(2, "0")} / 20`}</p>
                <div aria-live="polite" className="mt-8 flex min-h-52 items-center border-y border-black py-7">
                  <p className="max-w-xl text-[clamp(2.4rem,5vw,5rem)] font-medium leading-[1.06] tracking-[-0.055em]">
                    {humanFinishedMs !== null ? "Now we wait for Jev." : `“${deck[humanProgress]?.text ?? ""}”`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            {phase === "ready" ? (
              <>
                <div className="grid grid-cols-2 border border-black font-mono text-[10px] uppercase">
                  <span className="border-b border-r border-black p-4">20 short messages</span>
                  <span className="border-b border-black p-4">Random order each round</span>
                  <span className="border-r border-black p-4">Keys 1–5 or click</span>
                  <span className="p-4">Jev goes one by one</span>
                </div>
                <button type="button" onClick={startGame} className="mt-4 w-full cursor-pointer border border-black bg-[#1e1e1e] px-5 py-5 font-mono text-xs uppercase text-white transition-colors hover:bg-[#df58cb] hover:text-black">
                  Start the race →
                </button>
              </>
            ) : finished ? (
              <button type="button" onClick={startGame} className="w-full cursor-pointer border border-black bg-[#1e1e1e] px-5 py-5 font-mono text-xs uppercase text-white transition-colors hover:bg-[#df58cb] hover:text-black">
                Race again / new order ↻
              </button>
            ) : (
              <>
                <p className="mb-3 font-mono text-[10px] uppercase text-black/60">Sort this message</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {CATEGORIES.map((category, index) => (
                    <button
                      key={category}
                      type="button"
                      disabled={humanFinishedMs !== null}
                      onClick={() => answerHuman(category)}
                      className="cursor-pointer border border-black bg-white px-3 py-4 text-left font-mono text-[10px] uppercase transition-colors hover:bg-[#f17ce5] disabled:cursor-not-allowed disabled:opacity-40 sm:text-center"
                    >
                      <span className="block text-black/50">{index + 1}</span>
                      {categoryLabel(category)}
                    </button>
                  ))}
                </div>
              </>
            )}
            {phase === "racing" ? (
              <>
                <div className="mt-5 flex items-end justify-between border-t border-black pt-4 font-mono text-[10px] uppercase">
                  <span>Your clock</span>
                  <span className="text-4xl tabular-nums">{clock(humanFinishedMs ?? elapsed)}</span>
                </div>
                <div className="mt-3 h-2 border border-black bg-white">
                  <div className="h-full bg-[#df58cb] transition-[width] duration-200" style={{ width: `${(humanProgress / 20) * 100}%` }} />
                </div>
              </>
            ) : null}
          </div>
        </section>

        <section className="flex min-h-[42rem] flex-col justify-between bg-[#211d22] px-5 py-9 text-[#f7f7f2] sm:px-10 sm:py-12 lg:px-14">
          <div>
            <div className="flex items-center justify-between border-b border-white/45 pb-4 font-mono text-[10px] uppercase">
              <span>02 / Jev</span>
              <span>{phase === "ready" ? "On standby" : `${jevProgress} / 20`}</span>
            </div>
            <div className="mt-10 flex items-center justify-center border border-white/30 bg-[radial-gradient(circle_at_center,#51364c_0%,#211d22_70%)] py-12 sm:mt-16 sm:py-20">
              <div className="relative flex size-[min(66vw,26rem)] flex-col items-center justify-center rounded-full border border-[#f17ce5]/60 bg-[#19151b] shadow-[0_0_100px_#df58cb33,inset_0_0_50px_#df58cb20]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/55">Jev / classifier</span>
                <span className="relative left-[-0.04em] mt-5 text-[clamp(5rem,12vw,10rem)] font-medium leading-none tracking-[-0.08em] tabular-nums text-[#f17ce5]">
                  {phase === "ready" ? "00" : String(jevProgress).padStart(2, "0")}
                </span>
                <span className="font-mono text-xs text-white/50">/ 20</span>
              </div>
            </div>
            <p aria-live="polite" className="mt-8 font-mono text-[10px] uppercase tracking-wider text-[#f17ce5]">
              {phase === "ready" ? "Waiting for your signal" : jevDnf ? "Couldn't finish / DNF" : jevFinishedMs !== null ? "All twenty classified" : jevRetrying ? `Retrying message ${jevProgress + 1}` : `Classifying message ${jevProgress + 1}`}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
              One Jev request at a time. The next message stays locked until the previous answer succeeds.
            </p>
          </div>
          {phase === "racing" ? (
            <div className="mt-12">
              <div className="flex items-end justify-between border-t border-white/45 pt-4 font-mono text-[10px] uppercase">
                <span>Jev&apos;s clock</span>
                <span className="text-4xl tabular-nums">{clock(jevFinishedMs ?? elapsed)}</span>
              </div>
              <div className="mt-3 h-2 border border-white/45 bg-white/10">
                <div className="h-full bg-[#f17ce5] transition-[width] duration-200" style={{ width: `${(jevProgress / 20) * 100}%` }} />
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {finished ? (
        <section id="race-results" className="border-t border-black bg-[#f17ce5] px-5 py-12 text-[#1e1e1e] sm:px-10 lg:px-14">
          <div className="flex flex-wrap items-end justify-between gap-8 border-b border-black pb-9">
            <div>
              <p className="font-mono text-[10px] uppercase">Race results / 20 messages</p>
              <h2 className="mt-4 text-[clamp(3rem,6vw,6rem)] font-medium leading-none tracking-[-0.07em]">The receipts.</h2>
            </div>
            <div className="flex gap-10 font-mono text-xs uppercase sm:gap-20">
              <div><span className="block text-black/60">You</span><strong className="block text-4xl font-medium">{humanCorrect}/20</strong><span>{clock(humanFinishedMs ?? 0)}</span></div>
              <div><span className="block text-black/60">Jev</span><strong className="block text-4xl font-medium">{jevDnf ? "DNF" : `${jevCorrect}/20`}</strong><span>{jevDnf ? `${jevProgress}/20 completed` : clock(jevFinishedMs ?? 0)}</span></div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-[2rem_minmax(0,1fr)_4rem_4rem_4rem] gap-2 font-mono text-[9px] uppercase text-black/60 sm:grid-cols-[3rem_minmax(0,1fr)_7rem_7rem_7rem] sm:gap-4">
            <span>#</span><span>Message</span><span>Answer</span><span>You</span><span>Jev</span>
          </div>
          <ol className="mt-2 border-t border-black">
            {deck.map((card, index) => (
              <li key={card.id} className="grid grid-cols-[2rem_minmax(0,1fr)_4rem_4rem_4rem] items-center gap-2 border-b border-black/40 py-4 text-xs sm:grid-cols-[3rem_minmax(0,1fr)_7rem_7rem_7rem] sm:gap-4 sm:text-sm">
                <span className="font-mono text-[10px]">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0">{card.text}</span>
                <span className="break-words font-mono text-[9px] uppercase sm:text-xs">{categoryLabel(card.category)}</span>
                <span className={`break-words font-mono text-[9px] uppercase sm:text-xs ${humanAnswers[card.id] === card.category ? "font-bold" : "opacity-55"}`}>{categoryLabel(humanAnswers[card.id])}</span>
                <span className={`break-words font-mono text-[9px] uppercase sm:text-xs ${jevAnswers[card.id] === card.category ? "font-bold" : "opacity-55"}`}>{jevAnswers[card.id] ? categoryLabel(jevAnswers[card.id]) : "—"}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  );
}
