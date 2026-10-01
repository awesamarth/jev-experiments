import type { Metadata } from "next";
import Link from "next/link";
import { YouVsJev } from "./you-vs-jev";

export const metadata: Metadata = {
  title: "You vs Jev — Jev Experiments",
  description: "Race Jev to sort twenty customer messages into five categories.",
};

export default function YouVsJevPage() {
  return (
    <div className="min-h-screen bg-[#211d22]">
      <header className="flex h-14 items-stretch justify-between border-b border-black bg-[#f7f7f2] text-[#1e1e1e]">
        <Link
          href="/"
          className="flex items-center border-r border-black px-4 font-semibold tracking-tight transition-colors hover:bg-[#f17ce5] sm:px-6"
        >
          JEV EXPERIMENTS
        </Link>
        <div className="flex items-stretch font-mono text-[10px] uppercase sm:text-xs">
          <span className="hidden items-center border-l border-black px-5 sm:flex">
            <span className="relative -top-px">06 / 06</span>
          </span>
          <Link
            href="/#experiments"
            className="flex items-center border-l border-black bg-[#1e1e1e] px-4 text-white transition-colors hover:bg-[#f17ce5] hover:text-black sm:px-5"
          >
            <span className="relative -top-px">← All experiments</span>
          </Link>
        </div>
      </header>
      <YouVsJev />
    </div>
  );
}
