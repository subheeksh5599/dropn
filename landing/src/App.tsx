import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ClaimPage from "./pages/Claim";
import "./index.css";

/* ─── Mobile Nav ──────────────────────────────────────── */

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between">
      <Link to="/" className="font-['Archivo_Black'] text-black text-lg tracking-tight">DROPN</Link>
      <Link to="/dashboard" className="font-['Space_Mono'] text-[11px] bg-black text-[#FF4D00] px-4 py-2 rounded-full">
        APP
      </Link>
    </nav>
  );
}

/* ─── Hero Section ───────────────────────────────────── */

function Hero() {
  return (
    <section className="bg-[#FF4D00] min-h-screen flex flex-col justify-between pt-20 pb-6 px-4">
      <div className="flex-1 flex items-center justify-center">
        <h1 className="font-['Archivo_Black'] text-black uppercase tracking-[-0.04em] leading-[0.85] text-center text-[16vw]">
          SEND NIM<br />LIKE A GIFT
        </h1>
      </div>

      <div className="h-[2px] bg-black w-full mb-4" />

      <div className="grid grid-cols-3 items-end gap-2">
        <div>
          <p className="font-['Space_Mono'] text-[9px] text-black/60 uppercase tracking-[-0.02em]">Based in</p>
          <p className="font-['Space_Mono'] text-[11px] text-black font-bold uppercase tracking-[-0.02em]">Nimiq Pay</p>
        </div>
        <div className="flex justify-center">
          <svg viewBox="0 0 80 80" className="w-[80px] h-[80px] spin-slow">
            <defs>
              <path id="ring" d="M40,12 A28,28 0 1,1 39.9,12" fill="none" />
            </defs>
            <text fontSize="7" fontWeight="bold" fill="#000" fontFamily="'Space Mono', monospace">
              <textPath href="#ring" startOffset="0%">
                SCROLL DOWN • SCROLL DOWN •
              </textPath>
            </text>
          </svg>
        </div>
        <div className="text-right">
          <p className="font-['Space_Mono'] text-[9px] text-black/60 uppercase tracking-[-0.02em]">Mini App • 2026</p>
          <p className="font-['Space_Mono'] text-[11px] text-black font-bold uppercase tracking-[-0.02em]">Random<br />Payments</p>
        </div>
      </div>
    </section>
  );
}

/* ─── Marquee Section ────────────────────────────────── */

function Marquee() {
  const row1 = "CREATE DROP • SHARE LINK • RANDOM PAYOUTS • SURPRISE WINS • VIRAL BY DESIGN • ";
  const row2 = "SEND NIM • CLAIM INSTANTLY • NO SIGNUP • NO APP • JUST A LINK • ";

  return (
    <section className="bg-black py-12 relative z-20" style={{ transform: "skewY(-2deg)", marginTop: "-2rem" }}>
      <div style={{ transform: "skewY(2deg)" }}>
        <div className="overflow-hidden py-3 border-y-2 border-[#FF4D00]">
          <div className="marquee-l flex whitespace-nowrap">
            {[0, 1, 2].map((i) => (
              <span key={i} className="font-['Archivo_Black'] text-[#FF4D00] uppercase tracking-[-0.04em] leading-[0.9] text-[10vw]">
                {row1}&nbsp;
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-hidden py-3">
          <div className="marquee-r flex whitespace-nowrap">
            {[0, 1, 2].map((i) => (
              <span key={i} className="font-['Archivo_Black'] text-white/80 uppercase tracking-[-0.04em] leading-[0.9] text-[10vw]">
                {row2}&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ───────────────────────────────────── */

const steps = [
  { num: "01", title: "Create a Drop", desc: "Pick an amount, add a message, choose how many people get to claim. One click.", tags: ["NIM", "MESSAGE", "RECIPIENTS"] },
  { num: "02", title: "Random Splits", desc: "Stick-breaking algorithm splits your NIM into random, uneven shares. The surprise is the hook.", tags: ["RANDOM", "STICK‑BREAKING", "UNEVEN"] },
  { num: "03", title: "Share the Link", desc: "Copy one link. Drop it in a chat, tweet, or DM. No app store. No download.", tags: ["LINK", "SHARE", "ZERO FRICTION"] },
  { num: "04", title: "Friends Claim", desc: "Anyone opens the link, connects their Nimiq wallet, and claims a random amount.", tags: ["INSTANT", "WALLET", "SURPRISE"] },
  { num: "05", title: "Goes Viral", desc: "Receivers share their wins. Every claim is free promotion for Nimiq.", tags: ["SOCIAL", "VIRAL", "REPEAT"] },
];

function HowItWorks() {
  return (
    <section id="how" className="bg-black text-white py-16 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <span className="font-['Space_Mono'] text-[#FF4D00] text-xs tracking-[-0.02em]">[ 05 ]</span>
          <h2 className="font-['Archivo_Black'] uppercase tracking-[-0.04em] leading-[0.9] text-[8vw]">
            HOW IT<br />WORKS
          </h2>
        </div>

        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3 py-6 border-t border-white/20">
            <span className="font-['Space_Mono'] text-[#FF4D00] text-lg font-bold tracking-[-0.02em] min-w-[28px]">
              {step.num}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-['Archivo_Black'] uppercase tracking-[-0.04em] leading-[0.9] text-[6vw] mb-1">
                {step.title}
              </h3>
              <p className="text-white/60 text-[13px] leading-relaxed mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                {step.desc}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {step.tags.map((t) => (
                  <span key={t} className="font-['Space_Mono'] text-[9px] tracking-[-0.02em] px-2 py-0.5 rounded-full border border-white/30 text-white/70">
                    {t}
                  </span>
                ))}
              </div>
            </div>
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
    <section id="drops" className="bg-[#FF4D00] py-16 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <span className="font-['Space_Mono'] text-black/60 text-xs tracking-[-0.02em]">[ FEATURES ]</span>
          <h2 className="font-['Archivo_Black'] text-black uppercase tracking-[-0.04em] leading-[0.9] text-[8vw]">
            WHY DROPS<br />WIN
          </h2>
        </div>

        <div className="flex flex-col">
          {features.map(([title, desc], i) => (
            <div
              key={i}
              className="py-5 border-b-2 border-black/20 last:border-b-0"
            >
              <h3 className="font-['Archivo_Black'] text-black uppercase tracking-[-0.04em] leading-[0.9] text-lg mb-1">
                {title}
              </h3>
              <p className="text-black/70 text-[13px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────── */

function CTA() {
  return (
    <section id="api" className="bg-black py-20 px-4 text-center">
      <h2 className="font-['Archivo_Black'] text-white uppercase tracking-[-0.04em] leading-[0.85] text-[14vw] mb-6">
        START<br />DROPPING
      </h2>

      <p className="text-white/50 text-[13px] mb-10 mx-auto max-w-xs" style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "-0.02em" }}>
        Create your first DropN in under 60 seconds. No signup. Just NIM.
      </p>

      <div className="flex flex-col items-center gap-3">
        <Link
          to="/dashboard"
          className="w-full max-w-[280px] font-['Space_Mono'] text-sm tracking-[-0.02em] bg-white text-black rounded-full px-8 py-4 border-2 border-white active:scale-95 transition-transform text-center"
        >
          OPEN DASHBOARD
        </Link>
        <a href="#how"
          className="w-full max-w-[280px] font-['Space_Mono'] text-sm tracking-[-0.02em] text-white border-2 border-white/30 rounded-full px-8 py-4 active:border-[#FF4D00] active:text-[#FF4D00] transition-all text-center">
          HOW IT WORKS
        </a>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-black border-t-2 border-white/20 px-4 py-6">
      <div className="max-w-lg mx-auto flex flex-col items-center gap-3">
        <span className="font-['Archivo_Black'] text-[#FF4D00] text-lg">DROPN</span>
        <div className="flex gap-5">
          {[
            ["GITHUB", "https://github.com/subheeksh5599/dropn"],
            ["DASHBOARD", "/dashboard"],
            ["DOCS", "https://github.com/subheeksh5599/dropn#readme"],
          ].map(([label, href]) =>
            href.startsWith("http") ? (
              <a key={label} href={href} target="_blank" className="font-['Space_Mono'] text-[10px] text-white/40 active:text-[#FF4D00] transition-colors tracking-[-0.02em] uppercase">
                {label}
              </a>
            ) : (
              <Link key={label} to={href} className="font-['Space_Mono'] text-[10px] text-white/40 active:text-[#FF4D00] transition-colors tracking-[-0.02em] uppercase">
                {label}
              </Link>
            )
          )}
        </div>
        <span className="font-['Space_Mono'] text-[9px] text-white/30">© 2026 • MIT License</span>
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
      <Marquee />
      <HowItWorks />
      <Features />
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
