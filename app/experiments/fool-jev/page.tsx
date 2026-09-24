import type { Metadata } from "next";
import Link from "next/link";
import { FoolJev } from "./fool-jev";

export const metadata: Metadata = {
  title: "Fool Jev — Jev Experiments",
  description:
    "Talk your way into Jumbrella Corporation's restricted biochemical facility in ten answers or fewer.",
};

export default function FoolJevPage() {
  return (
    <div className="min-h-screen bg-[#252927]">
      <header className="flex h-14 items-stretch justify-between border-b border-black bg-[#f7f7f2] text-[#1e1e1e]">
        <Link
          href="/"
          className="flex items-center border-r border-black px-4 font-semibold tracking-tight transition-colors hover:bg-[#e7b85c] sm:px-6"
        >
          JEV EXPERIMENTS
        </Link>
        <div className="flex items-stretch font-mono text-[10px] uppercase sm:text-xs">
          <span className="hidden items-center border-l border-black px-5 sm:flex">
            02 / 07
          </span>
          <Link
            href="/#experiments"
            className="flex items-center border-l border-black bg-[#1e1e1e] px-4 text-white transition-colors hover:bg-[#e7b85c] hover:text-black sm:px-5"
          >
            ← All experiments
          </Link>
        </div>
      </header>
      <FoolJev />
    </div>
  );
}
