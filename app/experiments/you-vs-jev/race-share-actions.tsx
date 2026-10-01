"use client";

import { useState } from "react";

type RaceResult = {
  winner: "you" | "jev" | null;
  humanCorrect: number;
  jevCorrect: number;
  humanMs: number;
  jevMs: number | null;
  jevDnf: boolean;
  jevCompleted: number;
};

function time(ms: number) {
  return `${(ms / 1000).toFixed(1)}s`;
}

async function createRaceImage(result: RaceResult): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image rendering is unavailable.");
  const ctx = context;

  const black = "#211d22";
  const pink = "#f17ce5";
  const white = "#f7f7f2";
  ctx.fillStyle = black;
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = pink;
  ctx.fillRect(470, 0, 730, 630);

  function text(value: string, x: number, y: number, size: number, color: string, weight = 400, mono = false, tracking = 0) {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ${mono ? '"Geist Mono", monospace' : 'Geist, Arial, sans-serif'}`;
    ctx.letterSpacing = `${tracking}px`;
    ctx.fillText(value, x, y);
  }
  function line(x1: number, y: number, x2: number, color: string) {
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  text("JEV EXPERIMENTS / 06", 44, 56, 16, pink, 400, true);
  text("You", 40, 185, 88, white, 500, false, -6.6);
  text("vs Jev.", 40, 261, 88, pink, 500, false, -6.6);
  line(44, 325, 426, "#69516a");
  text("INBOX TRIAGE / FINAL VERDICT", 44, 367, 14, pink, 400, true);
  if (result.jevDnf) {
    text("Jev", 40, 458, 68, white, 500, false, -5.1);
    text("disconnected.", 40, 526, 48, white, 500, false, -3.6);
  } else {
    text(result.winner === "you" ? "You win." : "Jev wins.", 40, 475, 78, white, 500, false, -5.85);
  }
  text("20 MESSAGES. 5 CATEGORIES.", 44, 586, 14, pink, 400, true);

  text("THE RECEIPTS", 524, 57, 18, black, 400, true);
  line(524, 87, 1146, black);

  const cols = [524, 863];
  text("YOU", cols[0], 155, 22, black, 500, true);
  text("JEV", cols[1], 155, 22, black, 500, true);
  text(`${result.humanCorrect}`, cols[0] - 3, 278, 106, black, 500);
  text(result.jevDnf ? "DNF" : `${result.jevCorrect}`, cols[1] - 3, 278, result.jevDnf ? 84 : 106, black, 500);
  text("/ 20 CORRECT", cols[0], 321, 18, black, 400, true);
  text(result.jevDnf ? `${result.jevCompleted}/20 COMPLETED` : "/ 20 CORRECT", cols[1], 321, 18, black, 400, true);
  text(time(result.humanMs), cols[0], 397, 44, black, 500, true);
  text(result.jevDnf ? "DID NOT FINISH" : time(result.jevMs ?? 0), cols[1], 397, result.jevDnf ? 19 : 44, black, 500, true);
  line(524, 442, 1146, black);
  text("ACCURACY FIRST. SPEED BREAKS THE TIE.", 524, 485, 16, black, 400, true);
  text("Can you beat Jev?", 524, 537, 31, black, 500, false, -0.8);
  text("jev-experiments.awesamarth.dev", 524, 587, 16, black, 400, true);

  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("Could not generate the scorecard."));
  }, "image/png"));
}

export function RaceShareActions({ result }: { result: RaceResult }) {
  const [busy, setBusy] = useState<"copy" | "download" | null>(null);
  const [feedback, setFeedback] = useState("");
  const gameUrl = "https://jev-experiments.awesamarth.dev/experiments/you-vs-jev";
  const tweet = result.jevDnf
    ? `I sorted ${result.humanCorrect}/20 messages in ${time(result.humanMs)}. Jev couldn't finish this round. Your turn.`
    : `I ${result.winner === "you" ? "beat Jev" : "lost to Jev"} at inbox triage.\n\nMe: ${result.humanCorrect}/20 in ${time(result.humanMs)}\nJev: ${result.jevCorrect}/20 in ${time(result.jevMs ?? 0)}\n\nYour turn.`;
  const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(gameUrl)}`;

  async function copyImage() {
    if (busy) return;
    setBusy("copy");
    setFeedback("Copying...");
    try {
      // Start the clipboard operation in the click handler, preserving user activation in Safari.
      await navigator.clipboard.write([new ClipboardItem({ "image/png": createRaceImage(result) })]);
      setFeedback("Image copied! Paste it into your post on X.");
    } catch {
      setFeedback("Couldn't copy the image here. Use Download PNG instead.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadImage() {
    if (busy) return;
    setBusy("download");
    setFeedback("Generating image...");
    try {
      const url = URL.createObjectURL(await createRaceImage(result));
      const link = document.createElement("a");
      link.href = url;
      link.download = "You-vs-Jev-Result.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setFeedback("PNG ready. Attach it to your post on X.");
    } catch {
      setFeedback("Couldn't generate the image. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const buttonClass = "cursor-pointer border border-black px-3 py-3 font-mono text-[10px] uppercase transition-colors hover:bg-[#f17ce5] disabled:cursor-wait disabled:opacity-50";
  return (
    <div className="mt-6 max-w-xl border-t border-black/25 pt-4">
      <p className="font-mono text-[10px] uppercase text-black/60">Share your result</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <a href={xIntent} target="_blank" rel="noopener noreferrer" className={`${buttonClass} flex items-center justify-center bg-[#211d22] text-white hover:text-black`}>Share on X ↗</a>
        <button type="button" onClick={copyImage} disabled={busy !== null} aria-busy={busy === "copy"} className={buttonClass}>{busy === "copy" ? "Copying..." : "Copy image"}</button>
        <button type="button" onClick={downloadImage} disabled={busy !== null} aria-busy={busy === "download"} className={buttonClass}>{busy === "download" ? "Generating..." : "Download PNG ↓"}</button>
      </div>
      <p aria-live="polite" className="mt-2 text-xs leading-relaxed text-black/60">{feedback || "Copy or download the image, then attach it to your post."}</p>
    </div>
  );
}
