import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getDrop, claimDrop } from "../api";
import { connectWallet } from "../wallet";
import type { Drop, ClaimResult } from "../api";

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  const [drop, setDrop] = useState<Drop | null>(null);
  const [claim, setClaim] = useState<ClaimResult | null>(null);
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDrop(id)
      .then((d) => {
        setDrop(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Drop not found or link is invalid.");
        setLoading(false);
      });
  }, [id]);

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      const addr = await connectWallet();
      setWallet(addr);
    } catch (err: any) {
      if (err.message !== "User closed the Hub") {
        setError(err.message || "Failed to connect wallet");
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleClaim = async () => {
    if (!id || !wallet.trim()) return setError("Connect your Nimiq wallet first");
    setClaiming(true);
    setError("");
    try {
      const result = await claimDrop(id, wallet.trim());
      setClaim(result);
    } catch (err: any) {
      setError(err.message || "Claim failed");
    } finally {
      setClaiming(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center px-4">
        <p className="font-['Space_Mono'] text-white/40 text-[13px] animate-pulse">Loading drop...</p>
      </div>
    );
  }

  // Error / not found
  if (error && !drop) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center px-4">
        <div className="text-center w-full max-w-xs">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="font-['Archivo_Black'] text-white text-[10vw] uppercase tracking-[-0.04em] leading-[0.9] mb-4">
            Link<br />Expired
          </h1>
          <p className="text-white/50 text-[13px] mb-8" style={{ fontFamily: "'Space Mono', monospace" }}>
            {error}
          </p>
          <a href="/" className="font-['Space_Mono'] text-[13px] text-[#FF4D00] active:underline uppercase tracking-[0.1em]">
            ← Back to DropN
          </a>
        </div>
      </div>
    );
  }

  // Already claimed
  if (claim) {
    return (
      <div className="min-h-dvh bg-[#FF4D00] flex items-center justify-center px-4">
        <div className="text-center w-full max-w-xs">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="font-['Archivo_Black'] text-black uppercase tracking-[-0.04em] leading-[0.9] text-[12vw] mb-2">
            You got<br />{claim.amount.toFixed(4)} NIM!
          </h1>
          <p className="text-black/70 text-[15px] mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            {claim.message}
          </p>
          <p className="text-black/50 text-[11px] mb-8" style={{ fontFamily: "'Space Mono', monospace" }}>
            From: {claim.sender_wallet.slice(0, 14)}... • {claim.position} of {claim.total_recipients} claimed
          </p>
          <a href="/" className="font-['Space_Mono'] text-[13px] text-black border-2 border-black rounded-full px-8 py-3.5 active:bg-black active:text-[#FF4D00] transition-all inline-block uppercase tracking-[0.1em] font-bold">
            Create Your Own Drop
          </a>
        </div>
      </div>
    );
  }

  // Exhausted
  if (drop?.status === "exhausted") {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center px-4">
        <div className="text-center w-full max-w-xs">
          <div className="text-6xl mb-6">⏰</div>
          <h1 className="font-['Archivo_Black'] text-white/30 uppercase tracking-[-0.04em] leading-[0.9] text-[10vw] mb-4">
            Too<br />Late!
          </h1>
          <p className="text-white/50 text-[13px] mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
            This drop has been fully claimed.
          </p>
          <p className="text-white/30 text-[11px] mb-8" style={{ fontFamily: "'Space Mono', monospace" }}>
            "{drop.message}"
          </p>
          <a href="/" className="font-['Space_Mono'] text-[13px] text-[#FF4D00] active:underline uppercase tracking-[0.1em]">
            ← Back to DropN
          </a>
        </div>
      </div>
    );
  }

  // Active — claim form
  return (
    <div className="min-h-dvh bg-black flex items-center justify-center px-4">
      <div className="text-center w-full max-w-xs">
        <div className="text-6xl mb-5">🧧</div>

        <h1 className="font-['Archivo_Black'] text-white uppercase tracking-[-0.04em] leading-[0.9] text-[10vw] mb-2">
          You've Been<br />Sent NIM!
        </h1>
        <p className="text-white/60 text-[15px] mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
          "{drop?.message}"
        </p>
        <p className="text-white/30 text-[11px] mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
          {drop?.remaining} of {drop?.total_recipients} remaining • Random payout
        </p>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/10 rounded-full mb-2 overflow-hidden">
          <div className="h-full bg-[#FF4D00] rounded-full transition-all"
            style={{ width: `${((drop?.claimed_count ?? 0) / (drop?.total_recipients ?? 1)) * 100}%` }} />
        </div>
        <p className="font-['Space_Mono'] text-[10px] text-white/30 mb-6">
          {drop?.claimed_count}/{drop?.total_recipients} claimed
        </p>

        {/* Wallet */}
        <div className="mb-3">
          {wallet ? (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-white/5 border border-[#FF4D00]/30 rounded-xl px-4 py-3.5 text-[#FF4D00] text-[12px] font-['Space_Mono'] text-center truncate">
                {wallet.slice(0, 14)}...{wallet.slice(-6)}
              </div>
              <button onClick={() => setWallet("")} className="px-3 py-3 rounded-xl text-white/40 active:text-white/70 text-xs font-['Space_Mono'] transition-colors">
                ✕
              </button>
            </div>
          ) : (
            <button onClick={handleConnect} disabled={connecting}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3.5 text-white text-[13px] font-['Space_Mono'] active:border-[#FF4D00] transition-colors disabled:opacity-50">
              {connecting ? "Connecting..." : "Connect Nimiq Wallet"}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-['Space_Mono']">
            {error}
          </div>
        )}

        <button onClick={handleClaim} disabled={claiming || !wallet.trim()}
          className="w-full bg-[#FF4D00] text-black font-['Space_Mono'] text-[13px] uppercase tracking-[0.1em] font-bold rounded-xl py-3.5 active:opacity-80 transition-opacity disabled:opacity-50 mb-3">
          {claiming ? "Claiming..." : "Claim Your NIM"}
        </button>

        <p className="font-['Space_Mono'] text-[10px] text-white/20">
          Powered by DropN on Nimiq
        </p>
      </div>
    </div>
  );
}
