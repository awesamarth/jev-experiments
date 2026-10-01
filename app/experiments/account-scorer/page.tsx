import type { Metadata } from "next";
import Link from "next/link";
import { AccountScorer } from "./account-scorer";

export const metadata: Metadata = {
  title: "Twitter Account Scorer — Jev Experiments",
  description: "Put an X account's original posts and replies on trial with Jev.",
};

export default function AccountScorerPage() {
  return (
    <div className="min-h-screen bg-[#1e1e1e]">
      <header className="flex h-14 items-stretch justify-between border-b border-black bg-[#f7f7f2] text-[#1e1e1e]">
        <Link
          href="/"
          className="flex items-center border-r border-black px-4 font-semibold tracking-tight transition-colors hover:bg-[#b5c2ff] sm:px-6"
        >
          JEV EXPERIMENTS
        </Link>
        <div className="flex items-stretch font-mono text-[10px] uppercase sm:text-xs">
          <span className="hidden items-center border-l border-black px-5 sm:flex">
            <span className="relative -top-px">03 / 06</span>
          </span>
          <Link
            href="/#experiments"
            className="flex items-center border-l border-black bg-[#1e1e1e] px-4 text-white transition-colors hover:bg-[#b5c2ff] hover:text-black sm:px-5"
          >
            <span className="relative -top-px">← All experiments</span>
          </Link>
        </div>
      </header>
      <AccountScorer />
    </div>
  );
}
