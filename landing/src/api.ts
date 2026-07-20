// In dev mode, Vite proxies /api to localhost:8000
// In production, frontend and backend are served from the same Render origin
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "");

export interface Drop {
  id: string;
  message: string;
  total_amount: number;
  total_recipients: number;
  claimed_count: number;
  remaining: number;
  status: string;
  created_at: string;
  claim_link: string;
  sender_wallet: string;
}

export interface ClaimResult {
  drop_id: string;
  amount: number;
  message: string;
  position: number;
  total_claimed: number;
  total_recipients: number;
  sender_wallet: string;
  claimer_wallet: string;
}

export async function createDrop(amount: number, message: string, recipients: number, wallet: string) {
  const res = await fetch(`${API_BASE}/drops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, message, recipients, sender_wallet: wallet }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Failed to create drop");
  return res.json();
}

export async function getDrop(id: string): Promise<Drop> {
  const res = await fetch(`${API_BASE}/drops/${id}`);
  if (!res.ok) throw new Error("Drop not found");
  return res.json();
}

export async function claimDrop(id: string, wallet: string): Promise<ClaimResult> {
  const res = await fetch(`${API_BASE}/drops/${id}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Claim failed");
  return res.json();
}
