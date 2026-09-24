const experiments = [
  {
    number: "01",
    slug: "polymarket",
    title: "Polymarket Trading Bot",
    type: "Paper trading",
    status: "Planned",
    description:
      "A decision model gets a paper bankroll. Every call, win, and wipeout—logged in public.",
    action: "View experiment",
    tone: "bg-[#06b6a8]",
    surface: "light",
  },
  {
    number: "02",
    slug: "magic-ball",
    title: "Magic Jev Ball",
    type: "Interactive",
    status: "Planned",
    description:
      "Ask a question. Jev turns calibrated probability into suspiciously specific fortune-telling.",
    action: "Ask the ball",
    tone: "bg-[#342d49]",
    surface: "dark",
  },
  {
    number: "03",
    slug: "fool-jev",
    title: "Fool Jev",
    type: "Game",
    status: "Rules loading",
    description:
      "A game of misdirection between you and a model built to make decisions. Full rules coming soon.",
    action: "Coming soon",
    tone: "bg-[#e9dc58]",
    surface: "light",
  },
  {
    number: "04",
    slug: "account-scorer",
    title: "Twitter Account Scorer",
    type: "Web experiment",
    status: "Planned",
    description:
      "Put a timeline on trial. Jev scores the account across signal, originality, and terminal posting habits.",
    action: "Score an account",
    tone: "bg-[#b5c2ff]",
    surface: "light",
  },
  {
    number: "05",
    slug: "flop-detector",
    title: "Tweet Flop Detector",
    type: "Web + extension",
    status: "Planned",
    description:
      "Draft first, post later. Get a banger / mid / flop probability split before the timeline gets a vote.",
    action: "Test a draft",
    tone: "bg-[#f5a45d]",
    surface: "dark",
  },
  {
    number: "06",
    slug: "feed-referee",
    title: "Feed Referee",
    type: "Browser extension",
    status: "Planned",
    description:
      "A live referee for your X feed, labeling posts as ragebait, PR, ad, or actual content while you scroll.",
    action: "Watch demo",
    tone: "bg-[#d7d7d2]",
    surface: "dark",
  },
  {
    number: "07",
    slug: "you-vs-jev",
    title: "You vs Jev",
    type: "Speed test",
    status: "Planned",
    description:
      "One hundred items. Five categories. You click while Jev sorts in parallel. Fastest mind wins.",
    action: "Start the race",
    tone: "bg-[#f17ce5]",
    surface: "light",
  },
] as const;

function Arrow() {
  return (
    <span
      aria-hidden="true"
      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
    >
      ↗
    </span>
  );
}

function ExperimentVisual({ slug }: { slug: (typeof experiments)[number]["slug"] }) {
  if (slug === "polymarket") {
    return (
      <div className="grid h-full grid-cols-5 items-end gap-2 px-6 pb-6 pt-12 sm:px-10">
        {[42, 68, 54, 88, 74].map((height, index) => (
          <div key={height} className="relative border-x border-t border-black/70 bg-[#dff8f1]" style={{ height: `${height}%` }}>
            <span className="absolute -top-6 left-0 font-mono text-[9px]">0{index + 1}</span>
          </div>
        ))}
        <div className="absolute left-5 top-5 border border-black bg-[#f4f4ef] px-2 py-1 font-mono text-[10px] uppercase">
          Paper P&amp;L +12.8%
        </div>
      </div>
    );
  }

  if (slug === "magic-ball") {
    return (
      <div className="relative flex h-full items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#fff_0.7px,transparent_0.7px)] [background-size:7px_7px]" />
        <span className="absolute left-4 top-4 z-20 border border-white/50 bg-black/30 px-2 py-1 font-mono text-[8px] uppercase text-white">
          Decision incoming
        </span>

        <div className="relative mt-10 aspect-square h-[112%] max-h-[310px] rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,#8e8b92_0%,#35343a_13%,#111114_42%,#020203_72%)] shadow-[0_24px_60px_rgba(0,0,0,0.7)] transition-transform duration-700 ease-out group-hover:rotate-2 group-hover:scale-[1.025]">
          <div className="absolute left-[20%] top-[11%] h-[16%] w-[27%] -rotate-[24deg] rounded-[50%] bg-white/25 blur-md transition-transform duration-700 group-hover:translate-x-2 group-hover:translate-y-1" />
          <div className="absolute inset-[20%] rounded-full border border-white/15 bg-[radial-gradient(circle_at_45%_35%,#2c2b31,#050506_70%)] shadow-[inset_0_8px_18px_rgba(0,0,0,0.9)]">
            <div className="absolute left-1/2 top-1/2 h-[62%] w-[72%] -translate-x-1/2 -translate-y-[66%] [clip-path:polygon(50%_0,100%_100%,0_100%)] bg-[#665be8] drop-shadow-[0_0_18px_rgba(113,99,255,0.65)]" />
            <p className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center font-mono text-[9px] font-medium uppercase leading-[1.05] text-white sm:text-[11px]">
              Signs
              <br />
              point to
              <br />
              yes
              <br />
              <span className="opacity-65">78%</span>
            </p>
          </div>
        </div>

        <span className="absolute bottom-3 right-4 z-20 font-mono text-[8px] uppercase text-white/65">
          Ask → Shake → Decide
        </span>
      </div>
    );
  }

  if (slug === "fool-jev") {
    return (
      <div className="flex h-full items-center justify-center gap-4 font-mono">
        <div className="border border-black bg-[#f4f4ef] px-5 py-7 text-5xl">?</div>
        <div className="text-2xl">VS</div>
        <div className="border border-black bg-black px-5 py-7 text-5xl text-white">?</div>
      </div>
    );
  }

  if (slug === "account-scorer") {
    return (
      <div className="mx-auto flex h-full max-w-sm items-center px-6">
        <div className="w-full border border-black bg-[#f4f4ef] shadow-[7px_7px_0_#1e1e1e]">
          <div className="flex items-center gap-3 border-b border-black p-3">
            <div className="size-9 rounded-full border border-black bg-[#b5c2ff]" />
            <div className="font-mono text-[10px] uppercase">@terminally_online</div>
            <div className="ml-auto text-2xl">74</div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-black text-center font-mono text-[9px] uppercase">
            <div className="p-3">Signal<br /><b>81</b></div>
            <div className="p-3">Original<br /><b>68</b></div>
            <div className="p-3">Posting<br /><b>92</b></div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === "flop-detector") {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="w-full max-w-sm border border-black bg-[#f4f4ef] p-4 text-[#1e1e1e]">
          <p className="mb-5 text-sm">just shipped something nobody asked for...</p>
          <div className="grid grid-cols-3 gap-1 font-mono text-[9px] uppercase">
            <div className="bg-[#06b6a8] p-2">Banger<br /><b className="text-lg">61</b></div>
            <div className="bg-[#e9dc58] p-2">Mid<br /><b className="text-lg">30</b></div>
            <div className="bg-[#ed7d9b] p-2">Flop<br /><b className="text-lg">09</b></div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === "feed-referee") {
    const posts = [
      {
        handle: "@definitely_unbiased",
        text: "Everything you know about work is completely wrong. A thread 🧵",
        label: "Ragebait · 91%",
        color: "bg-[#ed7d9b]",
      },
      {
        handle: "@growthwizard",
        text: "I tried this tool for 7 days and my productivity went up 400%.",
        label: "Promo · 88%",
        color: "bg-[#e9dc58]",
      },
      {
        handle: "@content_engine",
        text: "In today’s fast-paced digital world, consistency is the key to success.",
        label: "AI slop · 94%",
        color: "bg-[#b5c2ff]",
      },
    ];

    return (
      <div className="flex h-full items-center justify-center px-6 py-4 text-[#1e1e1e]">
        <div className="h-full w-full max-w-md overflow-hidden border border-black bg-[#f7f7f2] shadow-[6px_6px_0_#1e1e1e]">
          <div className="flex items-center justify-between border-b border-black px-3 py-2">
            <span className="text-xs font-semibold">Home</span>
            <span className="font-mono text-[8px] uppercase">Feed Referee: On</span>
          </div>
          {posts.map((post, index) => (
            <div key={post.handle} className={`relative flex gap-2 px-3 py-2.5 ${index ? "border-t border-black/30" : ""}`}>
              <div className="mt-0.5 size-6 shrink-0 rounded-full border border-black bg-[#d7d7d2]" />
              <div className="min-w-0 pr-20">
                <p className="truncate font-mono text-[8px]">{post.handle}</p>
                <p className="mt-1 text-[10px] leading-tight sm:text-[11px]">{post.text}</p>
              </div>
              <span className={`absolute right-2 top-2 border border-black px-1.5 py-1 font-mono text-[7px] uppercase ${post.color}`}>
                {post.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden font-mono">
      <div className="absolute left-5 top-5 border border-black bg-[#f4f4ef] px-2 py-1 text-[9px] uppercase">Human 00:18.42</div>
      <div className="absolute right-5 top-5 bg-black px-2 py-1 text-[9px] uppercase text-white">Jev 00:00.83</div>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 25 }, (_, index) => (
          <div
            key={index}
            className={`size-5 border border-black sm:size-7 ${index < 22 ? "bg-[#f4f4ef]" : "bg-black"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#d5ddda] text-[#1e1e1e]">
      <header className="flex h-14 items-stretch justify-between border-b border-black bg-[#f7f7f2] text-sm">
        <a href="#top" className="flex items-center border-r border-black px-4 font-semibold tracking-tight sm:px-6">
          JEV EXPERIMENTS
        </a>
        <nav aria-label="Primary navigation" className="flex items-stretch font-mono text-[10px] uppercase sm:text-xs">
          <a href="#experiments" className="hidden items-center border-l border-black px-5 transition-colors hover:bg-[#e9dc58] sm:flex">
            Experiments
          </a>
          <a href="#about" className="flex items-center border-l border-black px-4 transition-colors hover:bg-[#b5c2ff] sm:px-5">
            About
          </a>
          <a href="https://typesafe.ai/" target="_blank" rel="noreferrer" className="hidden items-center border-l border-black bg-[#1e1e1e] px-4 text-white transition-colors hover:bg-[#ed7d9b] hover:text-black sm:flex sm:px-5">
            What is Jev? <span className="ml-2">↗</span>
          </a>
        </nav>
      </header>

      <section id="top" className="relative border-b border-black px-4 py-10 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#1e1e1e_0.7px,transparent_0.7px)] [background-size:5px_5px]" />
        <div className="relative mx-auto max-w-[1500px]">
          <div className="mb-16 flex items-center justify-between font-mono text-[10px] uppercase sm:mb-24">
            <span>Independent project · 2026</span>
            <span className="hidden sm:inline">07 experiments / 01 model</span>
          </div>
          <h1 className="flex items-end gap-3 whitespace-nowrap sm:gap-5">
            <span className="text-[clamp(6rem,14vw,13.5rem)] font-medium leading-[0.72] tracking-[-0.09em]">JEV</span>
            <span className="mb-[0.08em] border border-black bg-[#ed7d9b] px-[0.18em] py-[0.08em] text-[clamp(1.7rem,5vw,5rem)] font-medium leading-none tracking-[-0.06em]">
              EXPERIMENTS
            </span>
          </h1>
          <div className="mt-7 grid gap-8 border-t border-black pt-6 md:grid-cols-[1.2fr_0.8fr]">
            <p className="max-w-3xl text-4xl font-medium leading-[0.96] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Putting programmable common sense to work.
            </p>
            <div className="flex max-w-md flex-col justify-between gap-10 md:ml-auto">
              <p className="text-base leading-relaxed sm:text-lg">
                Seven attempts to find out what happens when software can make fast, typed judgments—and show its uncertainty.
              </p>
              <a href="#experiments" className="flex w-fit items-center gap-8 border border-black bg-[#f7f7f2] px-4 py-3 font-mono text-xs uppercase shadow-[5px_5px_0_#1e1e1e] transition-transform hover:-translate-y-1">
                Browse the experiments <span>↓</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="experiments" className="bg-[#f7f7f2] px-4 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 grid gap-4 border-b border-black pb-5 md:grid-cols-2">
            <p className="font-mono text-[10px] uppercase">[ Project index ]</p>
            <p className="max-w-lg text-2xl font-medium leading-tight tracking-[-0.03em] md:ml-auto">
              Some live here. Some escape into extensions, bots, and the open internet.
            </p>
          </div>

          <div className="grid border-l border-t border-black md:grid-cols-2">
            {experiments.map((experiment, index) => (
              <a
                key={experiment.slug}
                href={`/experiments/${experiment.slug}`}
                className={`group relative flex min-h-[520px] cursor-pointer flex-col border-b border-r border-black focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#ed7d9b] ${index === 0 ? "md:col-span-2" : ""} ${
                  experiment.surface === "dark"
                    ? "bg-[#1e1e1e] text-[#f7f7f2] transition-colors duration-300 hover:bg-[#ed7d9b] hover:text-[#1e1e1e]"
                    : "bg-[#f7f7f2] text-[#1e1e1e] transition-colors duration-300 hover:bg-[#ed7d9b] hover:text-[#1e1e1e]"
                }`}
              >
                <div className={`flex items-center border-b font-mono text-[9px] uppercase transition-colors duration-300 sm:text-[10px] ${experiment.surface === "dark" ? "border-white/35 group-hover:border-black" : "border-black"}`}>
                  <span className={`border-r px-3 py-2 transition-colors duration-300 ${experiment.surface === "dark" ? "border-white/35 group-hover:border-black" : "border-black"}`}>{experiment.number}</span>
                  <span className="px-3 py-2">{experiment.type}</span>
                  <span className={`ml-auto border-l px-3 py-2 transition-colors duration-300 ${experiment.surface === "dark" ? "border-white/35 group-hover:border-black" : "border-black"}`}>{experiment.status}</span>
                </div>

                <div className={`relative h-60 overflow-hidden border-b border-black ${experiment.tone} ${index === 0 ? "md:h-72" : ""}`}>
                  <div className="h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035]">
                    <ExperimentVisual slug={experiment.slug} />
                  </div>
                  <span className="absolute bottom-2 left-2 font-mono text-[8px] uppercase opacity-60">jev://experiment/{experiment.slug}</span>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-7">
                  <h2 className="max-w-3xl text-4xl font-medium leading-[0.94] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                    {experiment.title}
                  </h2>
                  <div className="mt-auto flex items-end justify-between gap-6 pt-10">
                    <p className="max-w-md text-sm leading-relaxed sm:text-base">{experiment.description}</p>
                    <span
                      className={`flex shrink-0 items-center gap-4 border px-3 py-2 font-mono text-[10px] uppercase transition-colors duration-300 ${
                        experiment.surface === "dark"
                          ? "border-white bg-[#f7f7f2] text-[#1e1e1e] group-hover:bg-[#1e1e1e] group-hover:text-[#f7f7f2]"
                          : "border-black bg-[#1e1e1e] text-[#f7f7f2] group-hover:bg-[#f7f7f2] group-hover:text-[#1e1e1e]"
                      }`}
                    >
                      {experiment.action} <Arrow />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="border-y border-black bg-[#ed7d9b] px-4 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1500px] gap-12 md:grid-cols-2">
          <p className="font-mono text-[10px] uppercase">[ Why this exists ]</p>
          <div>
            <p className="text-4xl font-medium leading-[0.98] tracking-[-0.05em] sm:text-6xl">
              Jev doesn&apos;t write. It decides.
            </p>
            <p className="mt-8 max-w-xl text-base leading-relaxed sm:text-lg">
              These experiments test where structured judgments are useful, weird, fast, wrong, or unexpectedly fun. Probabilities included. Certainty not guaranteed.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-[#1e1e1e] px-4 py-8 text-[#f7f7f2] sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-8 font-mono text-[10px] uppercase sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xl font-sans normal-case">Jev Experiments</p>
            <p>An independent project built with TypeSafe&apos;s Jev.</p>
          </div>
          <div className="flex gap-6">
            <a href="#top" className="hover:text-[#ed7d9b]">Back to top ↑</a>
            <span>Source soon</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
