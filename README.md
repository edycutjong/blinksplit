<div align="center">
  <h3>⚡ BlinkSplit</h3>
  <p><em>AI-powered receipt scanner that generates Solana Blinks — drop a link in the group chat, and everyone pays their exact USDC share instantly.</em></p>

  <img src="docs/readme.png" alt="BlinkSplit Hero" width="100%">
  
  [![Built with Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
  [![Solana](https://img.shields.io/badge/Solana-Blinks-9945FF.svg)](https://solana.com)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## 📸 See it in Action

<div align="center">
  <img src="src/app/opengraph-image.png" alt="BlinkSplit Demo" width="800">
</div>

## 💡 The Problem

Your friend owes you $24.50 from last Friday's dinner. You don't want to be awkward about it. You don't want to download another app. You just want to drop a link in the group chat and have everyone pay their exact share — in 10 seconds.

## 🚀 The Solution

**BlinkSplit** — Snap → Split → Pay:

1. **📸 Snap** — Upload a receipt photo
2. **🤖 AI Splits** — GPT-4o Vision extracts every item, tax, and tip
3. **⚡ Blinks** — Generate Solana Action URLs for each person's share
4. **💸 Pay** — Friends click the link and pay USDC. No app download.

The entire flow takes **under 30 seconds**.

## ✨ Key Features

- ⚡ **AI Receipt Scanner** — GPT-4o Vision extracts items, prices, tax, tip as structured JSON
- 🎯 **Split Assignment UI** — Visual interface to assign items to people
- 🔗 **Blink Generator** — Unique Solana Action URLs for each person's share
- 📊 **Payment Tracking** — Real-time dashboard showing paid vs pending
- 💬 **Share via Link** — Drop Blink URLs in WhatsApp, Discord, X — anywhere
- 📜 **Receipt History** — Supabase-stored history of past splits

## 🏗️ Architecture & Tech Stack

For full technical details, API endpoints, and database schemas, see the [Architecture Documentation](docs/ARCHITECTURE.md).

## 🏆 Hackathon

Built for **[Colosseum Frontier](https://colosseum.org/frontier)** — [100xDevs](https://100xdevs.com) Consumer Track.

## 🚀 Run Locally

```bash
git clone https://github.com/edycutjong/blinksplit.git
cd blinksplit
npm install
cp .env.example .env.local   # Add your API keys
npm run dev
```

## 📄 License

[MIT](LICENSE)
