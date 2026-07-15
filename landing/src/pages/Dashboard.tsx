import { useState, useEffect, useCallback } from "react";
import { createDrop, getDrop } from "../api";
import type { Drop } from "../api";

const STORAGE_KEY = "dropn_drops";

function loadStoredDrops(): Drop[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredDrops(drops: Drop[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drops));
}

export default function Dashboard() {
  const [drops, setDrops] = useState<Drop[]>(loadStoredDrops);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("5");
  const [wallet, setWallet] = useState(() => localStorage.getItem("dropn_wallet") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState("");

  const refreshDrops = useCallback(async () => {
    const stored = loadStoredDrops();
    const updated: Drop[] = [];
    for (const d of stored) {
      try {
        const fresh = await getDrop(d.id);
        updated.push(fresh);
      } catch {
        updated.push(d);
      }
    }
    updated.sort((a, b) => b.created_at.localeCompare(a.created_at));
    setDrops(updated);
    saveStoredDrops(updated);
  }, []);

  useEffect(() => { refreshDrops(); }, [refreshDrops]);
  useEffect(() => { if (wallet) localStorage.setItem("dropn_wallet", wallet); }, [wallet]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!wallet.trim()) return setError("Enter your Nimiq wallet address");
    setLoading(true);
    try {
      const result = await createDrop(
        parseFloat(amount) || 0,
        message || "A gift for you! 🎉",
        parseInt(recipients) || 5,
        wallet.trim()
      );
      const fullDrop = await getDrop(result.id);
      const newDrops = [fullDrop, ...drops];
      setDrops(newDrops);
      saveStoredDrops(newDrops);
      setSuccess(`Drop created! Link: ${window.location.origin}/claim/${result.id}`);
      setAmount("");
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Failed to create drop. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/claim/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-12">
          <h1 className="font-['Archivo_Black'] uppercase tracking-[-0.04em] leading-[0.9] text-[8vw] md:text-[5vw] mb-4">DASHBOARD</h1>
          <p className="text-white/50 text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>Create NIM drops and track them in real-time.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="font-['Space_Mono'] text-xs text-[#FF4D00] uppercase tracking-[0.1em] mb-6">New Drop</h2>
              <div className="mb-5">
                <label className="block font-['Space_Mono'] text-[11px] text-white/50 uppercase tracking-[0.1em] mb-2">Your Wallet</label>
                <input type="text" value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="NQ12..." className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-['Space_Mono'] placeholder:text-white/20 focus:outline-none focus:border-[#FF4D00] transition-colors" />
              </div>
              <div className="mb-5">
                <label className="block font-['Space_Mono'] text-[11px] text-white/50 uppercase tracking-[0.1em] mb-2">Amount (NIM)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" min="1" step="0.01" className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-['Space_Mono'] placeholder:text-white/20 focus:outline-none focus:border-[#FF4D00] transition-colors" />
              </div>
              <div className="mb-5">
                <label className="block font-['Space_Mono'] text-[11px] text-white/50 uppercase tracking-[0.1em] mb-2">Message</label>
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Thanks for the great work! 🎉" maxLength={200} className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#FF4D00] transition-colors" />
              </div>
              <div className="mb-6">
                <label className="block font-['Space_Mono'] text-[11px] text-white/50 uppercase tracking-[0.1em] mb-2">Recipients</label>
                <div className="flex gap-2">
                  {[3, 5, 10, 25].map((n) => (
                    <button key={n} type="button" onClick={() => setRecipients(String(n))} className={`px-4 py-2 rounded-xl text-sm font-['Space_Mono'] border transition-all ${recipients === String(n) ? "border-[#FF4D00] text-[#FF4D00] bg-[#FF4D00]/10" : "border-white/10 text-white/50 hover:border-white/30"}`}>{n}</button>
                  ))}
                </div>
              </div>
              {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-['Space_Mono']">{error}</div>}
              {success && <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-['Space_Mono'] break-all">{success}</div>}
              <button type="submit" disabled={loading} className="w-full bg-[#FF4D00] text-black font-['Space_Mono'] text-sm uppercase tracking-[0.1em] rounded-xl py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50 font-bold">{loading ? "Creating..." : "Create Drop"}</button>
            </form>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-['Space_Mono'] text-xs text-[#FF4D00] uppercase tracking-[0.1em] mb-4">Recent Drops</h2>
            {drops.length === 0 && <div className="text-white/30 text-sm py-12 text-center border border-white/10 rounded-2xl" style={{ fontFamily: "'Space Mono', monospace" }}>No drops yet.<br />Create your first one.</div>}
            <div className="space-y-3">
              {drops.map((drop) => (
                <div key={drop.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white text-sm font-semibold mb-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{drop.message}</p>
                      <p className="font-['Space_Mono'] text-[11px] text-white/40">{drop.total_amount} NIM • {drop.total_recipients} recipients</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-['Space_Mono'] uppercase ${drop.status === "active" ? "bg-[#FF4D00]/20 text-[#FF4D00]" : "bg-white/10 text-white/40"}`}>{drop.status}</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-[#FF4D00] rounded-full transition-all" style={{ width: `${(drop.claimed_count / drop.total_recipients) * 100}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-['Space_Mono'] text-[10px] text-white/30">{drop.claimed_count}/{drop.total_recipients} claimed</span>
                    <button onClick={() => copyLink(drop.id)} className="font-['Space_Mono'] text-[10px] text-white/50 hover:text-[#FF4D00] transition-colors uppercase">{copied === drop.id ? "Copied!" : "Copy Link"}</button>
                  </div>
                </div>
              ))}
            </div>
            {drops.length > 0 && <button onClick={refreshDrops} className="w-full mt-3 py-2 text-center font-['Space_Mono'] text-[11px] text-white/30 hover:text-white/60 transition-colors uppercase">Refresh</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
