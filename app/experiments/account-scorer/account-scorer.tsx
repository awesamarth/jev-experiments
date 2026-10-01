"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AccountPost, AccountReport, AccountScores } from "@/lib/account-scorer";
import { ScoreShareActions } from "./score-share-actions";

const dimensions: { key: keyof AccountScores; label: string; description: string }[] = [
  { key: "signal", label: "Signal", description: "Is there something worth reading?" },
  { key: "originality", label: "Originality", description: "An actual point of view?" },
  { key: "clarity", label: "Clarity", description: "Can people follow the thought?" },
  { key: "habits", label: "Posting habits", description: "Conversation, or just noise?" },
];

function PostList({ posts }: { posts: AccountPost[] }) {
  if (!posts.length) {
    return <p className="border-t border-black/30 py-8 text-sm text-black/60">No public replies found in this sample.</p>;
  }

  return (
    <ol className="border-t border-black">
      {posts.map((post, index) => {
        const timestamp = Date.parse(post.date);
        return (
          <li key={post.id} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-black/35 py-5 sm:grid-cols-[3rem_1fr] sm:gap-5">
            <span className="pt-1 font-mono text-[10px] text-black/55">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed sm:text-base">{post.text}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase text-black/55">
                <span>{Number.isFinite(timestamp) ? new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Public post"}</span>
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-4 transition-opacity hover:opacity-60">
                  View on X ↗
                </a>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function AccountScorer() {
  const [handle, setHandle] = useState("");
  const [report, setReport] = useState<AccountReport | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "replies">("posts");
  const [showAll, setShowAll] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [wasSaved, setWasSaved] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (report && window.matchMedia("(max-width: 1023px)").matches) {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [report]);

  useEffect(() => {
    if (!report) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [report]);

  const refreshRemaining = report ? Math.max(0, 15 * 60_000 - (now - Date.parse(report.analyzedAt))) : 0;

  async function loadReport(refresh: boolean) {
    if (!handle.trim() || isScoring) return;
    setError("");
    if (!refresh) setReport(null);
    setIsScoring(true);

    try {
      const response = await fetch("/api/jev/account-scorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim(), refresh }),
      });
      const data = (await response.json()) as AccountReport & { error?: string; fromCache?: boolean };
      if (!response.ok) throw new Error(data.error || "Couldn't score this account.");
      if (!Array.isArray(data.posts) || !Array.isArray(data.replies) || !Number.isFinite(data.overall) || !data.shareId) {
        throw new Error("An unexpected response came back. Try again.");
      }
      setReport(data);
      setWasSaved(data.fromCache === true);
      setNow(Date.now());
      setActiveTab("posts");
      setShowAll(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Couldn't score this account.");
    } finally {
      setIsScoring(false);
    }
  }

  function scoreAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadReport(false);
  }

  return (
    <main className="grid min-h-[calc(100vh-56px)] lg:grid-cols-[0.88fr_1.12fr]">
      <section className="flex flex-col bg-[#1e1e1e] px-5 py-9 text-[#f7f7f2] sm:px-10 sm:py-12 lg:border-r lg:border-black lg:px-14">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#b5c2ff]">
          <span>Experiment 03 / Jev latest</span>
          <span>Public accounts only</span>
        </div>
        <h1 className={`${report ? "mt-7 text-[clamp(3.5rem,5vw,5.5rem)]" : "mt-9 text-[clamp(3.8rem,7.4vw,7.8rem)]"} max-w-2xl font-medium leading-[0.87] tracking-[-0.075em]`}>
          {report ? <>Timeline<br />verdict<span className="text-[#b5c2ff]">.</span></> : <>Put your<br />timeline<br />on trial<span className="text-[#b5c2ff]">.</span></>}
        </h1>
        {!report ? (
          <p className="mt-7 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">
            Jev reads the posts. The replies. The whole vibe. You get the score.
          </p>
        ) : null}

        <form onSubmit={scoreAccount} className={`${report ? "mt-7" : "mt-12"} max-w-xl`}>
          <label htmlFor="account-handle" className="mb-3 block font-mono text-[10px] uppercase text-white/60">
            X username or profile link
          </label>
          <div className="flex border border-white/50 bg-white/[0.05] focus-within:border-[#b5c2ff]">
            <span aria-hidden="true" className="flex items-center border-r border-white/25 px-4 font-mono text-xl text-[#b5c2ff]">{/^https?:\/\//i.test(handle.trim()) ? "↗" : "@"}</span>
            <input
              id="account-handle"
              type="text"
              autoCapitalize="off"
              autoComplete="off"
              spellCheck={false}
              value={handle}
              onChange={(event) => {
                setHandle(event.target.value);
                setReport(null);
                setError("");
              }}
              placeholder="yourhandle"
              disabled={isScoring}
              className="min-w-0 flex-1 bg-transparent px-4 py-4 text-lg outline-none placeholder:text-white/30 disabled:opacity-60"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-[9px] uppercase text-white/45">Up to 25 posts + 15 replies / no login</p>
            <button
              type="submit"
              disabled={!handle.trim() || isScoring}
              className="cursor-pointer border border-[#b5c2ff] bg-[#b5c2ff] px-5 py-3 font-mono text-[10px] uppercase text-[#1e1e1e] transition-colors hover:border-white hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isScoring ? "Reading timeline..." : "Score account →"}
            </button>
          </div>
          {error ? <p role="alert" className="mt-5 border-l-2 border-[#b5c2ff] pl-3 text-sm text-[#d6ddff]">{error}</p> : null}
        </form>

        {report ? (
          <div ref={reportRef} className="mt-8 border-t border-white/30 pt-7">
            {wasSaved ? <p className="mb-4 font-mono text-[10px] uppercase text-[#b5c2ff]">Saved analysis · no new Jev call</p> : null}
            <div className="flex items-center gap-4">
              {report.avatar.startsWith("https://") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={report.avatar} alt="" width={56} height={56} className="size-14 rounded-full border border-white/50 object-cover" />
              ) : <span className="flex size-14 items-center justify-center rounded-full border border-white/50 text-2xl">@</span>}
              <div className="min-w-0">
                <p className="truncate text-xl font-medium">{report.name}</p>
                <p className="font-mono text-xs text-white/50">@{report.handle}</p>
              </div>
            </div>
            {report.bio ? <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/60">{report.bio}</p> : null}
            <div className="mt-7 flex items-end gap-3 border-b border-white/30 pb-5">
              <span className="text-[clamp(7rem,15vw,12rem)] font-medium leading-[0.8] tracking-[-0.09em] tabular-nums text-[#b5c2ff]">{report.overall}</span>
              <span className="pb-2 font-mono text-sm text-white/55">/ 100<br />OVERALL</span>
            </div>
            <a href="#share-score" className="mt-4 inline-flex border-b border-[#b5c2ff] pb-1 font-mono text-[10px] uppercase text-[#b5c2ff] hover:text-white">Share score ↗</a>
            <div className="mt-6 space-y-5">
              {dimensions.map(({ key, label, description }) => (
                <div key={key}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="mt-0.5 text-xs text-white/45">{description}</p>
                    </div>
                    <span className="font-mono text-xl tabular-nums">{report.scores[key]}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-white/15">
                    <div className="h-full bg-[#b5c2ff]" style={{ width: `${report.scores[key]}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 border-t border-white/25 pt-4 font-mono text-[9px] uppercase leading-relaxed text-white/45">
              {report.posts.length} original posts · {report.replies.length} replies analysed<br />
              Posts 70% · Replies 30% when available · {report.model}
            </p>
            <ScoreShareActions shareId={report.shareId} handle={report.handle} score={report.overall} />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/25 pt-5">
              <p className="font-mono text-[10px] uppercase leading-relaxed text-white/55">
                {wasSaved ? "Saved report" : "Fresh analysis"} · {new Date(report.analyzedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                {refreshRemaining > 0 ? <><br />Re-analysis available in {Math.ceil(refreshRemaining / 60_000)} min</> : null}
              </p>
              <button type="button" onClick={() => void loadReport(true)} disabled={isScoring || refreshRemaining > 0} className="cursor-pointer border border-white/50 px-4 py-3 font-mono text-[10px] uppercase transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40">
                {isScoring ? "Analyzing..." : "Analyze again ↻"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="flex min-h-[38rem] flex-col bg-[#b5c2ff] px-5 py-9 text-[#1e1e1e] sm:px-10 sm:py-12 lg:px-14">
        <div className="flex items-center justify-between border-b border-black pb-4 font-mono text-[10px] uppercase tracking-wider">
          <span>Evidence / 03</span>
          <span>{report ? `@${report.handle}` : "Awaiting handle"}</span>
        </div>
        {report ? (
          <div className="mt-7">
            <p className="font-mono text-[10px] uppercase tracking-wider text-black/65">The actual receipts</p>
            <h2 className="mt-3 max-w-xl text-[clamp(3rem,5vw,5.5rem)] font-medium leading-[0.93] tracking-[-0.065em]">
              What Jev read<span className="text-[#596cbe]">.</span>
            </h2>
            <div className="mt-8 flex border-b border-black" role="tablist" aria-label="Sampled account activity">
              {(["posts", "replies"] as const).map((tab) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setShowAll(false);
                  }}
                  className={`cursor-pointer border border-b-0 border-black px-5 py-3 font-mono text-[10px] uppercase transition-colors ${activeTab === tab ? "bg-[#1e1e1e] text-white" : "border-l-0 bg-transparent hover:bg-white/30"}`}
                >
                  {tab === "posts" ? "Posts" : "Replies"} / {report[tab].length}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="account-scrollbar lg:max-h-[min(62rem,calc(100vh-19rem))] lg:overflow-y-auto lg:pr-2">
              <PostList posts={showAll ? report[activeTab] : report[activeTab].slice(0, 5)} />
            </div>
            {report[activeTab].length > 5 ? (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="mt-5 cursor-pointer border border-black px-4 py-3 font-mono text-[10px] uppercase transition-colors hover:bg-[#1e1e1e] hover:text-white"
              >
                {showAll ? "Show fewer ↑" : `Show all ${report[activeTab].length} ${activeTab} ↓`}
              </button>
            ) : null}
            <p className="mt-5 font-mono text-[9px] uppercase text-black/60">
              Recent {activeTab === "posts" ? "posts" : "replies"} by @{report.handle}.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center py-16">
            <div className="font-mono text-[10px] uppercase">Exhibit A / Your account</div>
            <div className="mt-5 text-[clamp(8rem,20vw,18rem)] font-medium leading-none tracking-[-0.1em]">@?</div>
            <p className="mt-8 max-w-md border-t border-black pt-5 text-xl leading-snug text-black/70 sm:text-2xl">
              {isScoring ? "Collecting public posts and asking Jev..." : "Give us a handle. We’ll bring the receipts."}
            </p>
            <div className="mt-12 grid grid-cols-2 border border-black font-mono text-[10px] uppercase">
              <span className="border-r border-black p-4">01 / Original posts</span>
              <span className="p-4">02 / Replies</span>
              <span className="border-r border-t border-black p-4">03 / Jev scores</span>
              <span className="border-t border-black p-4">04 / The verdict</span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
