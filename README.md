<div align="center">
  <img src="docs/assets/readme-hero.png" alt="BlinkSplit Hero" width="100%">
  
  <p><em>AI-powered receipt scanner that generates Solana Blinks — drop a link in the group chat, and everyone pays their exact USDC share instantly.</em></p>
  
  [![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](https://100xdevs.vercel.app)
  [![Pitch Video](https://img.shields.io/badge/Pitch-Video-red.svg)](https://youtube.com/your-video)
  [![GitHub](https://img.shields.io/badge/GitHub-Repository-black.svg)](https://github.com/edycutjong/frontier-100xdevs)
</div>

---

## 📸 See it in Action
*(Demo GIF and UI screenshots can be found in the `docs/assets` directory)*

<div align="center">
  <img src="docs/assets/og-image.png" alt="App Demo" width="800">
</div>

## 💡 The Problem & Solution
Your friend owes you $24.50 from last Friday's dinner. You don't want to be awkward about it.

**BlinkSplit** solves this by providing: 
AI-powered receipt scanner that generates Solana Blinks — drop a link in the group chat, and everyone pays their exact USDC share instantly.

**Key Features:**
- ⚡ **AI Receipt Scanner:** Upload photo → GPT-4o Vision extracts items, prices, tax, tip as structured JSON
- 🔒 **Split Assignment UI:** Visual interface to assign items to people (name + wallet address)
- 🎨 **Blink Generator:** Generate unique Solana Action URLs for each person's calculated share
- 🚀 **Payment Tracking:** Dashboard showing who has paid and who hasn't (via Supabase real-time)
- 🧠 **Share via Link:** Copy-paste Blink URLs to WhatsApp, Discord, X, or any messaging app
- 🛡️ **Receipt History:** Supabase-stored history of past splits

## 🏗️ Architecture & Tech Stack
We built the frontend using **Next.js 16** and **Tailwind CSS v4**.

*(Check the architecture directory for detailed system diagrams)*
See the [Architecture Document](docs/ARCHITECTURE.md) and [Product Requirements Document](docs/PRD.md) for full system specifications.

## 🏆 Sponsor Tracks Targeted
* **Sponsor Integration**: Colosseum Frontier (Base) - Consumer category. AI + crypto combination is novel.

## 🚀 Run it Locally (For Judges)

1. **Clone the repo:**
   ```bash
   git clone https://github.com/edycutjong/frontier-100xdevs.git
   cd frontier-100xdevs
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:** 
   Rename `.env.example` to `.env.local` and add your keys.
4. **Run the app:**
   ```bash
   npm run dev
   ```

> **Note for Judges:** 
> Detailed submission materials, demo scripts, and sponsor defenses are located in the `docs/` directory.
> Read `docs/SUBMISSION.md` for the complete pitch and `docs/SPONSOR_DEFENSE.md` for technical implementation details.
