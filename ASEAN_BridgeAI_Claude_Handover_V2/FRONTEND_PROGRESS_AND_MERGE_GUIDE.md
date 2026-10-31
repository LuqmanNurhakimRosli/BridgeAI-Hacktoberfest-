# ASEAN BridgeAI V2 — Implementation Progress & Local Backend + AI Merge Guide

> **Last Updated:** 31 October 2026, 13:07 (UTC+8)  
> **Companion Specification:** [`ASEAN_BridgeAI_Claude_Handover_V2/ASEAN_BridgeAI_Gemma4_Implementation_Handover.md`](./ASEAN_BridgeAI_Claude_Handover_V2/ASEAN_BridgeAI_Gemma4_Implementation_Handover.md)  
> **Active Branch:** `feat/mobile-frontend`  
> **Frontend Folder:** `./frontend/` (100% Completed, 20/20 Vitest Tests Passing, Production `next build` Verified)  
> **Backend + AI Folder (Incoming Local Merge):** `./backend/` (Gemma 4 `google/gemma-4-26b-a4b-it` + Kokoro TTS via OpenRouter API)

---

## 1. Overall Handover Checklist Progress (Against V2 Specification Sections 0–30)

### A. Frontend Owner Scope (`./frontend/`) — ✅ 100% COMPLETED
- [x] **Monorepo Folder Isolation:** Moved all Next.js 15 + React 19 + TypeScript + Tailwind CSS v4 + Vitest files into `./frontend/` so `./backend/` can be merged locally on this laptop without any root file conflicts.
- [x] **Shared V2 TypeScript Contracts (`frontend/src/types/index.ts`):**
  - `SourceStatus` (`synthetic_demo` | `self_reported` | `verified_public` | `verified_private`)
  - `StartupProfile`, `DemandBrief`, `ReverseMatch`, `POCPlan`, `Deal`, `DealEvent`, `FollowUpTask`, `ReadinessChecklistItem`, `DealRoomDocMetadata`
- [x] **Responsive AppShell (`frontend/src/components/AppShell.tsx`):**
  - Mobile `<768px`: Sticky top header (`BridgeAI` wordmark + `AiSourceBadge` + Founder pill) + fixed 5-tab bottom navigation (`Home`, `Passport`, `Challenges`, `Deals`, `Insights`) with `48px` touch targets.
  - Desktop `>=768px`: Persistent left sidebar (`md:w-64`) + 2-column split workspaces matching all 10 UI mockups in `BridgeAI_All_UI_UX_Images/`.
- [x] **Screen 1 — Home Gateway (`frontend/src/components/HomeGateway.tsx`):**
  - Matches `bridgeai_asean_opportunity_gateway.png` & `bridgeai_asean_product_showcase.png`.
  - Includes Founder vs Corporate/VC Demand Owner role switcher, 4 live summary tiles, **1-Click "🚀 Run AgriSmart Golden Path" button**, **`🔊 Voice Briefing (Kokoro TTS)`** button, and featured demand cards.
- [x] **Screen 2 — AI Startup Passport 4-Step Wizard (`frontend/src/components/StartupPassportFlow.tsx`):**
  - Matches `bridgeai_asean_startup_passport.png`.
  - Includes 1-click presets (`AgriSmart`, `GreenTech Solutions`, `FinBridge Rural KYC`), 4-step progress bar, live `AI Summary Preview` card with **`🔊 Listen (Kokoro TTS)`**, explicit `Missing Fields / Unknowns` inline confirmation, and safe deck metadata dropzone.
- [x] **Screen 3 — Corporate Challenge & Demand Board (`frontend/src/components/DemandBoard.tsx`):**
  - Matches `bridgeai_asean_challenge_discovery_showcase.png` & `bridgeai_asean_partner_matching_dashboard.png`.
  - Search + Country (`Indonesia`, `Singapore`, `Malaysia`, `Thailand`, `Vietnam`) + Type (`Corporate Challenge` vs `VC Thesis`) + Sector filter pills, `Popular Sectors` strip, and P1 `+ Post Corporate Challenge / VC Thesis` modal.
- [x] **Screen 4 — Opportunity & Reverse-Match Intelligence (`frontend/src/components/ReverseMatchDetail.tsx`):**
  - Matches `bridgeai_opportunity_match_intelligence.png`.
  - Circular SVG Compatibility Gauge (`85% Compatibility` with V2 rubric disclaimer), **`🔊 Read Match Intelligence (Kokoro TTS)`** with voice selector (`af_heart`, `af_bella`, `am_adam`, `bf_emma`), and 4 collapsible Gemma 4 sections (`Why it matches`, `Potential collaboration`, `Risks and missing information`, `Recommended next step`).
- [x] **Screen 5 — Cross-Border 75-Day POC Builder & Multilingual Outreach (`frontend/src/components/PilotPlanEditor.tsx`):**
  - Matches `bridgeai_cross_border_pilot_dashboard.png`.
  - `✨ PROPOSED 75-Day Cross-Border Pilot Plan` banner, 4-phase timeline (`Days 1–75`), editable success criteria table, 5-item **IP, Data & Liability Governance Checklist**, **Grant & Co-Funding Honesty Notice**, and **`English` / `Bahasa Melayu` / `Bahasa Indonesia` Outreach Email Drafter** with **`🔊 Read Draft (Kokoro TTS)`** and `📋 Copy Outreach Draft`.
- [x] **Screen 6 — Deal Tracker, Chevron Funnel & Activity Timeline (`frontend/src/components/DealTrackerView.tsx`):**
  - Matches `bridgeai_asean_deal_tracker_mockup.png`.
  - Browser `localStorage` persistence (`deal-local-client.ts`), 5-step horizontal Chevron Deal Funnel, purple `✨ AI Follow-up Suggestion` banner with **`🔊 Listen (Kokoro TTS)`**, human-confirmed state machine updater (`deal-fsm.ts`), timestamped `ActivityTimeline`, and `30 / 90 / 180 Days` check-in cards.
- [x] **Screen 7 — Outcome Analytics & KPI Dashboard (`frontend/src/components/OutcomeAnalyticsView.tsx`):**
  - Matches `bridgeai_outcome_analytics_dashboard.png`.
  - 3-way cohort switcher (`🌱 My Local Recorded Deals` | `📊 Synthetic Demo Cohort` | `🔀 Combined View`), 6 KPI cards with explicit `numerator / denominator` subtitles (rendering `—` when denominator is `0`), `Outcomes Over Time` chart, `Deals by Sector` SVG donut chart, and `Top ASEAN Countries` table.
- [x] **Screen 8 — Investor Readiness & ASEAN Soft-Landing Checklist (`frontend/src/components/InvestorReadinessView.tsx`):**
  - Matches `bridgeai_investor_readiness_dashboard.png`.
  - Dynamic `78/100` SVG Readiness score ring, 5 readiness checklist categories, metadata-only Safe Deal Room Vault (Rule #14 notice), and 5-country ASEAN Soft-Landing Checklist (marking Thailand NIA 2026 as a closed historical window `20 Feb–15 Mar 2026`).

---

### B. 4 Hackathon Judging Safeguards Implemented in UI — ✅ 100% COMPLETED
| # | Handover V2 Rule | Raw ChatGPT Image Issue | What Our Frontend Now Renders |
|---|---|---|---|
| **1** | **Rule #7 & #11 (Synthetic Provenance)** | Real logos (`BRI`, `GovTech`, `Petronas`) with blue verified checkmarks | Every card displays [`ProvenanceBadge`](file:///c:/Users/Luqman%20Nurhakim/Documents/hackathons/hacktoberfest/frontend/src/components/ProvenanceBadge.tsx) (`🧪 Synthetic Demo Record — Illustrative Only` or `📝 Self-Reported (Local)`) using safe ASEAN demo names (`Nusantara Food & Farms Innovation Lab`). |
| **2** | **Rule #9 & #13 (Proposed POC & Grants)** | `"Send Proposal ->"`, pre-checked DPA agreements, and `"Up to USD 50K grant"` | Badged as **`PROPOSED — Draft for Discussion Only`**, frames IP/Data/Liability as **questions to resolve**, includes a **Non-Guaranteed Grant Notice**, and uses **`Copy Outreach Draft`** + **`Save Qualified Deal`**. |
| **3** | **Rule #12 (Honest Stage Transitions)** | Implied automatic stage progression | [`deal-fsm.ts`](file:///c:/Users/Luqman%20Nurhakim/Documents/hackathons/hacktoberfest/frontend/src/lib/deal-fsm.ts) enforces valid track transitions (`qualified` → `introduction_requested` → `first_meeting` → ... → `paid`) only on explicit human confirmation with a note. |
| **4** | **Section 25.3 (Truthful Funnel Math)** | Static `$2.8M` and `28%` without cohort source or denominator | [`kpi-metrics.ts`](file:///c:/Users/Luqman%20Nurhakim/Documents/hackathons/hacktoberfest/frontend/src/lib/kpi-metrics.ts) separates **Local Browser Deals** from **Synthetic Demo Cohort**, displays `numerator / denominator` on every metric, and shows `—` when denominator is `0`. |

---

### C. Kokoro TTS + OpenRouter API Integration — ✅ 100% COMPLETED
- [x] **OpenRouter + Backend Kokoro Route (`frontend/src/app/api/tts/route.ts`):**
  - Automatically reads `OPENROUTER_API_KEY` (or `KOKORO_API_KEY`) from `frontend/.env.local`.
  - Checks endpoints in priority order:
    1. `process.env.KOKORO_TTS_URL` (if set to a specific OpenRouter or backend Kokoro endpoint)
    2. `${process.env.BACKEND_API_URL}/api/tts`, `/tts`, or `/v1/audio/speech` (your friend's local `backend/` server once merged)
    3. `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/audio/speech` using `Authorization: Bearer ${OPENROUTER_API_KEY}` and `model: process.env.KOKORO_MODEL || 'kokoro'`
    4. Automatic Web Speech API fallback (`kokoro_web_speech_fallback`) if offline so the live demo never fails.
- [x] **UI Player (`frontend/src/components/KokoroTtsButton.tsx`):**
  - Supports Kokoro voices `af_heart`, `af_bella`, `am_adam`, and `bf_emma`, plus multilingual `en-US`, `ms-MY` (Bahasa Melayu), and `id-ID` (Bahasa Indonesia).

---

## 2. How to Merge Your Friend's `backend/` Folder Locally on Your Laptop

When your friend sends or pushes their `backend/` folder (containing the backend + Gemma 4 AI model + Kokoro TTS integration), follow these steps on your laptop:

### Step 1: Place Friend's Code in `./backend/`
Copy or merge their folder so the repository root looks like:
```text
hacktoberfest/
├── frontend/                  # Your Next.js Mobile-First PWA (Port 3000)
├── backend/                   # Friend's Backend + AI + Kokoro TTS (e.g., Port 8000)
├── ASEAN_BridgeAI_Claude_Handover_V2/
├── BridgeAI_All_UI_UX_Images/
├── PROGRESS_AND_BACKEND_MERGE_HANDOVER.md
└── README.md
```

### Step 2: Configure `frontend/.env.local` with Your OpenRouter Key & Local Backend Port
Create `frontend/.env.local` (copied from `frontend/.env.example`):
```dotenv
# 1. OpenRouter API Key (Used for both Gemma 4 26B A4B and OpenRouter/Kokoro TTS)
OPENROUTER_API_KEY=sk-or-v1-PASTE_YOUR_REAL_OPENROUTER_KEY_HERE
OPENROUTER_MODEL=google/gemma-4-26b-a4b-it
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# 2. Kokoro TTS via OpenRouter or Friend's Local Backend
KOKORO_MODEL=kokoro
KOKORO_DEFAULT_VOICE=af_heart
KOKORO_TTS_URL=http://localhost:8000/api/tts

# 3. Friend's Local Backend Server URL
BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

### Step 3: API Contract Mapping Between `frontend/` and `backend/`
`frontend/` already has working Next.js route handlers in `frontend/src/app/api/*` that call OpenRouter directly OR proxy to `backend/`:
1. **`POST /api/analyze`**
   - Request: `{ "description": "We are AgriSmart...", "locale": "en" }`
   - Response: `{ "profile": StartupProfile, "meta": { "model": "google/gemma-4-26b-a4b-it", "prompt_version": "passport-v2", "ai_source": "gemma_live" } }`
2. **`GET /api/challenges`**
   - Query params: `?country=Indonesia&sector=AgriTech&kind=corporate_challenge`
   - Response: `{ "challenges": DemandBrief[], "data_notice": "..." }`
3. **`POST /api/demand/matches`**
   - Request: `{ "profile": StartupProfile, "demandIds": ["DEMO-CH-001"] }`
   - Response: `{ "matches": ReverseMatch[], "meta": { "scoring_engine": "deterministic_rubric_v2", "ai_source": "gemma_live" } }`
4. **`POST /api/poc`**
   - Request: `{ "profile": StartupProfile, "demandId": "DEMO-CH-001", "language": "Bahasa Indonesia", "durationDays": 75 }`
   - Response: `{ "plan": POCPlan, "meta": { "prompt_version": "poc-75d-v2", "ai_source": "gemma_live" } }`
5. **`POST /api/tts` (Kokoro TTS)**
   - Request: `{ "text": "...", "voice": "af_heart", "speed": 1.0, "lang": "en-US" }`
   - Response: Binary `audio/wav` / `audio/mpeg` OR JSON `{ "ok": true, "audio_base64": "...", "content_type": "audio/wav", "provider": "kokoro_openrouter" }`

### Step 4: Start Both Servers Locally & Verify Golden Path
```bash
# Terminal 1 — Start Frontend (http://localhost:3000)
cd frontend
npm run dev

# Terminal 2 — Start Friend's Backend (if separate Python/Node server on port 8000)
cd backend
# e.g., uvicorn main:app --reload --port 8000  OR  npm run dev
```

### Step 5: Remaining Team Checklist Before 3:00 PM Submission
- [x] Frontend Mobile-First PWA (`390px` + Desktop responsive split-view) built and tested (`20/20` Vitest tests passing)
- [x] 4 Hackathon Judging Safeguards (`Synthetic Demo` badges, `PROPOSED` POC disclaimers, `deal-fsm`, Local vs Demo cohort math) verified
- [x] Kokoro TTS + OpenRouter integration wired across all 5 AI screens
- [ ] Merge friend's `./backend` folder locally and paste real `OPENROUTER_API_KEY` into `frontend/.env.local`
- [ ] Deploy to Vercel (set Root Directory to `frontend` in Vercel project settings and add `OPENROUTER_API_KEY` in Vercel Environment Variables)
- [ ] Record the $\le$ 3-minute Golden Path pitch video (using the 1-click **AgriSmart Golden Path** button on Home)
