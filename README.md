<div align="center">
  <h1>BlinkSplit ⚡</h1>
  > <p><em>Snap a receipt. AI splits it. Drop a Solana Blink in the group chat. Everyone pays in one click.</em></p>
  <img src="docs/readme.png" alt="BlinkSplit" width="100%">

  <br/>

  [![Live Demo](https://img.shields.io/badge/🚀_Live-Demo-06b6d4?style=for-the-badge)](https://blinksplit.edycu.dev)
  [![Pitch Video](https://img.shields.io/badge/🎬_Pitch-Video-ef4444?style=for-the-badge)](https://youtube.com/watch?v=DEMO_VIDEO)
  [![Pitch Deck](https://img.shields.io/badge/📊_Pitch-Deck-f59e0b?style=for-the-badge)](https://blinksplit.edycu.dev/pitch)
  [![Built for Frontier](https://img.shields.io/badge/Colosseum-Frontier_Hackathon-8b5cf6?style=for-the-badge)](https://superteam.fun/earn/listing/100xdevs-frontier-hackathon-track)

  <br/>

  ![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat&logo=next.js)
  ![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat&logo=solana&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
  ![OpenAI](https://img.shields.io/badge/GPT--4o_Vision-412991?style=flat&logo=openai&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
  [![BlinkSplit CI](https://github.com/edycutjong/blinksplit/actions/workflows/ci.yml/badge.svg)](https://github.com/edycutjong/blinksplit/actions/workflows/ci.yml)

</div>

---

## 📸 See it in Action

<div align="center">
  <img src="docs/readme.png" alt="BlinkSplit App Demo" width="100%">
</div>

> **Three steps, zero app downloads.** Snap → Split → Blink.

---

## 💡 The Problem & Solution

Splitting a dinner bill with friends is still painful in 2026. Venmo requires everyone to have the same app. Bank transfers take days. And someone always "forgets" to pay.

**BlinkSplit** solves this by combining **AI receipt parsing** with **Solana Blinks** — shareable payment links that work inside any app (X/Twitter, Telegram, Discord). Your friends click the link, sign with their Solana wallet, and you receive USDC instantly. No app downloads. No sign-ups. No IOUs.

**Key Features:**
- ⚡ **AI-Powered Receipt OCR** — GPT-4o Vision parses line items, tax, and tips in seconds
- 🔗 **Solana Blinks** — One-click USDC payments via shareable URLs (works in X, Telegram, Discord)
- 📱 **Zero App Required** — Friends just click the link and sign with any Solana wallet (Phantom, Backpack, Solflare)
- 💰 **Instant USDC Settlement** — No holding periods, no price volatility, funds arrive instantly
- 📊 **Real-Time Tracking** — Live payment status dashboard powered by Supabase Realtime
- 🧪 **Demo Mode** — Fully functional without API keys using built-in demo data

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4 |
| **AI** | GPT-4o Vision (receipt OCR) |
| **Database** | Supabase (PostgreSQL + Realtime) |
| **Blockchain** | Solana Devnet — Blinks + USDC SPL |
| **Deploy** | Vercel |

> 📐 **[Full architecture deep-dive →](docs/ARCHITECTURE.md)** — System diagram, database schema, API endpoints, and Solana integration details.

---

## 🏆 Sponsor Tracks Targeted

### Solana Actions / Blinks (Primary Integration)

BlinkSplit is a **pure Solana Actions showcase**. The entire value proposition IS the Blink:

| Integration Point | File | What it Does |
|---|---|---|
| `GET` Action endpoint | [`src/app/api/actions/pay/[paymentId]/route.ts`](src/app/api/actions/pay/%5BpaymentId%5D/route.ts) | Returns `ActionGetResponse` with dynamic icon, title, and USDC amount |
| `POST` Action endpoint | [`src/app/api/actions/pay/[paymentId]/route.ts`](src/app/api/actions/pay/%5BpaymentId%5D/route.ts) | Constructs `VersionedTransaction` with `createTransferCheckedInstruction` for USDC SPL token transfer |
| Actions manifest | [`public/actions.json`](public/actions.json) | Maps domain URLs to Action endpoints for Blink discovery |
| Blink generator | [`src/lib/blinks.ts`](src/lib/blinks.ts) | Generates unique Blink URLs for each payer in a split |

**Solana Details:**
- **Network:** Devnet (mainnet-ready code)
- **USDC Mint (Devnet):** `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- **Transaction Type:** `createTransferCheckedInstruction` (SPL token transfer)
- **Wallet Support:** Phantom, Backpack, Solflare (any Actions-compatible wallet)

---

## 📁 Project Structure

```
blinksplit/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Landing page (glassmorphism hero)
│   │   ├── split/[id]/page.tsx               # Split assignment + Blink generation
│   │   ├── split/[id]/blinks/page.tsx        # Blink cards + payment tracker
│   │   ├── history/page.tsx                  # Split history dashboard
│   │   ├── api/
│   │   │   ├── actions/pay/[paymentId]/route.ts  # ⭐ Solana Action endpoints
│   │   │   ├── splits/route.ts               # Create split session
│   │   │   ├── splits/[id]/route.ts          # Get/update split
│   │   │   ├── splits/[id]/generate-blinks/route.ts
│   │   │   ├── splits/[id]/pay/route.ts      # Mark payment complete
│   │   │   ├── parse-receipt/route.ts        # GPT-4o Vision OCR
│   │   │   └── health/route.ts               # Health check
│   │   └── layout.tsx
│   └── lib/
│       ├── blinks.ts                         # Blink URL generation
│       ├── receipt-parser.ts                 # Receipt parsing logic
│       ├── store.ts                          # Client-side state management
│       └── supabase.ts                       # Supabase client
├── db/
│   └── schema.sql                            # Supabase schema (JSONB-based)
├── public/
│   ├── logo.svg                              # Brand logo
│   └── actions.json                          # Solana Actions manifest
├── .env.example                              # ⭐ Environment variable template
├── package.json
└── README.md                                 # You are here
```

---

## 🚀 Run it Locally (For Judges)

### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/edycutjong/blinksplit.git
cd blinksplit

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your API keys (see below) — or skip for demo mode!

# 4. Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're in!

### Environment Variables

| Variable | Required? | Where to Get |
|----------|-----------|--------------|
| `NEXT_PUBLIC_RPC_URL` | Optional | [Helius](https://helius.dev) — defaults to public devnet RPC |
| `NEXT_PUBLIC_FEE_ACCOUNT` | Optional | Your Solana wallet address (Phantom/Solflare) |
| `OPENAI_API_KEY` | Optional | [OpenAI](https://platform.openai.com/api-keys) — falls back to demo data |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | [Supabase](https://supabase.com/dashboard) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase Dashboard → Settings → API |

> **💡 Note for Judges:** All API keys are **optional**! The app includes a "Try Demo Receipt" button that works with zero configuration. Click it to see the full flow with pre-loaded sample data.

### CI & Quality

```bash
# Run the full CI pipeline (lint + typecheck + 100% test coverage)
npm run ci
```

| Check | Command | Status |
|-------|---------|--------|
| ESLint | `npm run lint` | ✅ Zero warnings |
| TypeScript | `npm run typecheck` | ✅ Strict mode |
| Tests | `npm run test:coverage` | ✅ 109 tests, **100% coverage** |

---

## 🧪 Test Coverage

```
 16 test files  |  109 tests passed  |  100% coverage across all metrics
─────────────────────────────────────────────────────────────
 File                                 | Stmts | Branch | Funcs | Lines
─────────────────────────────────────────────────────────────
 All files                            |  100  |  100   |  100  |  100
─────────────────────────────────────────────────────────────
```

---

## 🧰 Key Libraries

| Package | Purpose |
|---------|---------|
| `@solana/actions` | Solana Actions/Blinks SDK — metadata + tx construction |
| `@solana/web3.js` | Solana RPC connection, transaction building |
| `@solana/spl-token` | USDC (SPL token) transfer instructions |
| `@supabase/supabase-js` | Database client + Realtime subscriptions |
| `framer-motion` | Glassmorphism UI animations |
| `lucide-react` | Icon library |

---

## 👤 Built By

**Edy Cu Tjong** — Solo developer

- [![X](https://img.shields.io/badge/@edycutjong-000000?style=flat-square&logo=x&logoColor=white)](https://x.com/edycutjong)
- [![GitHub](https://img.shields.io/badge/@edycutjong-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/edycutjong)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ☕ and ⚡ for the <strong>Colosseum Frontier Hackathon</strong></sub>
</div>
