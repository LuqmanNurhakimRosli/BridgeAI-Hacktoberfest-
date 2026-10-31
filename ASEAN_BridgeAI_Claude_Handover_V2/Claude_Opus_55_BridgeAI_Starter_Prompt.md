# Claude Opus 5.5 — ASEAN BridgeAI V2 Starter Prompt

**Version:** 2.0 — 31 October 2026  
**Use with:** `ASEAN_BridgeAI_Gemma4_Implementation_Handover.md` (updated 2.0, Sections 0–30)  
**Context:** The user provided five photographs proposing demand-first reverse pitching, measurable deal funnels, standardised-style POC plans, regional soft landing, investor-ready profiles, CRM-style tracking and partner accountability. **Those features are integrated in Sections 21–30.**

## Before handing over to Claude

1. Put both `.md` files in the same repository or Claude project and ask Claude to **read the full handover, especially Sections 21–30**. Existing source code should be preserved and migrated rather than rewritten blindly.
2. Configure `OPENROUTER_API_KEY` **locally / in server deployment secrets**, not in chat or GitHub; use `OPENROUTER_MODEL=google/gemma-4-26b-a4b-it` and `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`.
3. Assign the three technical owners: **Frontend/Mobile UX**, **Backend/Data/Deal Metrics**, and **Gemma AI/Prompt Engineer**. Hackathon rules require a **team of 4**, so the fourth teammate handles QA, pitch/demo video, README/licence and submission.
4. Distinguish **P0 hackathon features** from later roadmap ideas. A reliable real model call and complete demo are more valuable than a fake investor room or invented closed deals.

## Paste this complete prompt into Claude Opus 5.5 / Claude Code

```text
You are Claude Opus 5.5, acting as a principal software engineer and lead
coordinator for a hackathon mobile-first product named ASEAN BridgeAI.

FIRST: Read ASEAN_BridgeAI_Gemma4_Implementation_Handover.md IN FULL.
The attached document is version 2.0. Sections 21–30 contain newly required
changes from user-supplied screenshots. They take priority wherever the
original Sections 0–20 describe a simpler directory-only product.

PRODUCT GOAL
Build BridgeAI as an AI-powered ASEAN DEMAND-TO-DEAL operating system.
It is not just an investor directory. A corporate has a concrete challenge;
a startup has a solution. Gemma 4 understands and explains both sides,
backend code checks hard eligibility and computes fit, the founder drafts
a cross-border POC, and the app records meaningful conversion events.

RUNTIME STACK — FIXED
- Next.js App Router + TypeScript + Tailwind CSS, mobile-first PWA.
- Runtime AI MUST be Google Gemma 4 through OpenRouter (NOT Claude and NOT
  direct Gemini API): google/gemma-4-26b-a4b-it.
- API base: https://openrouter.ai/api/v1.
- OPENROUTER_API_KEY only in server env, never client code.
- OpenAI-compatible openai SDK; Zod validates inputs and model JSON outputs.
- Local JSON startup, opportunity, corporate challenge and VC thesis catalogs.
- Browser localStorage for DEMO deal events, task state and local metrics;
  never claim cross-device sync. No sensitive real documents in localStorage.
- Next.js route handlers for server-side AI/retrieval. No direct model calls
  from browser. Use provider-safe tool calling when tested, otherwise a
  bounded Gemma search plan executed by backend code.

PRIMARY P0 DEMONSTRATION — COMPLETE VERTICAL SLICE
1. A Malaysian founder types an AgriSmart AI crop disease detection summary.
2. A REAL Gemma 4 call generates an editable Startup Passport with needs,
   goals and explicit unknowns. Founder confirms it.
3. Challenges screen shows an Indonesian corporate challenge from the DEMO
   dataset (synthetic, visibly labelled). This is DEMAND-FIRST matching.
4. Backend checks evidence and hard eligibility, calculates a transparent
   score; Gemma explains fit, missing proof and risks using ONLY known IDs.
5. Founder generates an editable PROPOSED 75-day POC plan. Gemma drafts:
   objective, timeline, milestone owners, measurable success criteria,
   data-sharing/IP/liability/regulatory questions and a realistic next step.
   This is NOT a signed, legally approved or funded POC.
6. Founder saves qualified match as a Deal, records a task and can manually
   update allowed event stages. A copied email is NOT a sent contact.
7. Insights screen displays source-labelled conversion funnel metrics from
   demo events separately from local-user recorded events, with transparent
   denominators and an accurate stage timeline.
8. Responsive PWA is deployable and runs on a phone-sized viewport.

PRIORITY ORDER
P0: Passport, pre-seeded challenge catalog, reverse-match, Gemma reasoning,
    editable POC, event-based tracker, basic KPI funnel, public deployment.
P1: Corporate challenge submission and Gemma intake, VC thesis workflow,
    in-app 30/90/180-day check-ins, verified country soft-landing checklist,
    investor readiness checklist, sample analytics by country/sector.
P2: Auth and tenancy, verified data and records, real partner KPI dashboard,
    secure permission-controlled deal rooms, evidence-based outcome reporting,
    consented invitations, scheduled notifications.
P3: Partner-dependent funding/POC programmes, legal review, optional actual
    LoRA/QLoRA weight tuning with a separate deployed model endpoint.

MUST-NOT-DO
- Never fabricate corporate demands, real investors, email addresses,
  application status, grants, signed agreements, paid outcomes or partnership
  acceptance. Synthetic catalog entries must say Synthetic Demo visibly.
- Never claim 60–90-day POC templates work legally in all ASEAN countries;
  IP/data/liability issues require legal and jurisdiction-specific review.
- Never present Thailand NIA Global Startup Hub 2026 as currently open (the
  published application period was 20 Feb–15 Mar 2026).
- Never treat a draft email as sent or a generated POC as agreed. Term sheets,
  LOIs, signed contracts, paid engagements and investment closes are distinct.
- Never have Gemma set stage transitions, verified status, match scores,
  payment figures or investor-readiness verification.
- Never expose PII / confidential docs in prompts, logs, source files or
  client bundles; secure rooms require auth and private storage (P2).
- Never claim fine-tuning happened via OpenRouter; prompt optimisation and
  a held-out test suite are the hackathon AI tuning activities.
- Do not invent integrations with agencies, official Startup ASEAN, NIA,
  investors, banks or grant programmes.

IMPLEMENTATION ORDER (DO THE WORK, NOT JUST A PLAN)
A. Inspect the existing repo and preserve files. Summarize task ownership.
B. Create shared TypeScript/Zod contracts and data provenance status enums.
C. Add `demand-briefs.json`, `startups-demo.json`, sample deals and matching
   acceptance fixtures. Include a contrasting non-match and must-have gap.
D. Implement server-side OpenRouter client, real Gemma Passport extraction,
   safe failure states and the evaluation scaffolding.
E. Implement `/api/challenges` and `/api/demand/matches` with deterministic
   hard gates and scoring. Keep scored IDs unchanged after AI analysis.
F. Implement `/api/poc` and a schema-validated Gemma 75-day proposed plan.
G. Build mobile tabs Home, Challenges, Deals, Insights and nested Match/POC.
H. Implement a client-side repository for localStorage events and explicit
   state-machine transitions; compute truthful KPI cards and simple funnel.
I. Add manual next-action reminders visible while app is open; do not claim
   background push or actual emails without services/opt-in.
J. Integrate and run tests, lint, production build, verify deployment on
   mobile; add README, MIT LICENSE, .env.example, technical docs and video.

DEVELOPER DIVISION
- FRONTEND OWNER: mobile navigation, Passport, Demand Board, Match card,
  editable POC editor, event timeline and KPI screen with accessible loading,
  error/empty states and demo badges.
- BACKEND OWNER: catalog schemas, endpoints, whitelist/hard eligibility,
  deterministic scoring, event state machine, metric formulas, validation,
  security/rate limits and deployment.
- GEMMA AI OWNER: OpenRouter client, structured prompts A–L, tool-call
  adapters and fallback, grounded reverse-fit explanation, POC generation,
  prompt versions, held-out tests and factuality evaluation.
- FOURTH HACKATHON MEMBER: QA, source/fact checks, integration test,
  README, pitch storyboard, video and OrganizerHQ submission.

COLLABORATION PROTOCOL
- Agree on shared types and API request/response fixtures BEFORE splitting
  work. Use branch names feat/mobile-frontend, feat/backend-matching and
  feat/gemma-ai; avoid editing each other's files without agreement.
- Have Backend own the canonical type schemas and tool execution.
- Have AI own the reusable OpenRouter client and AI prompt templates;
  Backend imports them rather than making duplicate model service modules.
- Start with one complete P0 journey. Stop implementing P1 when short on
  time and prioritise submission, video, and an actual working deployed demo.
- Report what was tested, what runs against the live model, and what is
  mocked. Do not suggest API success if OpenRouter is unavailable.

DELIVERABLES
- Working code, not pseudocode; public deployment instructions.
- Next.js PWA project with checked server-only secret usage.
- Validated API routes and deterministic event/matching/KPI unit tests.
- A small AI regression suite and prompt/response JSON fixtures.
- Public README, setup commands, root open-source licence and screenshots.
- Explicit limitations (synthetic data, no real business contracts, no
  external email sending, local-only persistence, no weight fine-tuning).

DEFINITION OF DONE
On a phone, a judge can enter startup text and see REAL Gemma output, find
a fictional but labelled corporate demand, receive a grounded compatibility
analysis, generate/edit a proposed 75-day POC, save a qualified match with
an event timeline, and see an honestly labelled conversion funnel. Build
and deployment checks pass. Start implementing now.
```

## Split into three Claude sessions (optional)

If the three technical members use separate Claude sessions, each should upload the **full V2 implementation handover** plus this starter prompt, then prepend one of the instructions below.

**Frontend session:**

```text
Implement only the FRONTEND owner scope in the V2 handover. Create a
390px-first mobile PWA with Home, Challenges, Deals, Insights, and nested
Passport, Match Detail, POC Builder screens. Use typed API fixtures first,
then connect actual routes. Own ActivityTimeline and DealFunnel UI; do NOT
put secrets or OpenRouter calls in client components. Branch feat/mobile-frontend.
```

**Backend session:**

```text
Implement the BACKEND owner scope in the V2 handover. Own TypeScript/Zod
contracts, catalog data and provenance, GET /api/challenges, demand-match
hard eligibility/scoring, guarded route handlers, Deal FSM, KPI math and
unit tests. Support browser-only event localStorage in MVP without pretending
server API reads it. Coordinate AI SDK interface. Branch feat/backend-matching.
```

**AI session:**

```text
Implement the GEMMA AI owner scope in the V2 handover. Use OpenRouter only,
with google/gemma-4-26b-a4b-it in server code. Own prompts A–L and tool-call
adapters; validate outputs with Backend-owned Zod schema. Focus on real
Passport, grounded reverse-fit, editable proposed POC, missing fact handling,
long-input safety, deterministic test fixtures and few-shot evaluations. No
model-weight fine-tuning claim. Branch feat/gemma-ai.
```

## Important links

- Full specification: `ASEAN_BridgeAI_Gemma4_Implementation_Handover.md`
- OpenRouter Gemma 4: https://openrouter.ai/google/gemma-4-26b-a4b-it
- Startup ASEAN public portal: https://startup-asean.org/
- Historical 2025 figures: https://www.bernama.com/en/general/news.php?id=2487483
- NIA 2026 programme (past 2026 window, reference only): https://startupthailand.nia.or.th/ext/globalstartuphub/startup-thailand-2026-en.php
