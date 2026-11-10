# THE PACK MEME BLASTER ⚡ AROOOOO!

Automated **r/THE_PACK** heavy-metal meme generator and autonomous daily email dispatcher powered by Google Gemini.

---

## 🚀 Features

* **⚡ 2-Phase Copywriting Architecture:** Intense high-stakes biker hooks paired with radically mundane, health-conscious, wholesome domestic subversions (ergonomics, hydration, pet care, sleep hygiene, duct tape, and grocery coupons).
* **🎨 5 Heavy Metal Visual Presets:** Dynamic rendering across *High-Gloss Dark Fantasy Airbrush*, *Vintage Pulp Screenprint*, *High-Fantasy Concept Art*, *Macro Studio Photography*, and *Classical Academic Oil Realism*.
* **🤖 Continuous Vision Style Reviewer:** Post-generation visual inspection loop enforcing authentic 2003 3D WordArt typography, drop shadows, and full-bleed canvas coverage while actively guarding against apparel mockups or borders.
* **📧 Headless Autonomous Dispatch (Nodemailer SMTP):** Secure server-side email dispatching supporting Gmail App Passwords and inline RFC 2822 CID images so memes land crisp directly in your inbox and your crew's BCC roster.
* **🧠 Persistent Anti-Repetition Memory:** Multi-generation history tracking that persists recent topic buckets and resolution punchlines to guarantee zero repetition across daily dispatches.

---

## 🛠️ Run Locally

**Prerequisites:** Node.js (v18+)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/stockmanster-wizard/pack-meme-generator.git
   cd pack-meme-generator
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your keys:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   GMAIL_USER="your-email@gmail.com"
   GMAIL_APP_PASSWORD="your-16-char-gmail-app-password"
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🦾 Architecture

* **Frontend:** React, Tailwind CSS, Lucide Icons, Vite.
* **Backend:** Express, TypeScript, Google Gen AI SDK (`@google/genai`), Nodemailer.
* **Persistence:** Local JSON store (`.pack-server-store.json`) + optional Firebase Firestore sync.

---

*CRANK THAT HOG BROTHER!*
