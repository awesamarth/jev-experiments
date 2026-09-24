import type { Metadata } from "next";
import Link from "next/link";
import { MagicBall } from "./magic-ball";

export const metadata: Metadata = {
  title: "Magic Jev Ball — Jev Experiments",
  description:
    "Ask a question and let Jev choose from the twenty classic Magic 8 Ball answers.",
};

export default function MagicBallPage() {
  return (
    <div className="min-h-screen bg-[#211d31]">
      <header className="flex h-14 items-stretch justify-between border-b border-black bg-[#f7f7f2] text-[#1e1e1e]">
        <Link
          href="/"
          className="flex items-center border-r border-black px-4 font-semibold tracking-tight transition-colors hover:bg-[#ed7d9b] sm:px-6"
        >
          JEV EXPERIMENTS
        </Link>
        <div className="flex items-stretch font-mono text-[10px] uppercase sm:text-xs">
          <span className="hidden items-center border-l border-black px-5 sm:flex">
            02 / 07
          </span>
          <Link
            href="/#experiments"
            className="flex items-center border-l border-black bg-[#1e1e1e] px-4 text-white transition-colors hover:bg-[#ed7d9b] hover:text-black sm:px-5"
          >
            ← All experiments
          </Link>
        </div>
      </header>
      <MagicBall />
    </div>
  );
}
