<img align="center" src="https://img.shields.io/badge/DropN-NIM_drops-FFB7B2?style=for-the-badge" alt="DropN" />

<p align="center">
  <img src="https://img.shields.io/badge/python-3.11+-blue?style=flat-square" alt="Python" />
  <img src="https://img.shields.io/badge/fastapi-0.139-009688?style=flat-square" alt="FastAPI" />
  <img src="https://img.shields.io/badge/nimiq-pay-ECB22E?style=flat-square" alt="Nimiq" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
</p>

<h1 align="center">DropN</h1>
<h3 align="center"><i>Send NIM like a gift. Claim it like a surprise.</i></h3>

<p align="center"><strong>Create NIM drops with random payouts. Share a link. Lucky receivers get random amounts — some more, some less. That's the fun.</strong></p>

<p align="center">
  <a href="#the-problem">Problem</a> •
  <a href="#the-solution">Solution</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#api">API</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#demo-flow">Demo Flow</a> •
  <a href="#faq">FAQ</a> •
  <a href="#powered-by">Powered By</a>
</p>

---

## The Problem

| Problem | Impact |
|---------|--------|
| Sending crypto feels like a bank transfer — cold, exact, boring | Nobody shares payments. Nobody talks about sending money. Zero virality. |
| Existing split tools split equally by default | Equal splits are fair but boring. No surprise, no delight, no reason to share. |
| Payment apps have no emotional layer | Venmo has emojis. WeChat Red Packets have luck. Crypto wallets have neither. |
| Nimiq Pay has no social payment mechanic | Wallet-to-wallet transfers work, but there's no gift/surprise/luck mechanic built in. |

## The Solution

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Sender      │    │   DropN API  │    │  Receivers   │
│  creates      │───▶│  generates   │───▶│  open link   │
│  drop + msg   │    │  random      │    │  get random  │
│               │    │  splits      │    │  NIM amounts │
└──────────────┘    └──────────────┘    └──────────────┘
       │                                       │
       └─────────── viral sharing ──────────────┘
              "I just got 37 NIM from a Drop!"
              "I made a Drop for my team 🎉"
```

**What you get:**
- Create a drop with a message and total NIM amount
- Generate random, uneven payouts — some people get more, some less
- Share a single link. Anyone opens it, claims instantly
- No accounts, no signup, no app download — just a link
- Built-in virality: receivers share their wins, senders share their drops
- Dead simple API — frontend handles the Nimiq wallet interaction

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    DropN Server                     │
│                  (FastAPI :8000)                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│   POST /drops        ──▶  Create drop + generate    │
│                            random splits            │
│                                                     │
│   GET /drops/{id}    ──▶  View status: claimed/     │
│                            remaining, amounts       │
│                                                     │
│   POST /drops/{id}/  ──▶  Claim a random split      │
│        claim              (stick-breaking algo)     │
│                                                     │
│   GET /claim/{id}    ──▶  Claim page info for       │
│                            frontend rendering       │
├─────────────────────────────────────────────────────┤
│                    SQLite Storage                   │
│   drops table: id, message, amount, recipients      │
│   splits table: pre-generated random amounts        │
│                 claimed/unclaimed tracking          │
└─────────────────────────────────────────────────────┘
```

| Layer | Technology |
|-------|-----------|
| API | Python 3.11+ / FastAPI / uvicorn |
| Storage | SQLite (WAL mode, zero config) |
| Random Split | Stick-breaking algorithm (uniform random distribution) |
| Frontend | Nimiq Pay Mini App Framework (separate repo) |
| Wallet | Nimiq Pay — handles actual NIM transfers |

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/drops` | POST | Create a new drop. Returns claim link. |
| `/drops/{id}` | GET | View drop status — claimed count, remaining, link |
| `/drops/{id}/claim` | POST | Claim a random split from the drop |
| `/claim/{id}` | GET | Public claim page info for frontend |

### POST /drops

| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | float | Total NIM to distribute (must be > 0) |
| `message` | string | Sender's message (1-200 chars) |
| `recipients` | int | Number of people who can claim (2-100) |
| `sender_wallet` | string | Sender's Nimiq wallet address |

**Response:** `{ id, claim_link, message, total_amount, recipients, status }`

### POST /drops/{id}/claim

| Parameter | Type | Description |
|-----------|------|-------------|
| `wallet` | string | Claimer's Nimiq wallet address |

**Response:** `{ drop_id, amount, message, position, total_claimed, total_recipients }`

- Amounts are random and uneven — each claimer gets a different share
- Max 100 recipients per drop
- Exhausted drops return `400: fully claimed`

## Quick Start

```bash
# 1. Clone
git clone https://github.com/subheeksh5599/dropn.git
cd dropn

# 2. Install
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt

# 3. Run
python -m uvicorn backend.main:app --reload --port 8000

# 4. Create a drop
curl -X POST http://localhost:8000/drops \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"message":"Team lunch! 🍕","recipients":5,"sender_wallet":"NQ12_YOUR_WALLET"}'

# 5. Claim it (from a friend's perspective)
curl -X POST http://localhost:8000/drops/<id>/claim \
  -H "Content-Type: application/json" \
  -d '{"wallet":"NQ12_FRIEND_WALLET"}'
```

## Demo Flow

For the 3-minute Nimiq Mini Apps Competition demo:

1. **Create** — *"I just sent 100 NIM as a gift to my team. One link. 5 people."*
2. **Share** — Copy link, paste into chat
3. **Claim** — Open link on phone → *"You received 23 NIM! 🎉"*
4. **Surprise** — Different people get different amounts. The luck mechanic is the hook.
5. **Viral** — *"I made 37 NIM from a DropN link!"* — immediate social share

**Demo URL format:** `https://dropn.vercel.app/claim/<id>`

## FAQ

<details>
<summary><strong>Why random amounts instead of equal splits?</strong></summary>

Equal splits are fair but forgettable. Random amounts create surprise — some people get lucky, some don't. This is the mechanic that made WeChat Red Packets a $100B+/year product. People share their wins and their surprise, which makes the app viral by design.
</details>

<details>
<summary><strong>How are the random splits generated?</strong></summary>

We use the stick-breaking algorithm: generate N-1 random cut points between 0 and the total amount, then take the differences between consecutive points as individual shares. The shares are then shuffled so claims arrive in random order. All amounts always sum exactly to the total.
</details>

<details>
<summary><strong>What if someone claims after the drop is exhausted?</strong></summary>

The API returns `400: This drop has been fully claimed`. The frontend shows a "Sorry, you were too late!" message with the original sender's message still visible — so they know what they missed.
</details>

<details>
<summary><strong>Where does the NIM actually move?</strong></summary>

DropN's backend handles the logic — generating splits, tracking claims, maintaining state. The actual NIM transfer happens on the frontend via Nimiq Pay's wallet framework. When someone claims, the frontend triggers the wallet transaction from the sender's pre-authorized drop pool to the claimer's wallet.
</details>

<details>
<summary><strong>Is this a full app or just an API?</strong></summary>

The backend is a complete REST API. The frontend (Nimiq Pay Mini App) is a separate mobile-optimized web app that consumes this API. Together they form a full Mini App for the Nimiq Mini Apps Competition.
</details>

<details>
<summary><strong>Can I use this without a frontend?</strong></summary>

Yes. The API is fully functional on its own. You can `curl` drops and claims directly. The claim links work as standalone pages when paired with a minimal HTML frontend.
</details>

## Powered By

<p align="center">
  <strong>FastAPI</strong> — <i>Modern Python web framework</i><br />
  <strong>Nimiq Pay</strong> — <i>Wallet and payment infrastructure for Mini Apps</i><br />
  <strong>SQLite</strong> — <i>Zero-config embedded database</i>
</p>

## License

MIT. Build whatever you want with it.
