# ASEAN BridgeAI

> **Demand-to-deal cross-border engine for ASEAN startups powered by Gemma 4 and Kokoro TTS.**

---

## 📌 Project Overview

**ASEAN BridgeAI** is an AI-powered intelligence and reverse-matching platform designed to accelerate cross-border B2B pilot partnerships and investment deals across Southeast Asia.

Traditional cross-border expansion for ASEAN startups suffers from a broken paradigm: founders spend 9–14 months sending blind, generic cold pitch decks across linguistic and regulatory borders, while enterprise innovation teams struggle to find vetted startups that meet their exact technical constraints. Furthermore, standard AI wrappers frequently hallucinate traction metrics, falsify match scores, and create fake legal agreements that break enterprise trust.

**ASEAN BridgeAI inverts this dynamic**: corporations and venture capitalists publish concrete, verified demand briefs, and founders use a guided AI workflow powered by **Google Gemma 4** and **Kokoro TTS** to extract a verified Startup Passport, calculate tamper-proof match scores, draft structured 75-day proof-of-concept (POC) proposals, and manage relationship milestones with full human-in-the-loop governance.

---

## 🚀 Key Features

### 1. Zero-Hallucination Startup Passport
- Founders input their unstructured business narrative in any regional English, Malay, or Indonesian phrasing.
- **Google Gemma 4 (26B A4B IT)** extracts structured metadata (Sector, Geography, Stage, Core Product, Business Needs, Capability Tags) without inventing unsupported traction or revenue claims.
- Missing or unconfirmed fields are transparently flagged for the founder to review and verify before entering the market.

### 2. Reverse-Matching with Deterministic Hard-Gate Scoring
- Matches the founder's profile against a curated catalog of ASEAN corporate innovation challenges and VC investment theses.
- **Tamper-Proof Math**: Match compatibility scores (0–100%) are computed through a strictly deterministic rubric:
  - Sector Alignment: **30%**
  - Must-Have Requirement Coverage: **30%**
  - Cross-Border Deliverability: **15%**
  - Funding Stage Compatibility: **15%**
  - Documented Readiness: **10%**
- The LLM explains the fit and identifies operational gaps; it is strictly barred from modifying or inventing the score.

### 3. Actionable 75-Day Pilot POC Generator
- Gemma 4 synthesizes a staged, 4-milestone collaboration plan tailored to the partner's problem statement.
- Enforces essential corporate governance provisions: Day 0 discovery, quantitative success KPIs, validation methods, data-sharing protocols, and IP ownership boundaries.
- Every plan carries an explicit `[PROPOSED]` status disclaimer to prevent premature legal exposure.

### 4. Human-Confirmed Deal Activity CRM
- Built upon an append-only Finite State Machine (FSM) event ledger (`identified` → `qualified` → `proposal_shared` → `poc_running` → `paid`).
- Commercial relationships advance exclusively through human confirmation—preventing automated workflow hallucination.

### 5. Multilingual Kokoro TTS Speech Synthesis
- Real-time voice delivery powered by the **Kokoro-82M** audio model streaming native MP3 audio (`audio/mpeg`).
- Enables cross-border accessibility for on-the-go founders and multilingual voice briefings across ASEAN regional contexts.

---

## 🛡️ Hackathon & Enterprise Safeguards

- **Immutable Scoring**: All match percentages are computed via mathematical code rubrics, preventing AI score inflation.
- **Honest Data Provenance**: Synthetic demo challenges and mock cohorts are visually badged to maintain data integrity.
- **Append-Only Audit Trail**: Stage transitions require verifiable actor timestamps and notes.
- **Proposed POC Status**: Commercial plans are clearly marked as proposals until counter-signed in the real world.

---

## 💻 Complete Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Foundation LLM** | **Google Gemma 4 26B A4B IT** (`google/gemma-4-26b-a4b-it`) | High-reasoning structured extraction, fit explanation, and POC planning. |
| **Voice / Speech AI** | **Hexgrad Kokoro-82M** (`hexgrad/kokoro-82m`) | Neural TTS engine streaming high-clarity binary audio (`audio/mpeg`). |
| **AI Gateway** | **OpenRouter API** | Low-latency inference, model routing, and production fallback handling. |
| **Frontend Framework** | **Next.js 15.5** (App Router, Turbopack) | Modern React 19 application framework with Server and Client Components. |
| **Language** | **TypeScript 5.7+** | End-to-end type safety across schemas, API contracts, and UI components. |
| **Styling & Design** | **Tailwind CSS v4** & **Lucide Icons** | Mobile-first responsive design, touch targets (44px+), and accessible UI states. |
| **Data Validation** | **Zod 4.6** | Strict boundary schemas for API requests, model outputs, and data contracts. |
| **Test & Verification** | **Vitest 5.0** | 7 test suites (117 unit/integration tests) ensuring 100% test passing rate. |
| **Architecture** | **Event-Sourced FSM & PWA** | Client-side persistent offline storage and event-driven state transitions. |

---

## 🧪 Verification & Evidence

- **Unit & Integration Suite**: 7/7 test suites passing, 117/117 tests verified (`npm test`).
- **Live Golden Path**: End-to-end workflow (`/api/analyze` → `/api/demand/matches` → `/api/poc`) executed and validated live against OpenRouter Gemma 4.
- **Production Build**: 0 type errors, 0 compilation warnings across all pages and API routes (`npm run build`).
