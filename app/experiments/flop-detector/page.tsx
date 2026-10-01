import type { Metadata } from "next";
import Link from "next/link";
import { FlopDetector } from "./flop-detector";

export const metadata: Metadata = {
  title: "Banger Alert — Jev Experiments",
  description: "Score your tweet draft with Jev before you post it on X.",
};

export default function FlopDetectorPage() {
  return (
    <div className="min-h-screen bg-[#1e1e1e]">
      <header className="flex h-14 items-stretch justify-between border-b border-black bg-[#f7f7f2] text-[#1e1e1e]">
        <Link
          href="/"
          className="flex items-center border-r border-black px-4 font-semibold tracking-tight transition-colors hover:bg-[#f5a45d] sm:px-6"
        >
          JEV EXPERIMENTS
        </Link>
        <div className="flex items-stretch font-mono text-[10px] uppercase sm:text-xs">
          <span className="hidden items-center border-l border-black px-5 sm:flex">
            <span className="relative -top-px">04 / 06</span>
          </span>
          <Link
            href="/#experiments"
            className="flex items-center border-l border-black bg-[#1e1e1e] px-4 text-white transition-colors hover:bg-[#f5a45d] hover:text-black sm:px-5"
          >
            <span className="relative -top-px">← All experiments</span>
          </Link>
        </div>
      </header>
      <FlopDetector />
    </div>
  );
}
