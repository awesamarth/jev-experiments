import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ScoreShareActions } from "@/app/experiments/account-scorer/score-share-actions";
import { findReportById } from "@/lib/account-reports";

const getReport = cache(findReportById);

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) return { title: "Scorecard not found — Jev Experiments" };
  const title = `Jev scored @${report.handle} ${report.overall}/100`;
  const description = `Signal ${report.scores.signal} · Originality ${report.scores.originality} · Clarity ${report.scores.clarity} · Posting habits ${report.scores.habits}. See the receipts and score your own account.`;
  const image = `/score/${id}/opengraph-image`;
  return {
    title,
    description,
    alternates: { canonical: `/score/${id}` },
    openGraph: { title, description, type: "website", url: `/score/${id}`, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ScorecardPage({ params }: Props) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const dimensions = [
    { label: "Signal", score: report.scores.signal },
    { label: "Originality", score: report.scores.originality },
    { label: "Clarity", score: report.scores.clarity },
    { label: "Posting habits", score: report.scores.habits },
  ];

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#1e1e1e]">
      <header className="flex h-14 items-stretch justify-between border-b border-black">
        <Link href="/" className="flex items-center border-r border-black px-4 font-semibold tracking-tight sm:px-6">JEV EXPERIMENTS</Link>
        <Link href="/experiments/account-scorer" className="flex items-center border-l border-black bg-[#1e1e1e] px-4 font-mono text-[10px] uppercase text-white transition-colors hover:bg-[#b5c2ff] hover:text-black sm:px-6">Score your account ↗</Link>
      </header>

      <div className="grid lg:min-h-[calc(100vh-56px)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="border-b border-black bg-[#1e1e1e] px-5 py-12 text-white sm:px-10 lg:border-b-0 lg:border-r lg:px-14 lg:py-16">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#b5c2ff]">Jev / Timeline verdict / 03</p>
          <h1 className="mt-10 text-[clamp(3rem,6vw,6.5rem)] font-medium leading-[0.9] tracking-[-0.07em]">Jev scored<a href={`https://x.com/${encodeURIComponent(report.handle)}`} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-[clamp(2rem,4vw,4.25rem)] leading-[1.05] text-[#b5c2ff] hover:underline focus-visible:underline">@{report.handle}.</a></h1>
          <p className="mt-8 text-xl text-white/80">{report.name}</p>
          <p className="mt-2 font-mono text-[10px] uppercase text-white/50">Analyzed {new Date(report.analyzedAt).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" })} · {report.model}</p>
          <div className="mt-12 flex items-end gap-4 border-y border-white/40 py-7">
            <span className="text-[clamp(7rem,15vw,13rem)] font-medium leading-[0.78] tracking-[-0.09em] tabular-nums text-[#b5c2ff]">{report.overall}</span>
            <span className="pb-1 font-mono text-sm text-white/60">/ 100<br />OVERALL</span>
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase text-white/55">{report.posts.length} original posts · {report.replies.length} replies analyzed</p>
          <ScoreShareActions shareId={report.shareId} handle={report.handle} score={report.overall} />
          <Link href="/experiments/account-scorer" className="mt-6 inline-flex border-b border-[#b5c2ff] pb-1 font-mono text-xs uppercase text-[#b5c2ff] transition-opacity hover:opacity-70">Put your timeline on trial ↗</Link>
        </section>

        <section className="bg-[#b5c2ff] px-5 py-12 sm:px-10 lg:px-14 lg:py-16">
          <p className="border-b border-black pb-4 font-mono text-[10px] uppercase tracking-wider">The breakdown / @{report.handle}</p>
          <h2 className="mt-8 text-[clamp(3.5rem,6vw,6.5rem)] font-medium leading-none tracking-[-0.07em]">The receipts<span className="text-[#596cbe]">.</span></h2>
          <div className="mt-10 space-y-8">
            {dimensions.map(({ label, score }) => (
              <div key={label}>
                <div className="flex items-end justify-between gap-4"><span className="text-xl font-medium">{label}</span><span className="font-mono text-2xl tabular-nums">{score}</span></div>
                <div className="mt-3 h-3 border border-black bg-white/35"><div className="h-full bg-[#1e1e1e]" style={{ width: `${score}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-14 border-t border-black pt-8">
            <p className="font-mono text-[10px] uppercase">From the public posts Jev read</p>
            {report.posts.slice(0, 2).map((post, index) => (
              <div key={post.id} className="mt-6 border-b border-black/35 pb-6">
                <span className="font-mono text-[10px]">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-2 whitespace-pre-wrap break-words text-base leading-relaxed">{post.text}</p>
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-mono text-[10px] uppercase underline underline-offset-4">View on X ↗</a>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs leading-relaxed text-black/60">A snapshot of public activity, not a permanent judgment. Want a fresh analysis? Search for @{report.handle} in Account Scorer.</p>
        </section>
      </div>
    </main>
  );
}
