# ASEAN BridgeAI V2 — Monorepo (`frontend/` + `backend/`)

**Track:** Category A — Best Use of Gemma 4 (`google/gemma-4-26b-a4b-it` via OpenRouter) + **Kokoro Neural TTS** Voice Synthesis

## Repository Structure

```text
BridgeAI-Hacktoberfest-/
├── frontend/                     # Next.js 15 + TypeScript + Tailwind CSS Mobile-First PWA
│   ├── src/
│   │   ├── app/                  # App Router pages + /api/analyze, /api/challenges, /api/demand/matches, /api/poc, /api/tts
│   │   ├── components/           # Responsive Mobile/Desktop UI + KokoroTtsButton
│   │   ├── data/                 # Synthetic-labelled ASEAN corporate challenges & demo cohort deals
│   │   ├── lib/                  # Deterministic 30/30/15/15/10 matcher, Deal FSM, Honest KPI math, OpenRouter client
│   │   └── types/                # Shared V2 TypeScript contracts
│   ├── tests/                    # Vitest unit & integration test suites
│   ├── public/                   # PWA manifest.webmanifest
│   ├── .env.example              # Frontend & Kokoro TTS / Backend URL configuration
│   └── package.json
├── backend/                      # Teammate's Backend + AI Model + Kokoro TTS Server (merge here)
├── ASEAN_BridgeAI_Claude_Handover_V2/
├── BridgeAI_All_UI_UX_Images/
├── LICENSE                       # MIT License
└── README.md
```

## Quick Start (`frontend/`)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open **http://localhost:3000**.

## Connecting `frontend/` to Your Friend's `backend/` & Kokoro TTS API

In `frontend/.env.local`, configure:

```dotenv
# OpenRouter Gemma 4 Runtime
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY
OPENROUTER_MODEL=google/gemma-4-26b-a4b-it

# Friend's Backend + AI / Kokoro TTS Server
BACKEND_API_URL=http://localhost:8000
KOKORO_TTS_URL=http://localhost:8000/api/tts
KOKORO_DEFAULT_VOICE=af_heart
```

### How Kokoro TTS Works in BridgeAI (`frontend/src/components/KokoroTtsButton.tsx` & `frontend/src/app/api/tts/route.ts`)
- **Supported Voices:** `af_heart` (Natural Warm), `af_bella` (Executive Clear), `am_adam` (Founder Pitch), `bf_emma` (British Advisory).
- **Where Kokoro TTS is Embedded:**
  1. **Home Gateway (`BridgeAI Assistant`)**: `🔊 Voice Briefing (Kokoro TTS)` reads aloud the founder's ASEAN demand-to-deal summary.
  2. **AI Startup Passport (`AI Summary Preview`)**: `🔊 Listen` reads aloud the extracted Startup Passport card and missing-field status.
  3. **Opportunity & Match Intelligence (`ReverseMatchDetail`)**: `🔊 Read Match Intelligence (Kokoro TTS)` with voice selector reads aloud the compatibility score, why it matches, collaboration idea, and next step.
  4. **75-Day POC Builder & Multilingual Outreach (`PilotPlanEditor`)**: `🔊 Read English / Bahasa Melayu / Bahasa Indonesia Draft (Kokoro TTS)` reads aloud the generated outreach email in the chosen ASEAN language.
  5. **Deal Tracker (`DealTrackerView`)**: `🔊 Listen` next to every `✨ AI Follow-up Suggestion` banner.
- **Automatic Resilience:** `/api/tts` automatically forwards requests to `KOKORO_TTS_URL` or `${BACKEND_API_URL}/api/tts` (or `/tts` or `/v1/audio/speech`). If the backend server is offline during standalone frontend testing, it gracefully falls back to browser speech synthesis so audio playback works 100% of the time during your live demo.
