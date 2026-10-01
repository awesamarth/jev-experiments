"use client";

import { useState } from "react";

export function ScoreShareActions({ shareId, handle, score, compact = false }: { shareId: string; handle: string; score: number; compact?: boolean }) {
  const [feedback, setFeedback] = useState("");
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const shareUrl = `https://jev-experiments.awesamarth.dev/score/${shareId}`;
  const imageUrl = `/score/${shareId}/opengraph-image`;
  const tweet = `Jev scored @${handle}'s X account ${score}/100. Think it got the verdict right?`;
  const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(shareUrl)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setFeedback("Link copied!");
    } catch {
      setFeedback("Clipboard unavailable. Open the scorecard and copy its URL.");
    }
  }

  async function copyImage() {
    if (isCopyingImage) return;
    setIsCopyingImage(true);
    setFeedback("Copying...");
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Image unavailable");
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setFeedback("Image copied! Paste it into your post on X.");
    } catch {
      setFeedback("Image copy unavailable here. Use Download PNG instead.");
    } finally {
      setIsCopyingImage(false);
    }
  }

  const buttonClass = "cursor-pointer border border-white/40 px-3 py-3 text-center font-mono text-[10px] uppercase transition-colors hover:bg-[#b5c2ff] hover:text-[#1e1e1e]";

  return (
    <div id="share-score" className={compact ? "mt-5 scroll-mt-6" : "mt-7 scroll-mt-6 border border-[#b5c2ff]/50 bg-[#b5c2ff]/[0.07] p-4 sm:p-5"}>
      {!compact ? <>
        <p className="font-mono text-[10px] uppercase text-[#b5c2ff]">Share the verdict ↗</p>
        <p className="mt-2 text-sm text-white/60">A permanent scorecard for this analysis. Future re-analyses won&apos;t change this link.</p>
      </> : null}
      <div className={`${compact ? "" : "mt-5"} grid grid-cols-2 gap-2 ${compact ? "xl:grid-cols-4" : ""}`}>
        <a href={xIntent} target="_blank" rel="noopener noreferrer" className={`${buttonClass} bg-[#b5c2ff] text-[#1e1e1e] hover:bg-white`}>Share on X ↗</a>
        <button type="button" onClick={copyLink} className={buttonClass}>Copy link</button>
        <button type="button" onClick={copyImage} disabled={isCopyingImage} aria-busy={isCopyingImage} className={`${buttonClass} disabled:cursor-wait disabled:opacity-60`}>{isCopyingImage ? "Copying..." : "Copy image"}</button>
        <a href={imageUrl} download={`jev-score-${handle}.png`} className={buttonClass}>Download PNG ↓</a>
      </div>
      <p aria-live="polite" className={`${compact ? "mt-2" : "mt-3 min-h-4"} font-mono text-[10px] text-[#b5c2ff]`}>{feedback}</p>
    </div>
  );
}
