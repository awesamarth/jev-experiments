"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type LeaderboardData = {
  total: number;
  entries: { shareId: string; handle: string; score: number }[];
};

export function AccountLeaderboard({ refreshKey }: { refreshKey?: string }) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/jev/account-scorer/leaderboard", { signal: controller.signal });
        if (!response.ok) throw new Error("Unavailable");
        const result = await response.json() as LeaderboardData;
        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch {
        // Keep existing rankings during temporary failures; polling retries the lookup.
      }
    }
    void load();
    const timer = window.setInterval(load, 60_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [refreshKey]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-black bg-[#b5c2ff] px-5 py-4 text-[#1e1e1e] sm:px-10 lg:px-14">
        <div className="shrink-0">
          <p className="font-mono text-[10px] uppercase tracking-wider">Leaderboard</p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-x-6 gap-y-2">
          {data?.entries.slice(0, 3).map((entry, index) => (
            <Link key={entry.shareId} href={`/score/${entry.shareId}`} className={`flex min-w-0 items-center gap-2 text-sm hover:underline ${index ? "hidden sm:flex" : ""}`}>
              <span className="font-mono text-[10px] text-black/60">#{index + 1}</span>
              <span className="truncate font-medium">@{entry.handle}</span>
              <strong className="font-mono tabular-nums">{entry.score}<span className="text-[10px] font-normal text-black/55">/100</span></strong>
            </Link>
          ))}
          {data && data.total === 0 ? <span className="text-sm">Be the first to get scored.</span> : null}
        </div>
        <button type="button" disabled={!data} onClick={() => dialog.current?.showModal()} className="shrink-0 cursor-pointer border border-black bg-[#1e1e1e] px-3 py-2 font-mono text-[10px] uppercase text-white hover:bg-white hover:text-black disabled:opacity-40">View all</button>
      </div>

      <dialog ref={dialog} aria-labelledby="leaderboard-title" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-hidden border border-black bg-[#f7f7f2] p-0 text-[#1e1e1e] shadow-2xl backdrop:bg-black/60">
        <div className="flex items-center justify-between gap-4 border-b border-black bg-[#b5c2ff] p-5 sm:p-7">
          <div>
            <h2 id="leaderboard-title" className="text-3xl font-medium tracking-[-0.05em]">Timeline leaderboard.</h2>
            <p className="mt-2 font-mono text-[10px] uppercase text-black/65">{data?.total ?? 0} accounts</p>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close leaderboard" className="cursor-pointer border border-black px-3 py-2 text-xl hover:bg-black hover:text-white">×</button>
        </div>
        <div className="max-h-[calc(85dvh-10rem)] overflow-y-auto px-5 sm:px-7">
          <ol>
            {data?.entries.map((entry, _index, entries) => {
              const rank = entries.findIndex((candidate) => candidate.score === entry.score) + 1;
              return (
                <li key={entry.shareId} className="border-b border-black/25 last:border-b-0">
                  <Link href={`/score/${entry.shareId}`} className="flex items-center gap-4 py-4 hover:text-[#596cbe]">
                    <span className="w-7 shrink-0 font-mono text-xs text-black/55">{rank.toString().padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">@{entry.handle}</span>
                    <span className="font-mono text-xl tabular-nums">{entry.score}<span className="text-xs text-black/50">/100</span></span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <p className="py-5 font-mono text-[9px] uppercase leading-relaxed text-black/55">{(data?.total ?? 0) > 100 ? "Top 100 shown. " : ""}Tied scores share a rank. Scores judge the sampled public activity, not the person.</p>
        </div>
      </dialog>
    </>
  );
}
