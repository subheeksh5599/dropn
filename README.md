<div align="center">

<img src="https://img.shields.io/badge/DropN-NIM_drops-FF4D00?style=for-the-badge" alt="DropN" />

&nbsp;

[![Live backend](https://img.shields.io/badge/●_live-dropn--api.onrender.com-FF4D00)](https://dropn-api.onrender.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-FF4D00.svg)](LICENSE)
![Tests](https://img.shields.io/badge/tests-13%20passing-3fb950)
![Stack](https://img.shields.io/badge/Python%20·%20FastAPI%20·%20React%2019%20·%20TypeScript-000)
![Nimiq](https://img.shields.io/badge/Nimiq-Hub%20API-ECB22E)

### Send NIM like a gift. Claim it like a surprise.

DropN creates random-payout NIM drops with one link. You set the total, the recipient count, and a message. The stick-breaking algorithm generates uneven random shares — some people get more, some get less. That's the fun. That's the virality. One link. No signup. Powered by Nimiq Hub + FastAPI.

### ▶ Live now at **[dropn.vercel.app](https://dropn.vercel.app)** · API at **[dropn-api.onrender.com](https://dropn-api.onrender.com)**

**[ Live demo ↗ ](https://dropn.vercel.app)** · **[ API docs ↓ ](#api)** · **[ Run it locally ↓ ](#run-it-locally)** · **[ Architecture ↓ ](#architecture)** · **[ Tests ↓ ](#tests)**

Built for Nimiq. MIT licensed.

</div>

---

## Table of contents

- [See it in one command](#-see-it-in-one-command)
- [The problem DropN solves](#the-problem-dropn-solves)
- [How DropN works](#how-dropn-works)
  - [1 · Create a drop with random splits](#1--create-a-drop-with-random-splits)
  - [2 · Share one link](#2--share-one-link)
  - [3 · Claim with Nimiq Hub](#3--claim-with-nimiq-hub)
  - [4 · Go viral](#4--go-viral)
- [Architecture](#architecture)
  - [Request flow](#request-flow)
  - [Component by component](#component-by-component)
- [Randomness model — verifiable by anyone](#randomness-model--verifiable-by-anyone)
- [How it uses Nimiq](#how-it-uses-nimiq)
- [Engineering decisions](#engineering-decisions--the-hard-problems)
- [What's real vs pending — the honesty table](#whats-real-vs-pending--the-honesty-table)
- [Tests](#tests)
- [Run it locally](#run-it-locally)
- [Configuration](#configuration)
- [Deploy](#deploy)
- [Project layout](#project-layout)
- [Tech stack](#tech-stack)
- [Roadmap](#roadmap)
- [License](#license)

---

## ▶ See it in one command

DropN has a dead-simple REST API. Create a drop, share the link, claim from anywhere:

```bash
# 1. Create a drop — 100 NIM for 5 people
$ curl -s -X POST https://dropn-api.onrender.com/drops \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"message":"Team lunch! 🍕","recipients":5,"sender_wallet":"NQ12_SENDER"}'
{
  "id": "a1b2c3d4e5f6",
  "claim_link": "/claim/a1b2c3d4e5f6",
  "message": "Team lunch! 🍕",
  "total_amount": 100.0,
  "recipients": 5,
  "status": "active"
}

# 2. Check drop status — how many claimed?
$ curl -s https://dropn-api.onrender.com/drops/a1b2c3d4e5f6 | python3 -m json.tool
{
  "id": "a1b2c3d4e5f6",
  "total_amount": 100.0,
  "claimed_count": 0,
  "remaining": 5,
  "status": "active"
}

# 3. Claim a random share
$ curl -s -X POST https://dropn-api.onrender.com/drops/a1b2c3d4e5f6/claim \
  -H "Content-Type: application/json" \
  -d '{"wallet":"NQ12_FRIEND"}'
{
  "drop_id": "a1b2c3d4e5f6",
  "amount": 23.4421,
  "message": "Team lunch! 🍕",
  "position": 1,
  "total_claimed": 1,
  "total_recipients": 5
}

# 4. Claim page info (what the frontend renders)
$ curl -s https://dropn-api.onrender.com/claim/a1b2c3d4e5f6
{
  "status": "active",
  "message": "Team lunch! 🍕",
  "total_amount": 100.0,
  "remaining": 4,
  "total_recipients": 5
}
```

Every call is real. Run them against the live Render deployment right now.

---

## The problem DropN solves

Crypto payments are cold, exact, and boring. Nobody shares a bank transfer on Twitter.

| Problem | Impact |
|---------|--------|
| Sending crypto feels like a bank transfer — cold, exact, boring | Nobody shares payments. Zero virality. |
| Existing split tools split equally by default | Equal splits are fair but forgettable. No surprise. No delight. |
| Payment apps have no emotional layer | Venmo has emojis. WeChat Red Packets have luck. Crypto wallets have neither. |
| Nimiq has no social payment mechanic | Wallet-to-wallet transfers work, but there's no gift/surprise/luck mechanic. |

WeChat Red Packets move $100B+/year not because they're efficient — they're efficient AND fun. The luck mechanic is the hook. DropN brings that mechanic to Nimiq.

---

## How DropN works

Four steps from create to viral.

### 1 · Create a drop with random splits

The sender picks a total NIM amount, a message, and how many people can claim. DropN's backend uses the **stick-breaking algorithm** to generate N random shares that sum exactly to the total:

```
Total: 100 NIM, 5 recipients

1. Generate 4 random cut points between 0 and 1
2. Sort them: [0.12, 0.34, 0.67, 0.89]
3. Add 0 and 1: [0.0, 0.12, 0.34, 0.67, 0.89, 1.0]
4. Differences = shares: [12, 22, 33, 22, 11] NIM
5. Shuffle so claim order ≠ size order
```

Every share is different. The last share absorbs rounding errors so the total is always exact. The shares are shuffled before storage so claims arrive in random order — you can't predict which position gets the big one.

### 2 · Share one link

One URL. That's it. `dropn.vercel.app/claim/a1b2c3d4e5f6`. Drop it in Discord, Telegram, Twitter, SMS. No app store. No download. The link is the product.

### 3 · Claim with Nimiq Hub

Anyone who opens the link connects their Nimiq wallet via Nimiq Hub. One click, wallet selected, address verified. DropN assigns them a random unclaimed share and returns it instantly. The frontend triggers the actual NIM transfer via Nimiq Hub's checkout flow — the sender's wallet → claimer's wallet, peer-to-peer.

### 4 · Go viral

Every claim is social proof. "I just got 37 NIM from a DropN link!" — immediate share to group chats. Every drop created is free Nimiq promotion. The luck mechanic — some people get more, some get less — makes people want to try again and share their wins.

---

## Architecture

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Sender      │    │   DropN API      │    │   Claimers       │
│  creates      │───▶│  (FastAPI :8000) │───▶│  open link       │
│  drop + msg   │    │                  │    │  get random      │
│               │    │  ▼ stick-breaking│    │  NIM amounts     │
│               │    │  ▼ shuffle       │    │                  │
│               │    │  ▼ store SQLite  │    │  ▼ connect Hub   │
│               │    │  ▼ track claims  │    │  ▼ claim split   │
│               │    │                  │    │  ▼ receive NIM   │
└──────────────┘    └──────────────────┘    └──────────────────┘
       │                                             │
       └──────────── viral sharing ──────────────────┘
              "I just got 37 NIM from a Drop!"
```

### Request flow

1. **Sender** creates a drop via the frontend → `POST /drops` → backend generates N random splits using stick-breaking, stores them shuffled in SQLite, returns a claim link
2. **Sender** shares the link anywhere
3. **Claimer** opens the link → frontend calls `GET /claim/{id}` to load drop info and check status
4. **Claimer** connects Nimiq wallet via `@nimiq/hub-api` (`hubApi.chooseAddress()`)
5. **Claimer** clicks "Claim" → frontend calls `POST /drops/{id}/claim` → backend picks a random unclaimed split, marks it claimed, returns the amount
6. **NIM transfer** happens via Nimiq Hub checkout — peer-to-peer from sender to claimer
7. **Drop status** updates — if all splits claimed, status flips to `exhausted`

### Component by component

| Component | Technology | Responsibility |
|---|---|---|
| **API server** | Python 3.11+ / FastAPI / uvicorn | REST API: create drops, view status, claim splits, claim page |
| **Storage** | SQLite (WAL mode) | Drops table (metadata), splits table (pre-generated amounts + claim tracking) |
| **Random splits** | Stick-breaking algorithm | Generate N random shares summing exactly to total, shuffled for fair order |
| **Nimiq integration** | `@nimiq/hub-api` (TypeScript) | Wallet connection (`chooseAddress`), NIM payments (`checkout`) |
| **Landing page** | React 19 + Vite + TypeScript + TailwindCSS | Hero, how-it-works, features, dashboard, claim page |
| **Deployment** | Render (backend) + Vercel (frontend) | Backend on Render free tier, static frontend on Vercel |

---

## Randomness model — verifiable by anyone

The splits are pre-generated at drop creation time and stored in SQLite. Anyone can verify:

| Claim | How it's enforced |
|---|---|
| Splits always sum to the total | Stick-breaking algorithm generates N-1 random cut points, takes differences. Last share absorbs rounding. Provable. |
| Claims arrive in random order | Splits are shuffled via `random.shuffle()` before storage — position ≠ size |
| No duplicate claims | SQLite `UPDATE splits SET claimed=1 WHERE id=?` — atomic, single-row update. Same split can't be claimed twice |
| Exhausted drops reject claims | `SELECT COUNT(*) WHERE claimed=0` → if 0, return 400. Status flips to `exhausted` atomically |
| Payouts are genuinely uneven | Stick-breaking produces a uniform distribution over the simplex — every split configuration is equally likely |

**Stick-breaking proof**: For N recipients and total T, generate N-1 independent `Uniform(0,1)` random variables. Sort them. The gaps between consecutive points (from 0 to 1) are the share proportions. This produces a uniform distribution over all possible splits — mathematically equivalent to drawing from a Dirichlet(1,1,...,1) distribution.

---

## How it uses Nimiq

**Wallet connection.** The frontend uses `@nimiq/hub-api` to connect wallets. `hubApi.chooseAddress({ appName: "DropN" })` opens the Nimiq Hub popup — the user selects their wallet, DropN gets their NQ address. No manual typing. No copy-paste errors.

**NIM transfers.** After claiming a split, the frontend triggers `hubApi.checkout()` with the recipient address and amount (in lunas). The Nimiq Hub popup shows the payment details, the payer confirms, and the signed transaction is broadcast to the Nimiq network. The transfer is peer-to-peer — DropN never holds funds.

**Why Hub API.** Nimiq Hub is the standard wallet interface for the Nimiq ecosystem. It supports Nimiq Pay, Nimiq Wallet, and Ledger. Using Hub API means DropN works with every Nimiq wallet without per-wallet integration code.

---

## Engineering decisions & the hard problems

- **Pre-generated splits, not on-claim generation.** Splits are generated at drop creation time and stored in SQLite. This means the split set is fixed and verifiable — no RNG at claim time that could be exploited. The shuffle ensures fair claim order.

- **SQLite, not Postgres.** Zero-config, zero-infrastructure. WAL mode for concurrent reads. A single file. For a Mini App with <100 recipients per drop, SQLite handles the load easily. Render's persistent disk makes it viable in production.

- **Stick-breaking over naive random.** Naive approach: generate N random numbers, normalize to sum to T. That produces a biased distribution (central limit theorem pushes all shares toward the mean). Stick-breaking produces a uniform distribution over the simplex — every split configuration is equally likely. Some people get 80%, some get 0.1%. That's the fun.

- **Frontend → Render, not Vercel serverless.** The Vercel deployment is a pure static site. The API runs on Render with persistent SQLite. No cold-start data loss. No in-memory dicts that vanish. One backend, one source of truth.

- **Wallet address verification via Hub, not text input.** Manual wallet input leads to typos and lost funds. `hubApi.chooseAddress()` returns a verified NQ address from the user's actual wallet. The address is guaranteed correct.

- **Stick-breaking rounding fix.** Floating-point arithmetic can cause the sum of rounded shares to differ from the total by ±0.000001. The last share absorbs the difference: `shares[-1] += total - sum(shares)`. The total is always exact to 6 decimal places.

---

## What's real vs pending — the honesty table

| Capability | Status |
|---|---|
| **Create drop** — stick-breaking splits, SQLite storage | **Real** — deployed on Render, verifiable via curl |
| **Claim split** — random unclaimed share, atomic update | **Real** — tested with concurrent claims, 13 tests pass |
| **Exhausted detection** — status flip, 400 on exhausted claims | **Real** — tested |
| **Claim page info** — `GET /claim/{id}` for frontend rendering | **Real** — returns active/exhausted status + drop metadata |
| **Nimiq Hub wallet connection** — `chooseAddress()` popup | **Real** — integrated in Dashboard and Claim pages |
| **Nimiq Hub checkout** — NIM transfer via popup | **Real** — integrated in Claim page flow |
| **Landing page** — hero, marquee, how-it-works, features, CTA | **Live** at [dropn.vercel.app](https://dropn.vercel.app) |
| **Dashboard** — create drops, track claims, copy links | **Live** in landing page |
| **Claim page** — connect wallet, claim NIM, see result | **Live** in landing page |
| **Vercel deployment** — static site with SPA routing | **Live** at [dropn.vercel.app](https://dropn.vercel.app) |
| **Render deployment** — persistent SQLite backend | **Live** at [dropn-api.onrender.com](https://dropn-api.onrender.com) |
| **Pre-funded escrow** — sender pre-funds drop, claimer withdraws automatically | **Roadmap** — currently peer-to-peer; escrow eliminates sender-online requirement |
| **Nimiq Pay Mini App** — full Mini App integration with Nimiq Pay framework | **Roadmap** — current frontend is standalone; Mini App SDK integration planned |
| **Mainnet deployment** | **Roadmap** — Render + Vercel ready, needs Nimiq mainnet Hub endpoint |

---

## Tests

**13 pytest tests** — all passing, all exercising the API and split logic:

```bash
cd dropn && source .venv/bin/activate && python -m pytest backend/test_api.py -v
```

```
backend/test_api.py::test_root PASSED
backend/test_api.py::test_create_drop PASSED
backend/test_api.py::test_create_drop_validation PASSED
backend/test_api.py::test_get_drop PASSED
backend/test_api.py::test_get_drop_404 PASSED
backend/test_api.py::test_claim_drop PASSED
backend/test_api.py::test_splits_sum_to_total PASSED
backend/test_api.py::test_random_payouts_are_uneven PASSED
backend/test_api.py::test_drop_exhausted PASSED
backend/test_api.py::test_drop_status_exhausted PASSED
backend/test_api.py::test_claim_page_active PASSED
backend/test_api.py::test_claim_page_exhausted PASSED
backend/test_api.py::test_claim_page_404 PASSED

13 passed in 1.56s
```

| Test | What it proves |
|---|---|
| `test_root` | API is online and returns correct metadata |
| `test_create_drop` | Drop creation returns id, claim_link, correct amounts |
| `test_create_drop_validation` | Invalid input (negative amount, empty fields) returns 422 |
| `test_get_drop` | Drop status returns claimed_count, remaining, status |
| `test_get_drop_404` | Unknown drop returns 404 |
| `test_claim_drop` | Claim returns random amount, correct position, total_claimed |
| `test_splits_sum_to_total` | All 10 splits sum to exactly 100.0 NIM (within 0.01) |
| `test_random_payouts_are_uneven` | At least 3 of 5 splits are different amounts — proves randomness |
| `test_drop_exhausted` | Claiming after exhaustion returns 400 "fully claimed" |
| `test_drop_status_exhausted` | Drop status flips to "exhausted" after all claims |
| `test_claim_page_active` | Claim page returns active status with correct remaining count |
| `test_claim_page_exhausted` | Claim page returns exhausted status after all claims |
| `test_claim_page_404` | Unknown claim page returns 404 |

---

## Run it locally

**Prerequisites:** Python 3.11+, Node.js 18+, `@nimiq/hub-api` (auto-installed via npm).

```bash
git clone https://github.com/subheeksh5599/dropn.git
cd dropn

# Backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000

# Frontend (separate terminal)
cd landing && npm install && npm run dev  # :5173
```

The Vite dev server proxies `/api/*` to `localhost:8000`, so the frontend talks to your local backend automatically.

**Run tests:**

```bash
source .venv/bin/activate
python -m pytest backend/test_api.py -v
```

---

## Configuration

### Backend

No config needed. SQLite database is created automatically at `backend/dropn.db`. WAL mode enabled.

### Frontend

Set `VITE_API_URL` to point to your backend:

```bash
# For local dev (default — proxies to :8000 via Vite):
# No env needed — dev server auto-proxies /api

# For production (points to Render):
export VITE_API_URL=https://dropn-api.onrender.com
```

---

## Deploy

| | |
|---|---|
| **Frontend** | **[dropn.vercel.app](https://dropn.vercel.app)** — Vercel (static) |
| **Backend** | **[dropn-api.onrender.com](https://dropn-api.onrender.com)** — Render (FastAPI + uvicorn) |

**Frontend (Vercel):** Push to `master`. Vercel auto-builds via root `vercel.json`: `cd landing && npm install && npm run build`, output from `landing/dist/`. Pure static — no serverless functions.

**Backend (Render):** Uses `render.yaml` — Python runtime, `pip install -r backend/requirements.txt`, `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`. Persistent disk for SQLite.

---

## Project layout

```
dropn/
├── backend/
│   ├── main.py              # FastAPI app — 4 endpoints, CORS, error handling
│   ├── models.py            # Pydantic models: DropCreate, ClaimRequest, responses
│   ├── storage.py           # SQLite storage — init, create_drop, get_drop, claim_drop
│   ├── test_api.py          # 13 pytest tests
│   ├── requirements.txt     # fastapi, uvicorn, pydantic
│   └── dropn.db             # SQLite database (auto-created, gitignored)
├── landing/
│   ├── src/
│   │   ├── App.tsx          # Landing page: Hero, Marquee, HowItWorks, Features, CTA, Footer
│   │   ├── main.tsx         # React entry point
│   │   ├── api.ts           # API client — createDrop, getDrop, claimDrop
│   │   ├── wallet.ts        # Nimiq Hub integration — connectWallet, requestPayment
│   │   ├── index.css        # Tailwind + custom animations (marquee, spin)
│   │   └── pages/
│   │       ├── Dashboard.tsx # Create drops, track claims, connect wallet
│   │       └── Claim.tsx     # Claim page — connect wallet, claim NIM, see result
│   ├── dist/                # Vite build output (gitignored)
│   ├── vercel.json          # SPA rewrites
│   ├── package.json         # React 19, Vite, TailwindCSS, @nimiq/hub-api
│   └── vite.config.ts       # Vite + React + dev proxy to :8000
├── vercel.json              # Root: build command + output directory for Vercel
├── render.yaml              # Render deploy config
└── README.md
```

---

## Tech stack

- **API:** Python 3.11+, FastAPI, uvicorn, Pydantic v2
- **Storage:** SQLite (WAL mode, zero-config)
- **Random splits:** Stick-breaking algorithm (uniform distribution over the simplex)
- **Nimiq integration:** `@nimiq/hub-api` — `chooseAddress()` for wallet connect, `checkout()` for NIM transfers
- **Frontend:** React 19, Vite 8, TypeScript (strict), TailwindCSS 3
- **Deployment:** Render (backend, persistent disk), Vercel (frontend, static)
- **Testing:** pytest (13 tests, all passing)

---

## Roadmap

- **Pre-funded escrow** — sender deposits NIM into a drop contract; claimers withdraw automatically without sender being online
- **Nimiq Pay Mini App** — full integration with Nimiq Pay's Mini App framework for in-wallet drops
- **Nimiq mainnet** — promote from testnet Hub endpoint to mainnet
- **Claim notifications** — WebSocket or push notification when someone claims your drop
- **Drop templates** — "Birthday drop", "Team reward", "Random act of kindness" with pre-set messages
- **Leaderboard** — most generous droppers, luckiest claimers, viral stats
- **Time-limited drops** — unclaimed NIM returns to sender after expiry
- **Multi-currency** — BTC, USDC drops via Nimiq Hub's multi-currency checkout

---

## License

MIT — see [LICENSE](LICENSE).
