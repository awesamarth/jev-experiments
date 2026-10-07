import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Feed Referee: Privacy & limits | Jev Experiments",
  description: "What Feed Referee sends to TypeSafe, what stays in your browser, and the limits of its judgments.",
  alternates: { canonical: "/experiments/feed-referee/privacy" },
};

const sections = [
  {
    title: "What leaves your browser",
    paragraphs: [
      "When you add your own TypeSafe API key and enable Feed Referee, the text X has loaded for supported visible posts, plus quoted text, is sent directly to api.typesafe.ai for Jev to judge. This can include protected posts you have permission to view. TypeSafe processes this data under its own terms and privacy policy; the extension does not control their retention.",
      "No extension requests go to Jev Experiments servers. The extension has no analytics, advertising, telemetry, or remote executable code. Viewing this website is separate from using the extension; this page and its demo are served by the website host.",
    ],
  },
  {
    title: "What is not collected",
    paragraphs: [
      "The extension does not collect passwords, cookies, DMs, account tokens, browsing history, images, videos, linked-page contents, or the contents of unrelated tabs. Display names and handles are not separate API inputs, but names or other personal information written in a post are part of its text.",
      "Only eligible rendered posts in the main content column of active X tabs are processed. DMs, composers, drafts, account/settings screens, and dialog content are excluded. Quotes supply context only and receive no separate badge or request.",
    ],
  },
  {
    title: "Your key and local storage",
    paragraphs: [
      "Your key stays in extension session storage by default. Remember key stores it on this device until you remove it or uninstall the extension. Chrome extension storage is not an encrypted vault and is not synced to your Chrome account. Keep your device and browser profile secure. The key is not made accessible to X or the extension's content script.",
      "Settings and daily request/token counters stay local. A bounded cache stores hashes of post IDs/text and probabilities, not raw post text, for up to seven days and at most 1,000 entries. Clear judgment cache in the popup deletes it. Removing a key does not clear cached judgments; uninstalling removes extension storage.",
    ],
  },
  {
    title: "Judgments, not facts",
    paragraphs: [
      "Ragebait, promo, AI Slop, and engagement farming are independent model estimates and can be wrong. An AI Slop label is a style estimate, not proof of AI use or authorship. The detail panel describes the rubric, not a generated explanation or verified evidence.",
      "Media-only, very short, and over-limit posts are skipped. Posts with Show more are judged using the text X has loaded, with a truncation caveat. Expanding a post can trigger a new judgment. Missing context, irony, quotes, and non-English text may reduce accuracy. Images, videos, and linked pages are never analyzed. Changes to X's layout may require an extension update.",
    ],
  },
  {
    title: "Control and costs",
    paragraphs: [
      "The extension starts paused and collapsing is off by default. Use the popup to enable or pause it, choose optional collapsing and label thresholds, and set a daily request cap. Every collapsed post has a Show tweet button. Individual post pages show labels without collapsing the post or replies.",
      "API requests are billed to your own TypeSafe account. The daily cap counts attempts, including failures and retries, across tabs, resetting at midnight UTC. New installs default to 2,000 requests per day; you can lower this in the popup. It is not a dollar spending limit or a guarantee of the provider's billing.",
      "Pausing aborts pending requests where possible and removes extension UI. Already-sent requests may still be billed. Failures leave posts visible, with bounded retries and cooldowns. There are no automatic likes, replies, follows, or feed reordering.",
    ],
  },
];

export default function FeedRefereePrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f2] text-[#1e1e1e]">
      <header className="flex h-14 items-stretch justify-between border-b border-black">
        <Link href="/" className="flex items-center border-r border-black px-4 font-semibold tracking-tight sm:px-6">JEV EXPERIMENTS</Link>
        <Link href="/experiments/feed-referee" className="flex items-center border-l border-black bg-[#e9dc58] px-4 font-mono text-[10px] uppercase sm:px-6 sm:text-xs">← Feed Referee</Link>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="font-mono text-[10px] uppercase">Feed Referee / Privacy & limits</p>
        <h1 className="mt-5 text-5xl font-medium leading-none tracking-[-0.06em] sm:text-7xl">The fine print.<br />In plain sight.</h1>
        <p className="mt-6 text-lg leading-relaxed text-black/65">Your feed stays in your browser. The post text you ask Jev to judge does not. Here is exactly what that means.</p>
        <div className="mt-10 divide-y divide-black border-y border-black">
          {sections.map((section) => (
            <section key={section.title} className="py-7">
              <h2 className="text-2xl font-medium tracking-[-0.04em]">{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 text-sm leading-relaxed text-black/75">{paragraph}</p>)}
            </section>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-6 text-sm underline underline-offset-4">
          <Link href="/experiments/feed-referee">Back to Feed Referee</Link>
          <a href="https://typesafe.ai/" target="_blank" rel="noreferrer">TypeSafe ↗</a>
          <a href="https://github.com/awesamarth/jev-experiments/issues" target="_blank" rel="noreferrer">Questions or issues ↗</a>
        </div>
      </main>
    </div>
  );
}
