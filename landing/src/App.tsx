import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ClaimPage from "./pages/Claim";
import "./index.css";

/* ─── Floating Pill Navigation ────────────────────────── */

function Nav() {
  const [scrolled] = useState(false);
  // We always show nav on mobile, pill on desktop
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-colors ${scrolled ? "bg-black/95" : ""}`}>
      {/* Logo left */}
      <Link to="/" className="font-['Archivo_Black'] text-black text-lg tracking-tight">DROPN</Link>

      {/* Floating black pill center (hidden on mobile) */}
      <div className="hidden md:flex items-center gap-0 bg-black border-2 border-white rounded-full px-6 py-2.5">
        {[
          ["How", "#how"],
          ["Drops", "#drops"],
          ["Dashboard", "/dashboard"],
          ["API", "#api"],
        ].map(([label, href]) => (
          <Link
            key={label}
            to={href}
            className="font-['Space_Mono'] text-[12px] tracking-[-0.02em] text-white px-3 py-1 rounded-full transition-all duration-200 hover:bg-white hover:text-black"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Social right */}
      <Link to="/dashboard" className="font-['Space_Mono'] text-[12px] text-white/60 hover:text-[#FF4D00] transition-colors">
        APP
      </Link>
    </nav>
  );
}

/* ─── Rotating Scroll Indicator ──────────────────────── */

function ScrollIndicator() {
  return (
    <div className="relative w-[144px] h-[144px] flex items-center justify-center">
      <svg viewBox="0 0 144 144" className="w-full h-full spin-slow">
        <defs>
          <path id="ring" d="M72,20 A52,52 0 1,1 71.9,20" fill="none" />
        </defs>
        <text fontSize="9" fontWeight="bold" fill="#FF4D00" fontFamily="'Space Mono', monospace">
          <textPath href="#ring" startOffset="0%">
            SCROLL DOWN • SCROLL DOWN • SCROLL DOWN • SCROLL DOWN •
          </textPath>
        </text>
      </svg>
      <span className="absolute text-[#FF4D00] text-2xl">↓</span>
    </div>
  );
}

/* ─── Hero Section ───────────────────────────────────── */

function Hero() {
  return (
    <section className="bg-[#FF4D00] min-h-screen flex flex-col justify-between pt-32 pb-8 px-6">
      {/* Main headline centered */}
      <div className="flex-1 flex items-center justify-center">
        <h1 className="font-['Archivo_Black'] text-black uppercase tracking-[-0.04em] leading-[0.85] text-center text-[14vw]">
          SEND NIM<br />LIKE A GIFT
        </h1>
      </div>

      {/* 2px black divider */}
      <div className="h-[2px] bg-black w-full mb-4" />

      {/* Metadata row: 3 columns */}
      <div className="grid grid-cols-3 items-end gap-4">
        {/* Left: Based in */}
        <div>
          <p className="font-['Space_Mono'] text-[10px] md:text-xs text-black/60 uppercase tracking-[-0.02em]">Based in</p>
          <p className="font-['Space_Mono'] text-xs md:text-sm text-black font-bold uppercase tracking-[-0.02em]">Nimiq Pay</p>
        </div>
        {/* Center: scroll indicator */}
        <div className="flex justify-center">
          <ScrollIndicator />
        </div>
        {/* Right: title/role */}
        <div className="text-right">
          <p className="font-['Space_Mono'] text-[10px] md:text-xs text-black/60 uppercase tracking-[-0.02em]">Mini App • 2026</p>
          <p className="font-['Space_Mono'] text-xs md:text-sm text-black font-bold uppercase tracking-[-0.02em]">Random<br />Payments</p>
        </div>
      </div>
    </section>
  );
}

/* ─── Skewed Transition ──────────────────────────────── */

function SkewTransition({ color }: { color: "black" | "orange" }) {
  return (
    <div className="relative h-20 -mt-10 z-10">
      <div
        className="absolute inset-0"
        style={{
          background: color === "black" ? "#000" : "#FF4D00",
          transform: "skewY(-2deg)",
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

/* ─── Marquee Section ────────────────────────────────── */

function Marquee() {
  const row1 = "CREATE DROP • SHARE LINK • RANDOM PAYOUTS • SURPRISE WINS • VIRAL BY DESIGN • ";
  const row2 = "SEND NIM • CLAIM INSTANTLY • NO SIGNUP • NO APP • JUST A LINK • ";

  return (
    <section className="bg-black py-16 relative z-20" style={{ transform: "skewY(-2deg)", marginTop: "-2.5rem" }}>
      <div style={{ transform: "skewY(2deg)" }}>
        {/* Row 1: Orange text, scroll left */}
        <div className="overflow-hidden py-4 border-y-2 border-[#FF4D00]">
          <div className="marquee-l flex whitespace-nowrap">
            {[0, 1, 2].map((i) => (
              <span key={i} className="font-['Archivo_Black'] text-[#FF4D00] uppercase tracking-[-0.04em] leading-[0.9] text-[8vw]">
                {row1}&nbsp;
              </span>
            ))}
          </div>
        </div>
        {/* Row 2: White 80% opacity, scroll right */}
        <div className="overflow-hidden py-4">
          <div className="marquee-r flex whitespace-nowrap">
            {[0, 1, 2].map((i) => (
              <span key={i} className="font-['Archivo_Black'] text-white/80 uppercase tracking-[-0.04em] leading-[0.9] text-[8vw]">
                {row2}&nbsp;
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
  { num: "01", title: "Create a Drop", desc: "Pick an amount, add a message, choose how many people get to claim. One click.", tags: ["NIM", "MESSAGE", "RECIPIENTS"] },
  { num: "02", title: "Random Splits", desc: "Stick-breaking algorithm splits your NIM into random, uneven shares. Some get more, some less — the surprise is the hook.", tags: ["RANDOM", "STICK‑BREAKING", "UNEVEN"] },
  { num: "03", title: "Share the Link", desc: "Copy one link. Drop it in a chat, tweet, or DM. No app store. No download.", tags: ["LINK", "SHARE", "ZERO FRICTION"] },
  { num: "04", title: "Friends Claim", desc: "Anyone opens the link, connects their Nimiq wallet, and claims a random amount. Instant. Surprising.", tags: ["INSTANT", "WALLET", "SURPRISE"] },
  { num: "05", title: "Goes Viral", desc: "Receivers share their wins. 'I just got 37 NIM!' — every claim is free promotion for Nimiq.", tags: ["SOCIAL", "VIRAL", "REPEAT"] },
];

function HowItWorks() {
  return (
    <section id="how" className="bg-black text-white py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-16">
          <span className="font-['Space_Mono'] text-[#FF4D00] text-sm tracking-[-0.02em]">[ 05 ]</span>
          <h2 className="font-['Archivo_Black'] uppercase tracking-[-0.04em] leading-[0.9] text-[6vw]">
            HOW IT<br />WORKS
          </h2>
        </div>

        {/* Cards */}
        {steps.map((step, i) => (
          <div key={i} className="group flex items-start gap-4 md:gap-6 py-8 border-t border-white/20 transition-all hover:bg-white/5 px-2 -mx-2">
            {/* Number */}
            <span className="font-['Space_Mono'] text-[#FF4D00] text-xl md:text-2xl font-bold tracking-[-0.02em] min-w-[36px]">
              {step.num}
            </span>
            {/* Content */}
            <div className="flex-1">
              <h3 className="font-['Archivo_Black'] uppercase tracking-[-0.04em] leading-[0.9] text-[5vw] md:text-[4vw] hover-slide">
                {step.title}
              </h3>
              <p className="text-white/60 text-sm md:text-base mt-2 mb-3 max-w-lg" style={{ fontFamily: "'Inter', sans-serif" }}>
                {step.desc}
              </p>
              <div className="flex gap-2 flex-wrap">
                {step.tags.map((t) => (
                  <span key={t} className="font-['Space_Mono'] text-[10px] md:text-xs tracking-[-0.02em] px-3 py-1 rounded-full border border-white/30 text-white/70">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {/* Arrow: hidden, reveals on hover */}
            <span className="hidden md:block font-['Archivo_Black'] text-[#FF4D00] text-4xl opacity-0 group-hover:opacity-100 transition-all mt-2" style={{ transform: "rotate(45deg)" }}>
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
  ["RANDOM PAYOUTS", "Stick‑breaking algorithm produces truly random, uneven splits. Every claim is different."],
  ["ONE LINK", "No signup. No app store. No download. Just a link you share anywhere."],
  ["ZERO FEES", "DropN takes nothing. 100% of your NIM reaches the people you send it to."],
  ["MOBILE FIRST", "Built for phones. Claim a drop in under 10 seconds from any device."],
  ["VIRAL BY DESIGN", "Every shared drop is free Nimiq promotion. Every claim is social proof."],
  ["OPEN SOURCE", "MIT licensed. Full REST API. Build your own frontend."],
];

function Features() {
  return (
    <section id="drops" className="bg-[#FF4D00] py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-16">
          <span className="font-['Space_Mono'] text-black/60 text-sm tracking-[-0.02em]">[ FEATURES ]</span>
          <h2 className="font-['Archivo_Black'] text-black uppercase tracking-[-0.04em] leading-[0.9] text-[6vw]">
            WHY DROPS<br />WIN
          </h2>
        </div>

        <div className="grid md:grid-cols-2">
          {features.map(([title, desc], i) => (
            <div
              key={i}
              className="p-6 md:p-8 hover:bg-black/10 transition-colors"
              style={{
                borderRight: i % 2 === 0 ? "2px solid #000" : "none",
                borderBottom: i < features.length - 2 ? "2px solid #000" : "none",
              }}
            >
              <h3 className="font-['Archivo_Black'] text-black uppercase tracking-[-0.04em] leading-[0.9] text-xl md:text-2xl mb-2">
                {title}
              </h3>
              <p className="text-black/70 text-sm md:text-base" style={{ fontFamily: "'Inter', sans-serif" }}>
                {desc}
              </p>
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
      <h2 className="font-['Archivo_Black'] text-white uppercase tracking-[-0.04em] leading-[0.85] text-[12vw] mb-8">
        START<br />DROPPING
      </h2>

      <p className="text-white/60 text-sm md:text-base mb-12 max-w-md mx-auto" style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "-0.02em" }}>
        Create your first DropN in under 60 seconds. No signup. No setup. Just NIM.
      </p>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        <Link
          to="/dashboard"
          className="font-['Space_Mono'] text-sm tracking-[-0.02em] bg-white text-black rounded-full px-10 py-4 border-2 border-white hover-pop inline-block"
        >
          OPEN DASHBOARD
        </Link>
        <a href="#how"
          className="font-['Space_Mono'] text-sm tracking-[-0.02em] text-white border-2 border-white/30 rounded-full px-10 py-4 hover:border-[#FF4D00] hover:text-[#FF4D00] transition-all inline-block">
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
          <span className="font-['Archivo_Black'] text-[#FF4D00] text-lg">DROPN</span>
          <span className="font-['Space_Mono'] text-[10px] md:text-xs text-white/40">© 2026 • MIT License</span>
        </div>
        <div className="flex gap-6">
          {[
            ["GITHUB", "https://github.com/subheeksh5599/dropn"],
            ["DASHBOARD", "/dashboard"],
            ["API", "#api"],
            ["DOCS", "#"],
          ].map(([label, href]) =>
            href.startsWith("http") ? (
              <a key={label} href={href} target="_blank" className="font-['Space_Mono'] text-[10px] md:text-xs text-white/40 hover:text-[#FF4D00] transition-colors tracking-[-0.02em] uppercase">
                {label}
              </a>
            ) : (
              <Link key={label} to={href} className="font-['Space_Mono'] text-[10px] md:text-xs text-white/40 hover:text-[#FF4D00] transition-colors tracking-[-0.02em] uppercase">
                {label}
              </Link>
            )
          )}
        </div>
      </div>
    </footer>
  );
}

/* ─── App ────────────────────────────────────────────── */

function LandingPage() {
  return (
    <main>
      <Nav />
      <Hero />
      <SkewTransition color="black" />
      <Marquee />
      <SkewTransition color="orange" />
      <HowItWorks />
      <SkewTransition color="black" />
      <Features />
      <SkewTransition color="black" />
      <CTA />
      <Footer />
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/claim/:id" element={<ClaimPage />} />
      </Routes>
    </BrowserRouter>
  );
}
