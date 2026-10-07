import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import manifest from "@/extensions/feed-referee/manifest.json";

const repository = "https://github.com/awesamarth/jev-experiments";
const download = `${repository}#feed-referee`;
const description =
  "A second opinion for your X feed. Flag ragebait, promo, AI Slop, and engagement farming with Jev. Keep the labels, or collapse the noise. Your call.";

export const metadata: Metadata = {
  title: "Feed Referee | Jev Experiments",
  description,
  alternates: { canonical: "/experiments/feed-referee" },
  openGraph: {
    title: "Feed Referee. Less bait. Your call.",
    description,
    url: "/experiments/feed-referee",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const labels = [
  { name: "Ragebait", color: "bg-[#ed7d9b]", text: "Provocation aimed at anger or hostile engagement. Not just an opinion you disagree with." },
  { name: "Promo", color: "bg-[#e9dc58]", text: "Pushing a product, service, project, or signup. Promotion isn't necessarily a bad thing." },
  { name: "AI Slop", color: "bg-[#b5c2ff]", text: "AI-like writing patterns and canned filler. A style estimate, not proof of AI authorship." },
  { name: "Engagement-farming", color: "bg-[#8dd2c7]", text: "Fishing for replies, likes, reposts, or follows rather than sharing something of substance." },
];

const questions = [
  ["Where does it work?", "On supported, visible posts across X: Home, profiles, post pages and replies, search, lists, and bookmarks. It checks the main column in active tabs. Individual post pages show labels without collapsing the post or its replies. X layout changes can require an extension update."],
  ["Does it read my DMs or drafts?", "No. DMs, composers, drafts, account/settings screens, and dialog content are excluded. It judges the text X has loaded, plus quoted text for context. No images, videos, or linked pages are analyzed. Expanding a truncated post can update its judgment."],
  ["Where does my data go?", "When enabled, post text goes directly from the extension to TypeSafe using your own API key. This can include protected posts you can view. No requests go through Jev Experiments servers, and the extension has no analytics or telemetry. TypeSafe's own terms and privacy policy apply."],
  ["What does it cost?", "The extension download is free. Jev requests are billed to your TypeSafe account. New installs have a 2,000-request daily cap that you can lower in the popup. Attempts, including failures and retries, count across tabs and reset at midnight UTC. This is a request cap, not a dollar spending limit."],
  ["Can I trust every label?", "No. These are model probability estimates, not verified facts. Context, irony, and language can affect the result. AI Slop does not prove who or what wrote a post. Nothing is hidden by default, and every collapsed post has a Show tweet button."],
  ["Is this in the Chrome Web Store?", "Not yet. Download it from GitHub and use Chrome's Load unpacked option. It requires desktop Chrome 120+ or a compatible Chromium browser, plus your own TypeSafe key. Updates are manual: replace the unpacked files, then click Reload on the extension card."],
];

function DownloadLink({ light = false }: { light?: boolean }) {
  return (
    <a href={download} target="_blank" rel="noreferrer" className={`inline-flex min-h-14 items-center justify-between gap-10 border border-black px-5 py-4 font-mono text-xs uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 ${light ? "bg-[#e9dc58] text-[#1e1e1e] hover:bg-[#f7f7f2]" : "bg-[#1e1e1e] text-[#f7f7f2] shadow-[5px_5px_0_#a99e3c] hover:bg-[#35312b]"}`}>
      Download extension <span aria-hidden="true" className="text-xl leading-none">↗</span>
      <span className="sr-only"> from GitHub (opens in a new tab)</span>
    </a>
  );
}

export default function FeedRefereePage() {
  return (
    <div className="min-h-screen bg-[#f7f7f2] text-[#1e1e1e]">
      <header className="flex h-14 items-stretch justify-between border-b border-black bg-[#f7f7f2]">
        <Link href="/" className="flex items-center border-r border-black px-4 font-semibold tracking-tight transition-colors hover:bg-[#e9dc58] sm:px-6">JEV EXPERIMENTS</Link>
        <nav aria-label="Experiment navigation" className="flex items-stretch font-mono text-[10px] uppercase sm:text-xs">
          <span className="hidden items-center border-l border-black px-5 sm:flex">05 / 06</span>
          <Link href="/#experiments" className="flex items-center border-l border-black bg-[#1e1e1e] px-4 text-white transition-colors hover:bg-[#e9dc58] hover:text-black sm:px-5">← All experiments</Link>
        </nav>
      </header>

      <main>
        <section className="border-b border-black bg-[#e9dc58] px-4 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-8 flex flex-wrap justify-between gap-3 border-b border-black/40 pb-4 font-mono text-[10px] uppercase">
              <p className="flex items-center gap-2"><span aria-hidden="true" className="size-2 rounded-full bg-[#1e1e1e]" /> A referee, not a filter bubble.</p>
              <span>Chrome extension / v{manifest.version}</span>
            </div>
            <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.4fr] lg:gap-12">
              <div>
                <h1 className="text-[clamp(4.6rem,8.5vw,8rem)] font-medium leading-[0.83] tracking-[-0.075em]">Feed<br />Referee<span className="text-[#797021]">.</span></h1>
                <p className="mt-7 text-2xl font-medium tracking-[-0.04em] sm:text-3xl">Less bait. Your call.</p>
                <p className="mt-3 max-w-md text-base leading-relaxed">Jev flags ragebait, promo, AI Slop, and engagement farming while you scroll X. Keep the labels, or collapse the noise.</p>
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-5">
                  <DownloadLink />
                  <a href="#install" className="font-mono text-[11px] uppercase underline underline-offset-4 hover:no-underline">How to install ↓</a>
                </div>
                <p className="mt-5 max-w-sm text-xs leading-relaxed text-black/70">Desktop Chrome / Chromium. Bring your own TypeSafe key.<br />Opens GitHub. Install unpacked, not from the Web Store.</p>
              </div>
              <figure id="demo" className="min-w-0 scroll-mt-6">
                <div className="border border-black bg-[#111] shadow-[7px_7px_0_#a99e3c]">
                  <div className="flex items-center justify-between gap-3 border-b border-white/25 px-4 py-3 font-mono text-[9px] uppercase text-[#f7f7f2] sm:text-[10px]">
                    <span>In the wild / X</span><span>00:38 · Real footage</span>
                  </div>
                  <video controls playsInline preload="none" poster="/feed-referee/demo-poster.webp" width={1920} height={1080} aria-label="Feed Referee demo" aria-describedby="demo-caption" className="aspect-video h-auto w-full bg-black">
                    <source src="/feed-referee/demo.mp4" type="video/mp4" />
                    <a href="/feed-referee/demo.mp4">Watch the Feed Referee demo</a>
                  </video>
                </div>
                <figcaption id="demo-caption" className="mt-4 text-xs leading-relaxed text-black/70">Jev caught this site’s own developer lacking.</figcaption>
                <details className="mt-2 text-xs leading-relaxed">
                  <summary className="w-fit cursor-pointer underline underline-offset-4">Read the demo walkthrough</summary>
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-black/75">
                    <li>Enable Feed Referee in the popup.</li>
                    <li>Open a Home badge: Promo, 90%.</li>
                    <li>Check bookmarked posts: AI Slop, 77%, and Ragebait, 80%.</li>
                    <li>Open a profile post with two labels: Promo, 89%, and Engagement-farming, 82%.</li>
                    <li>Turn on optional collapsing, then click Show tweet to restore a hidden post.</li>
                  </ol>
                </details>
              </figure>
            </div>
          </div>
        </section>

        <section aria-labelledby="labels-title" className="border-b border-black px-4 py-12 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h2 id="labels-title" className="text-3xl font-medium leading-tight tracking-[-0.05em] sm:text-4xl">Four calls. Not one verdict.</h2>
              <p className="max-w-md text-sm leading-relaxed text-black/65">Each label is judged independently. Badges appear at 70% or above, and one post can get more than one.</p>
            </div>
            <div className="grid border-l border-t border-black sm:grid-cols-2 xl:grid-cols-4">
              {labels.map((label, index) => (
                <article key={label.name} className="border-b border-r border-black p-5 sm:p-6">
                  <div className="mb-7 flex items-center justify-between"><span className={`size-5 border border-black ${label.color}`} aria-hidden="true" /><span className="font-mono text-[10px] text-black/50">0{index + 1}</span></div>
                  <h3 className="text-xl font-medium tracking-[-0.035em]">{label.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-black/70">{label.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="control-title" className="border-b border-black bg-[#d5ddda] px-4 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-[1500px]">
            <p className="font-mono text-[10px] uppercase">[ On your terms ]</p>
            <h2 id="control-title" className="mt-4 max-w-3xl text-4xl font-medium leading-[0.98] tracking-[-0.05em] sm:text-6xl">A second opinion.<br />Not a disappearing act.</h2>
            <div className="mt-9 grid gap-6 lg:grid-cols-2">
              <figure className="border border-black bg-[#f7f7f2]">
                <a href="/feed-referee/rohan-labels.webp" target="_blank" rel="noreferrer" className="block border-b border-black bg-black focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#e9dc58]" aria-label="Open full-size screenshot of a post with two Feed Referee labels (new tab)">
                  <Image src="/feed-referee/rohan-labels.webp" alt="Rohan’s personal-assistant invites post, with Feed Referee estimating Promo at 96% and Engagement-farming at 89%." width={890} height={570} sizes="(min-width: 1024px) 50vw, 100vw" className="h-auto w-full" />
                </a>
                <figcaption className="p-5 sm:p-7"><p className="font-mono text-[10px] uppercase text-black/55">01 / In the name row</p><h3 className="mt-3 text-2xl font-medium tracking-[-0.04em]">A badge, not a lecture.</h3><p className="mt-3 max-w-xl text-sm leading-relaxed text-black/70">Compact labels sit alongside the author. Click for probabilities and what each label means. No feed reordering, no auto-likes, no auto-replies.</p></figcaption>
              </figure>
              <figure className="border border-black bg-[#f7f7f2]">
                <a href="/feed-referee/controls.webp" target="_blank" rel="noreferrer" className="flex aspect-[890/570] items-center justify-center border-b border-black bg-[#151316] p-5 focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#e9dc58] sm:p-7" aria-label="Open full-size screenshot of collapse controls (new tab)">
                  <Image src="/feed-referee/controls.webp" alt="Popup settings with optional collapsing enabled for all four labels and the minimum probability set to 85%." width={467} height={423} sizes="(min-width: 1024px) 440px, 75vw" className="h-full w-auto max-w-full object-contain" />
                </a>
                <figcaption className="p-5 sm:p-7"><p className="font-mono text-[10px] uppercase text-black/55">02 / You make the call</p><h3 className="mt-3 text-2xl font-medium tracking-[-0.04em]">Hide less. Or hide nothing.</h3><p className="mt-3 max-w-xl text-sm leading-relaxed text-black/70">Collapsing is off by default. Choose labels and a threshold in the popup. Changes autosave, and Show tweet always brings a collapsed post back.</p></figcaption>
              </figure>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase text-black/60">Screenshots from the real demo. Click to enlarge.</p>
          </div>
        </section>

        <section id="install" aria-labelledby="install-title" className="scroll-mt-6 border-b border-black px-4 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[0.85fr_1.4fr] lg:gap-12">
            <div><p className="font-mono text-[10px] uppercase">[ Get it running ]</p><h2 id="install-title" className="mt-4 text-4xl font-medium leading-[0.98] tracking-[-0.05em] sm:text-6xl">Your browser.<br />Your key.</h2><p className="mt-5 max-w-sm text-sm leading-relaxed text-black/70">No Jev Experiments account. The extension talks directly to TypeSafe, and API usage is billed to your TypeSafe account.</p><a href="https://typesafe.ai/" target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm underline underline-offset-4">Get a TypeSafe key ↗</a></div>
            <ol className="divide-y divide-black border-y border-black">
              {[
                ["Download & unzip", <>Open the <a href={download} target="_blank" rel="noreferrer" className="underline underline-offset-4">GitHub download instructions ↗</a>. Get the Feed Referee ZIP from Releases and extract it. Keep the extracted folder somewhere permanent.</>],
                ["Load the extension", <>In desktop Chrome, open <code className="break-all bg-black/5 px-1 py-0.5">chrome://extensions</code>. Enable Developer mode, choose Load unpacked, and select the extracted <code>feed-referee</code> folder containing <code>manifest.json</code>.</>],
                ["Add your key. Then switch it on.", <>Pin Feed Referee. Paste your own TypeSafe key, review the data-sharing notice, and set a daily request cap. It starts paused. Enable it, then open or reload X.</>],
              ].map(([title, text], index) => (
                <li key={index} className="flex gap-5 py-6 sm:gap-8"><span className="pt-1 font-mono text-xs text-black/50">0{index + 1}</span><div><h3 className="text-xl font-medium tracking-[-0.035em]">{title}</h3><p className="mt-2 text-sm leading-relaxed text-black/70">{text}</p></div></li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="px-4 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[0.85fr_1.4fr] lg:gap-12">
            <div><p className="font-mono text-[10px] uppercase">[ The fine print, up front ]</p><h2 id="faq-title" className="mt-4 text-4xl font-medium tracking-[-0.05em]">Know the limits.</h2><Link href="/experiments/feed-referee/privacy" className="mt-5 inline-block text-sm underline underline-offset-4">Read privacy & limits →</Link></div>
            <div className="divide-y divide-black border-y border-black">
              {questions.map(([question, answer]) => (
                <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-medium [&::-webkit-details-marker]:hidden">{question}<span aria-hidden="true" className="text-2xl font-normal group-open:rotate-45">+</span></summary><p className="mt-4 max-w-2xl pr-6 text-sm leading-relaxed text-black/70">{answer}</p></details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-black bg-[#1e1e1e] px-4 py-10 text-[#f7f7f2] sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="text-3xl font-medium tracking-[-0.05em] sm:text-4xl">Give your feed a second opinion.</p><p className="mt-2 text-sm text-white/60">Source available. Your own key. Always your call.</p></div><div className="shrink-0"><DownloadLink light /></div></div>
        </section>
      </main>
      <footer className="px-4 py-6 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1500px] flex-wrap justify-between gap-4 font-mono text-[10px] uppercase"><span>Built with TypeSafe&apos;s Jev. Independent project.</span><div className="flex gap-5"><Link href="/experiments/feed-referee/privacy" className="underline underline-offset-4">Privacy</Link><a href={`${repository}/tree/main/extensions/feed-referee`} target="_blank" rel="noreferrer" className="underline underline-offset-4">View source ↗</a></div></div></footer>
    </div>
  );
}
