import { useState, useEffect } from "react";
import "./index.css";

/* ─── Floating Navigation ─────────────────────────────── */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-colors ${
        scrolled ? "bg-black/95" : "bg-transparent"
      }`}
    >
      <span className="font-display text-orange text-lg tracking-tight">DROPN</span>

      <div className="hidden md:flex items-center gap-1 bg-black border-2 border-white rounded-full px-6 py-2">
        {["How", "Drops", "API", "GitHub"].map((l) => (
          <a
            key={l}
            href={l === "GitHub" ? "https://github.com/subheeksh5599/dropn" : `#${l.toLowerCase()}`}
            className="font-mono text-[12px] tracking-[-0.02em] text-white px-3 py-1 rounded-full transition-all hover:bg-white hover:text-black"
          >
            {l}
          </a>
        ))}
      </div>

      <a
        href="https://github.com/subheeksh5599/dropn"
        target="_blank"
        className="font-mono text-[12px] text-white/60 hover:text-orange transition-colors"
      >
        GH
      </a>
    </nav>
  );
}

/* ─── Rotating Scroll Indicator ──────────────────────── */

function ScrollIndicator() {
  return (
    <div className="relative w-[144px] h-[144px] flex items-center justify-center">
      <svg viewBox="0 0 144 144" className="w-full h-full animate-spin-slow">
        <defs>
          <path
            id="scroll-circle"
            d="M72,20 A52,52 0 1,1 71.9,20"
            fill="none"
          />
        </defs>
        <text fontSize="9" fontWeight="bold" fill="#FF4D00" fontFamily="'Space Mono', monospace" letterSpacing="0">
          <textPath href="#scroll-circle" startOffset="0%">
            SCROLL DOWN • SCROLL DOWN • SCROLL DOWN • SCROLL DOWN •
          </textPath>
        </text>
      </svg>
      <span className="absolute text-orange text-2xl">↓</span>
    </div>
  );
}

/* ─── Hero Section ───────────────────────────────────── */

function Hero() {
  return (
    <section className="relative bg-orange min-h-screen flex flex-col justify-between pt-32 pb-8 px-6">
      {/* Main headline */}
      <div className="flex-1 flex items-center justify-center">
        <h1
          className="font-display text-black text-[14vw] md:text-[16vw] uppercase tracking-[-0.04em] leading-[0.85] text-center"
        >
          SEND NIM<br />LIKE A GIFT
        </h1>
      </div>

      {/* 2px divider */}
      <div className="section-divider mb-4" />

      {/* Metadata row */}
      <div className="grid grid-cols-3 items-end gap-4">
        {/* Left: Based in */}
        <div>
          <p className="font-mono text-[10px] md:text-xs text-black/60 uppercase tracking-[-0.02em]">
            Based in
          </p>
          <p className="font-mono text-xs md:text-sm text-black font-bold uppercase tracking-[-0.02em]">
            Nimiq Pay
          </p>
        </div>

        {/* Center: Scroll indicator */}
        <div className="flex justify-center">
          <ScrollIndicator />
        </div>

        {/* Right: title */}
        <div className="text-right">
          <p className="font-mono text-[10px] md:text-xs text-black/60 uppercase tracking-[-0.02em]">
            Mini App • 2026
          </p>
          <p className="font-mono text-xs md:text-sm text-black font-bold uppercase tracking-[-0.02em]">
            Random<br />Payments
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Skewed Transition ──────────────────────────────── */

function SkewTransition({ from, to }: { from: "orange" | "black"; to: "orange" | "black" }) {
  return (
    <div className={`relative h-20 -mt-10 z-10 ${from === "orange" ? "bg-orange" : "bg-black"}`}>
      <div
        className={`absolute inset-0 ${to === "orange" ? "bg-orange" : "bg-black"}`}
        style={{ transform: "skewY(-2deg)", transformOrigin: "top left" }}
      />
    </div>
  );
}

/* ─── Marquee Section ────────────────────────────────── */

function Marquee() {
  const words1 = "CREATE DROP • SHARE LINK • RANDOM SPLITS • SURPRISE WINS • VIRAL BY DESIGN •";
  const words2 = "SEND NIM • CLAIM INSTANTLY • NO SIGNUP • NO APP • JUST A LINK •";

  return (
    <section className="bg-black py-16 -skew-y-[2deg] -mt-10 relative z-20">
      <div className="skew-y-[2deg]">
        {/* Row 1: Orange text, scroll left */}
        <div className="overflow-hidden py-4 border-y-2 border-orange">
          <div className="animate-marquee-left flex gap-0 whitespace-nowrap">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className="font-display text-orange text-[8vw] md:text-[10vw] uppercase tracking-[-0.04em] leading-[0.9]"
              >
                {words1}&nbsp;
              </span>
            ))}
          </div>
        </div>

        {/* Row 2: White text, scroll right */}
        <div className="overflow-hidden py-4">
          <div className="animate-marquee-right flex gap-0 whitespace-nowrap">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className="font-display text-white/80 text-[8vw] md:text-[10vw] uppercase tracking-[-0.04em] leading-[0.9]"
              >
                {words2}&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works (Brutalist Service List) ──────────── */

const steps = [
  {
    num: "01",
    title: "Create a Drop",
    desc: "Pick an amount, write a message, choose how many people. One click. Done.",
    tags: ["NIM", "MESSAGE", "RECIPIENTS"],
  },
  {
    num: "02",
    title: "Generate Random Splits",
    desc: "We split your NIM into random, uneven shares using stick-breaking. Some get more, some less — that's the fun.",
    tags: ["RANDOM", "STICK-BREAKING", "UNEVEN"],
  },
  {
    num: "03",
    title: "Share the Link",
    desc: "Copy one link. Drop it in any chat, tweet, or DM. No app download needed.",
    tags: ["LINK", "SHARE", "VIRAL"],
  },
  {
    num: "04",
    title: "Friends Claim Instantly",
    desc: "Anyone opens the link, connects their Nimiq wallet, and claims their random share. Surprise every time.",
    tags: ["INSTANT", "WALLET", "SURPRISE"],
  },
  {
    num: "05",
    title: "Watch It Go Viral",
    desc: "People share their wins. 'I just got 37 NIM from a DropN!' — every claim is free marketing.",
    tags: ["SOCIAL", "VIRAL", "REPEAT"],
  },
];

function HowItWorks() {
  return (
    <section id="how" className="bg-black text-white py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-16">
          <span className="font-mono text-orange text-sm tracking-[-0.02em]">[ 05 ]</span>
          <h2 className="font-display text-[6vw] md:text-[7vw] uppercase tracking-[-0.04em] leading-[0.9]">
            HOW IT<br />WORKS
          </h2>
        </div>

        {/* Step cards */}
        {steps.map((step, i) => (
          <div
            key={i}
            className="group flex items-start gap-4 md:gap-8 py-8 border-t border-white/20 cursor-pointer transition-all hover:bg-white/5 px-2 -mx-2"
          >
            {/* Number */}
            <span className="font-mono text-orange text-xl md:text-2xl font-bold tracking-[-0.02em] min-w-[40px]">
              {step.num}
            </span>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-display text-[6vw] md:text-[5vw] uppercase tracking-[-0.04em] leading-[0.9] transition-transform group-hover:translate-x-4">
                {step.title}
              </h3>
              <p className="font-body text-white/60 text-sm md:text-base mt-2 mb-3 max-w-lg">
                {step.desc}
              </p>
              <div className="flex gap-2 flex-wrap">
                {step.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[10px] md:text-xs tracking-[-0.02em] px-3 py-1 rounded-full border border-white/30 text-white/70"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <span className="hidden md:block font-display text-orange text-4xl opacity-0 group-hover:opacity-100 rotate-45 transition-all mt-2">
              ↗
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Features Grid ──────────────────────────────────── */

const features = [
  { title: "RANDOM PAYOUTS", desc: "Stick-breaking algorithm generates truly random, uneven splits. Every claim is a surprise." },
  { title: "ONE LINK", desc: "No signup. No app store. No download. Just a link. Share it anywhere." },
  { title: "ZERO FEES", desc: "DropN takes nothing. 100% of your NIM goes to the people you send it to." },
  { title: "MOBILE FIRST", desc: "Built for phones. Claim a drop in under 10 seconds from any device." },
  { title: "VIRAL BY DESIGN", desc: "Every drop shared = free Nimiq promotion. Every claim = social proof." },
  { title: "OPEN SOURCE", desc: "MIT licensed. Full REST API. Build your own frontend on top of it." },
];

function Features() {
  return (
    <section id="drops" className="bg-orange py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-16">
          <span className="font-mono text-black/60 text-sm tracking-[-0.02em]">[ FEATURES ]</span>
          <h2 className="font-display text-black text-[6vw] md:text-[7vw] uppercase tracking-[-0.04em] leading-[0.9]">
            WHY<br />DROPS WIN
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-0">
          {features.map((f, i) => (
            <div
              key={i}
              className={`p-6 md:p-8 border-black ${
                i % 2 === 0 ? "border-r-2" : ""
              } ${i < features.length - 2 ? "border-b-2" : ""} hover:bg-black/10 transition-colors`}
            >
              <h3 className="font-display text-black text-xl md:text-2xl uppercase tracking-[-0.04em] leading-[0.9] mb-2">
                {f.title}
              </h3>
              <p className="font-body text-black/70 text-sm md:text-base">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Giant CTA ──────────────────────────────────────── */

function CTA() {
  return (
    <section id="api" className="bg-black py-32 px-6 text-center">
      <h2
        className="font-display text-white text-[12vw] md:text-[14vw] uppercase tracking-[-0.04em] leading-[0.85] mb-8"
      >
        START<br />DROPPING
      </h2>

      <p className="font-mono text-white/60 text-sm md:text-base mb-12 max-w-md mx-auto">
        Create your first DropN in under 60 seconds. No signup. No setup. Just NIM.
      </p>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        <a
          href="https://github.com/subheeksh5599/dropn"
          target="_blank"
          className="font-mono text-sm tracking-[-0.02em] bg-white text-black rounded-full px-10 py-4 border-2 border-white hover:scale-110 transition-transform inline-block"
        >
          VIEW ON GITHUB
        </a>
        <a
          href="#how"
          className="font-mono text-sm tracking-[-0.02em] text-white border-2 border-white/30 rounded-full px-10 py-4 hover:border-orange hover:text-orange transition-all inline-block"
        >
          HOW IT WORKS
        </a>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-black border-t-2 border-white/20 px-6 py-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-6">
          <span className="font-display text-orange text-lg">DROPN</span>
          <span className="font-mono text-[10px] md:text-xs text-white/40">
            © 2026 • MIT License
          </span>
        </div>
        <div className="flex gap-6">
          {["GITHUB", "NIMIQ", "API", "DOCS"].map((l) => (
            <a
              key={l}
              href={l === "GITHUB" ? "https://github.com/subheeksh5599/dropn" : "#"}
              className="font-mono text-[10px] md:text-xs text-white/40 hover:text-orange transition-colors tracking-[-0.02em] uppercase"
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ─── App ────────────────────────────────────────────── */

export default function App() {
  return (
    <main>
      <Nav />
      <Hero />
      <SkewTransition from="orange" to="black" />
      <Marquee />
      <SkewTransition from="black" to="black" />
      <HowItWorks />
      <SkewTransition from="black" to="orange" />
      <Features />
      <SkewTransition from="orange" to="black" />
      <CTA />
      <Footer />
    </main>
  );
}
