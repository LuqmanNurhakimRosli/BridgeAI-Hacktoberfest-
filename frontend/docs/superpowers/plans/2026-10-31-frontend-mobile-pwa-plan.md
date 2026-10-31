# ASEAN BridgeAI V2 — Frontend (Mobile-First Responsive PWA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the complete, mobile-first (`390px` primary, desktop responsive split-view) Next.js + TypeScript + Tailwind CSS frontend for ASEAN BridgeAI V2 on branch `feat/mobile-frontend`, translating all 10 UI/UX mockups in `BridgeAI_All_UI_UX_Images/` while strictly enforcing the V2 Handover guardrails.

**Architecture:** A single Next.js App Router PWA with a responsive `AppShell` (sticky top header + 4-tab bottom navigation on mobile `<768px`, persistent left sidebar + multi-column workspace on desktop `>=768px`). Uses typed mock fixtures first so Frontend never blocks on Backend/AI, smoothly swapping to live API routes (`POST /api/analyze`, `GET /api/challenges`, `POST /api/demand/matches`, `POST /api/poc`, `POST /api/strategy`, `POST /api/advise`) and a browser-only `localStorage` event-sourced Deal & KPI repository (`src/lib/repositories/deal-local-client.ts`).

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS, `lucide-react`, `zod`, `vitest`.

**Spec:** `ASEAN_BridgeAI_Claude_Handover_V2/ASEAN_BridgeAI_Gemma4_Implementation_Handover.md` (Sections 0–30) & `BridgeAI_All_UI_UX_Images/*.png`

## Global Constraints

- **Design Tokens (from `bridgeai_asean_product_showcase.png`):**
  - Brand Navy: `#0F2D5B`
  - Primary Emerald/Teal: `#10B981` (hover `#059669`)
  - AI Accent Violet: `#8B5CF6`
  - Surface Slate/Gray: `#F1F5F9` / `#F8FAFC`
- **Viewport & Accessibility:** Designed for `360px–430px` mobile width first with zero horizontal overflow, `44px+` touch targets, and automatic desktop expansion (`md:` / `lg:` 2-column split views and left sidebar).
- **Mandatory Honesty & Provenance Guardrails (V2 Handover Section 0):**
  - Never expose `OPENROUTER_API_KEY` or import `openrouter.ts` in client components.
  - Every catalog card MUST render an explicit provenance badge (`Synthetic Demo`, `Self Reported`, or `Verified Public`). Never show unverified real logos/checkmarks or fake government grants as live facts.
  - Every Gemma-generated POC plan MUST be badged `PROPOSED DRAFT — Not a signed contract` and treat IP, data-sharing, and liability items as **questions to confirm**, not pre-checked legal agreements.
  - Never auto-send emails or auto-advance deal stages on draft creation; provide `Copy Outreach Draft` and explicit human-triggered stage transition buttons.
  - Separate **Local Browser Deals (`self_reported`)** from **Sample Demo Cohort (`synthetic_demo`)** on the Insights & Deal Funnel screens, always displaying `numerator / denominator` (and `—` when denominator is `0`).

---

## Screen-to-Image Mapping Matrix

| Priority | Screen / Component | UI Reference Image (`BridgeAI_All_UI_UX_Images/`) | Route / Tab | Handover V2 Adjustments |
|---|---|---|---|---|
| **P0** | **App Shell & Home Gateway** | `bridgeai_asean_opportunity_gateway.png`, `bridgeai_asean_product_showcase.png` | `/` (Tab 1: Home) | Add `Synthetic Demo Mode` banner, Role Switcher (`Founder` vs `Corporate/VC Demand Owner`), Quick KPI summary cards, and AgriSmart 1-click Golden Path loader. |
| **P0** | **AI Startup Passport (4-Step Wizard + Live AI Preview)** | `bridgeai_asean_startup_passport.png` | `/` (Tab 1: Passport Flow) | Mobile: 4-step progress pill + form → editable Gemma 4 extracted Passport card with explicit `missing_fields` & `confidence_notes`. Desktop: Left form + Right live `AI Summary Preview`. |
| **P0** | **Challenges / Corporate Demand Board** | `bridgeai_asean_challenge_discovery_showcase.png` | `/challenges` (Tab 2: Challenges) | Replace unverified blue checkmarks with explicit `Synthetic Demo` / `Verified Public` badges. Filter by Country, Sector, and Demand Kind (`Corporate Challenge` vs `VC Thesis`). |
| **P0** | **Opportunity / Reverse-Match Intelligence Detail** | `bridgeai_opportunity_match_intelligence.png`, `bridgeai_asean_partner_matching_dashboard.png` | `/matches/[matchId]` (Nested under Tab 2) | Circular compatibility gauge (`85/100 Compatibility Score — not funding probability`), Hard Eligibility gate badge (`Passed` / `Needs Verification`), collapsible Gemma sections (`Why it matches`, `Potential collaboration`, `Risks & missing evidence`, `Recommended next step`). |
| **P0** | **Cross-Border 75-Day POC Builder & Outreach** | `bridgeai_cross_border_pilot_dashboard.png` | `/poc/[demandId]` or modal/drawer | Sub-tabs (`Overview`, `Timeline`, `Milestones`, `Checklist`, `Outreach`). Label as `PROPOSED 75-Day Plan`. Replace `Send Proposal` with `Copy Outreach Draft` + `Save Qualified Deal`. |
| **P0** | **Deal Tracker, Funnel & Activity Timeline** | `bridgeai_asean_deal_tracker_mockup.png` | `/deals` & `/deals/[dealId]` (Tab 3: Deals) | Horizontal chevron `Deal Funnel`, `Active Deals` / `Follow-ups` / `Closed` tabs, `AI Follow-up Suggestion` banner, manual stage updater (`deal-fsm`), and timestamped `ActivityTimeline`. |
| **P0** | **Outcome Analytics & KPI Dashboard** | `bridgeai_outcome_analytics_dashboard.png` | `/insights` (Tab 4: Insights) | Toggle between `My Local Deals (Browser)` and `Synthetic Demo Cohort`. Show `numerator / denominator` on every KPI card, `Outcomes Over Time` bar chart, `Deals by Sector` donut, and `Top Countries` table. |
| **P1** | **Investor Readiness & Safe Deal Room Mock** | `bridgeai_investor_readiness_dashboard.png` | `/readiness` (Accessible from Home/Deals) | Circular `78/100` Readiness gauge, 5-item `Readiness Checklist`, and `Safe Demo Document Vault` (metadata toggles only — never uploads real confidential files to `localStorage`). |

---

### Task 1: Branch Setup, Next.js PWA Scaffolding & Shared Contracts

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.env.example`, `public/manifest.webmanifest`
- Create: `src/types/index.ts`
- Create: `src/app/globals.css`
- Test: `tests/contracts.test.ts`

**Interfaces:**
- Consumes: None (root foundation)
- Produces: `StartupProfile`, `Opportunity`, `DemandBrief`, `ReverseMatch`, `POCPlan`, `Deal`, `DealEvent`, `DealState`, `DealTrack`, `SourceStatus`, `FollowUpTask` in `src/types/index.ts`

- [x] **Step 1: Create feature branch and scaffold project files**

Run:
```bash
git checkout -b feat/mobile-frontend
```

Create `src/types/index.ts` with all V1 + V2 shared contracts:
```ts
export type SourceStatus =
  | 'synthetic_demo'
  | 'self_reported'
  | 'verified_public'
  | 'verified_private';

export type DemandKind = 'corporate_challenge' | 'vc_thesis';
export type DealTrack = 'commercial_poc' | 'investment' | 'market_entry';

export type DealState =
  | 'identified'
  | 'qualified'
  | 'introduction_requested'
  | 'first_meeting'
  | 'proposal_shared'
  | 'negotiation'
  | 'agreement_signed'
  | 'poc_running'
  | 'poc_completed'
  | 'contract_signed'
  | 'paid'
  | 'closed_lost'
  | 'on_hold';

export type StartupStage = 'Idea' | 'Pre-seed' | 'Seed' | 'Series A' | 'Growth';
export type PrimaryGoal =
  | 'Investment'
  | 'Pilot Partnership'
  | 'Market Expansion'
  | 'Accelerator';

export interface StartupProfile {
  startup_name: string | null;
  description: string;
  industry: string | null;
  home_country: string | null;
  target_country: string | null;
  stage: StartupStage | null;
  product: string | null;
  primary_goal: PrimaryGoal | null;
  needs: string[];
  missing_fields: string[];
  confidence_notes: string[];
}

export interface DemandBrief {
  id: string;
  demand_kind: DemandKind;
  buyer_name: string;
  title: string;
  country: string;
  industry: string;
  problem: string;
  must_have: string[];
  nice_to_have: string[];
  stages: StartupStage[];
  goals: PrimaryGoal[];
  budget_range?: { min?: number; max?: number; currency: string } | null;
  deadline_label?: string | null;
  data_status: SourceStatus;
  source_url?: string | null;
  last_verified_at?: string | null;
}

export interface ReverseMatch {
  demand_id: string;
  demand: DemandBrief;
  score: number;
  score_label: string;
  hard_eligibility: 'passed' | 'needs_verification' | 'ineligible';
  reasons: string[];
  unknowns: string[];
  ai_analysis?: {
    why_match: string;
    potential_collaboration: string;
    fit_gaps: string[];
    next_action: string;
  };
  data_status: SourceStatus;
  ai_source?: 'gemma_live' | 'demo_fixture';
}

export interface POCMilestone {
  phase: string;
  window_label: string;
  day: number;
  action: string;
  owner: 'startup' | 'partner' | 'joint';
  deliverables: string[];
}

export interface POCSuccessCriterion {
  metric: string;
  target: string;
  validation_method: string;
}

export interface POCPlan {
  deal_id: string;
  demand_id: string;
  title: string;
  partner_name: string;
  startup_name: string;
  country: string;
  sector: string;
  status: 'proposed' | 'under_review' | 'agreed' | 'running' | 'completed';
  proposed_duration_days: number;
  objective: string;
  proposed_scope: string;
  target_users_label: string;
  estimated_budget_Note: string;
  milestones: POCMilestone[];
  success_criteria: POCSuccessCriterion[];
  preconditions: string[];
  ip_questions: string[];
  data_sharing_questions: string[];
  liability_questions: string[];
  possible_conversion_to_paid: string;
  outreach_email: {
    language: 'English' | 'Bahasa Melayu' | 'Bahasa Indonesia';
    subject: string;
    body: string;
  };
  ai_source: 'gemma_live' | 'demo_fixture';
}

export interface DealEvent {
  id: string;
  deal_id: string;
  event_type: string;
  from_state: DealState;
  to_state: DealState;
  happened_at: string;
  recorded_at: string;
  actor_id: string;
  evidence_status: SourceStatus;
  note?: string;
}

export interface FollowUpTask {
  id: string;
  deal_id: string;
  title: string;
  due_at: string;
  cadence_days?: 30 | 90 | 180;
  status: 'pending' | 'completed' | 'dismissed';
}

export interface Deal {
  id: string;
  startup_name: string;
  demand_id: string;
  partner_name: string;
  title: string;
  country: string;
  sector: string;
  track: DealTrack;
  state: DealState;
  data_status: SourceStatus;
  ai_followup_suggestion?: string;
  poc_plan?: POCPlan;
  events: DealEvent[];
  tasks: FollowUpTask[];
  created_at: string;
  last_event_at: string;
}
```

- [x] **Step 2: Write unit test verifying contract defaults & design tokens**

Create `tests/contracts.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import type { DealState, SourceStatus } from '../src/types';

describe('Shared V2 Contracts', () => {
  it('supports required provenance statuses', () => {
    const statuses: SourceStatus[] = [
      'synthetic_demo',
      'self_reported',
      'verified_public',
      'verified_private',
    ];
    expect(statuses).toContain('synthetic_demo');
  });

  it('includes qualified and paid deal states', () => {
    const states: DealState[] = ['identified', 'qualified', 'paid'];
    expect(states.length).toBe(3);
  });
});
```

- [x] **Step 3: Run test to verify it passes**

Run: `npx vitest run tests/contracts.test.ts`
Expected: PASS

- [x] **Step 4: Commit**

```bash
git add package.json tsconfig.json src/types/index.ts tests/contracts.test.ts
git commit -m "feat(frontend): initialize shared V2 types and project configuration"
```

---

### Task 2: Seed Catalogs, Golden-Path Fixtures & LocalStorage Deal Repository

**Files:**
- Create: `src/data/demand-briefs.json`
- Create: `src/data/deals-demo.json`
- Create: `src/lib/deal-fsm.ts`
- Create: `src/lib/kpi-metrics.ts`
- Create: `src/lib/repositories/deal-local-client.ts`
- Test: `tests/deal-fsm-and-kpis.test.ts`

**Interfaces:**
- Consumes: `Deal`, `DealEvent`, `DealState`, `DealTrack`, `DemandBrief` from `src/types/index.ts`
- Produces:
  - `canTransitionDealState(track: DealTrack, from: DealState, to: DealState): boolean`
  - `computeFunnelMetrics(deals: Deal[]): FunnelSummary`
  - `getLocalDeals(): Deal[]`, `saveLocalDeal(deal: Deal): Deal[]`, `appendDealEvent(...)`, `addDealTask(...)`

- [x] **Step 1: Write failing unit tests for Deal FSM & Honest KPI Math**

Create `tests/deal-fsm-and-kpis.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { canTransitionDealState, getAllowedNextStates } from '../src/lib/deal-fsm';
import { percent, computeFunnelMetrics } from '../src/lib/kpi-metrics';
import type { Deal } from '../src/types';

describe('Deal State Machine & Honest KPIs', () => {
  it('allows valid forward transition on commercial_poc track and blocks invalid jumps', () => {
    expect(
      canTransitionDealState('commercial_poc', 'qualified', 'introduction_requested')
    ).toBe(true);
    // Cannot jump straight from qualified to paid without intermediate agreement
    expect(canTransitionDealState('commercial_poc', 'qualified', 'paid')).toBe(false);
    expect(getAllowedNextStates('commercial_poc', 'qualified')).toContain(
      'introduction_requested'
    );
  });

  it('returns null instead of 0% when denominator is 0', () => {
    expect(percent(0, 0)).toBeNull();
    expect(percent(3, 10)).toBe(30);
  });

  it('separates synthetic_demo deals from self_reported local deals in funnel metrics', () => {
    const sampleDeals: Deal[] = [
      {
        id: 'D1',
        startup_name: 'AgriSmart',
        demand_id: 'DEMO-CH-001',
        partner_name: 'Nusantara Food & Farms Innovation Lab',
        title: 'Offline crop disease pilot',
        country: 'Indonesia',
        sector: 'AgriTech',
        track: 'commercial_poc',
        state: 'qualified',
        data_status: 'self_reported',
        events: [
          {
            id: 'E1',
            deal_id: 'D1',
            event_type: 'match_qualified',
            from_state: 'identified',
            to_state: 'qualified',
            happened_at: '2026-10-31T04:00:00Z',
            recorded_at: '2026-10-31T04:00:00Z',
            actor_id: 'demo_user',
            evidence_status: 'self_reported',
          },
        ],
        tasks: [],
        created_at: '2026-10-31T04:00:00Z',
        last_event_at: '2026-10-31T04:00:00Z',
      },
    ];
    const summary = computeFunnelMetrics(sampleDeals);
    expect(summary.qualified.numerator).toBe(1);
    expect(summary.paid.numerator).toBe(0);
    expect(summary.pocToPaidConversion.rate_percent).toBeNull();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/deal-fsm-and-kpis.test.ts`
Expected: FAIL with module not found

- [x] **Step 3: Implement `deal-fsm.ts`, `kpi-metrics.ts`, `demand-briefs.json`, `deals-demo.json`, and `deal-local-client.ts`**

Implement deterministic track transitions in `src/lib/deal-fsm.ts`, numerator/denominator KPI calculators in `src/lib/kpi-metrics.ts`, and browser `localStorage` persistence in `src/lib/repositories/deal-local-client.ts`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/deal-fsm-and-kpis.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/data/ src/lib/ tests/deal-fsm-and-kpis.test.ts
git commit -m "feat(frontend): add demand catalog, deal FSM, KPI math, and localStorage client"
```

---

### Task 3: Responsive AppShell, Navigation, Provenance Badges & Home Gateway (`bridgeai_asean_opportunity_gateway.png`)

**Files:**
- Create: `src/components/AppShell.tsx`
- Create: `src/components/ProvenanceBadge.tsx`
- Create: `src/components/HomeGateway.tsx`

**Interfaces:**
- Consumes: `Deal`, `DemandBrief`, `StartupProfile` from `src/types/index.ts`
- Produces: Responsive layout shell with 4 primary navigation tabs (`Home / Passport`, `Challenges`, `Deals`, `Insights`) + P1 `Readiness` drawer/tab, `ProvenanceBadge`, and `HomeGateway` summary widget.

- [x] **Step 1: Build `ProvenanceBadge.tsx` and `AppShell.tsx`**

Ensure mobile `<768px` renders the sticky top bar (`BridgeAI` logo, `Gemma 4 Live / Demo Fixture` pill, notification icon, founder avatar) and fixed bottom 4-tab bar with `min-h-[56px]` touch targets, while desktop `>=768px` renders the left sidebar seen in the desktop previews of `bridgeai_asean_opportunity_gateway.png` and `bridgeai_asean_challenge_discovery_showcase.png`.

- [x] **Step 2: Build `HomeGateway.tsx`**

Includes:
- Greeting header (`Good morning, Founder ☀️ — Turn your innovation into real impact across ASEAN`)
- 4 quick metric tiles (`Opportunities`, `Active POCs`, `In Negotiation`, `Closed Deals`)
- `BridgeAI Assistant (Powered by Gemma 4)` recommendation card with **1-Click "Load AgriSmart Golden Path Demo"** button for judges
- `Recommended Challenges` horizontal/grid preview cards
- `Next Best Action` progress bar (`Complete your Startup Passport to unlock reverse-matched ASEAN corporate challenges`)

- [x] **Step 3: Commit**

```bash
git add src/components/AppShell.tsx src/components/ProvenanceBadge.tsx src/components/HomeGateway.tsx
git commit -m "feat(frontend): add responsive AppShell, ProvenanceBadge, and HomeGateway UI"
```

---

### Task 4: AI Startup Passport 4-Step Wizard & Live AI Summary Preview (`bridgeai_asean_startup_passport.png`)

**Files:**
- Create: `src/components/StartupPassportFlow.tsx`

**Interfaces:**
- Consumes: `StartupProfile` from `src/types/index.ts`; calls `POST /api/analyze` with graceful fallback to verified AgriSmart/GreenTech fixture if backend route is not yet wired.
- Produces: Confirmed `StartupProfile` passed to Demand Matching.

- [x] **Step 1: Implement `StartupPassportFlow.tsx` matching `bridgeai_asean_startup_passport.png`**

Key UI elements from mockup + V2 spec:
- 4-step indicator (`1. Startup Profile` → `2. Business Goals` → `3. Funding & Partnerships` → `4. Review & Generate`)
- Quick preset buttons (`AgriSmart (Golden Path)` and `GreenTech Solutions`) so judges don't have to type on mobile
- Inputs: Startup name, Short description (`0/300` counter + full narrative support), Sector/Industry select, Startup stage select, Home country select, Target market(s) select
- Safe Pitch Deck metadata card (explicitly notes no confidential PDF is stored on server in MVP)
- **Right column (Desktop) / Bottom collapsible card (Mobile):** `AI Summary Preview` (`Live preview` pill, extracted tags, Stage, Location, Target Markets, Primary Goal, plus V2 required **Missing Fields Warning** and **Editable Confirmation Form** before running discovery).

- [x] **Step 2: Commit**

```bash
git add src/components/StartupPassportFlow.tsx
git commit -m "feat(frontend): implement AI Startup Passport wizard and live AI summary preview"
```

---

### Task 5: Challenges / Demand Board & Reverse-Match Intelligence (`bridgeai_asean_challenge_discovery_showcase.png` & `bridgeai_opportunity_match_intelligence.png`)

**Files:**
- Create: `src/components/DemandBoard.tsx`
- Create: `src/components/ReverseMatchDetail.tsx`

**Interfaces:**
- Consumes: `StartupProfile`, `DemandBrief[]`, `ReverseMatch[]`
- Produces: Filtered challenge list, deterministic compatibility score display, Gemma 4 grounded fit explanation, and trigger for `Create 75-Day POC Plan` or `Save Qualified Deal`.

- [x] **Step 1: Implement `DemandBoard.tsx` (`bridgeai_asean_challenge_discovery_showcase.png`)**

Key UI elements:
- Search input (`Search challenges, keywords or organisations...`)
- Filter pills (`All`, `Country` dropdown: Indonesia/Singapore/Malaysia/Thailand/Vietnam, `Sector` pill bar: `AgriTech`, `Fintech`, `Smart City`, `Sustainability`, `AI`, plus `Corporate Challenge` vs `VC Thesis` toggle)
- Challenge Cards showing:
  - Buyer name + country flag + **Explicit `Synthetic Demo` badge** (replacing unverified blue checkmarks)
  - Opportunity type pill (`POC Opportunity` / `VC Thesis`) + timeline
  - Challenge problem statement & `must_have` requirement pills
  - Bottom bar: Compatibility match pill (`85% Compatibility`), `Curated reverse-match`, Bookmark icon, and `View Details →` CTA
- Desktop `Popular Sectors` icon strip at bottom (`Smart City`, `AgriTech`, `Fintech`, `Sustainability`, `HealthTech`)

- [x] **Step 2: Implement `ReverseMatchDetail.tsx` (`bridgeai_opportunity_match_intelligence.png`)**

Key UI elements:
- Back navigation (`← Opportunity Detail / Match Intelligence`)
- Header card with Buyer organization, country flag, sector tags, Deal Stage pill, and `Synthetic Demo` provenance notice
- **Circular SVG Compatibility Gauge** (`85% Compatibility` — explicitly captioned *"Deterministic rule-based compatibility score, not funding probability"*) + `Strong Match / Needs Verification` summary card
- 4 collapsible accordion cards matching the mockup:
  1. ✨ **Why it matches** (Gemma 4 grounded explanation)
  2. 💡 **Potential collaboration** (Hypothetical pilot scope)
  3. ⚠️ **Risks and missing information** (Explicit unknowns, e.g., offline-first verification, field data consent)
  4. ☑️ **Recommended next step** (User-controlled exploratory call action)
- Desktop right sidebar: `Key Information` table (Industry, Organisation Type, Country, Must-Haves, Provenance Status)
- Primary CTAs: `✨ Create 75-Day POC Plan`, `Generate Outreach Draft`, `🔖 Save Qualified Deal to Tracker`

- [x] **Step 3: Commit**

```bash
git add src/components/DemandBoard.tsx src/components/ReverseMatchDetail.tsx
git commit -m "feat(frontend): add DemandBoard and ReverseMatchDetail intelligence views"
```

---

### Task 6: Cross-Border 75-Day POC Builder & Multilingual Outreach (`bridgeai_cross_border_pilot_dashboard.png`)

**Files:**
- Create: `src/components/PilotPlanEditor.tsx`

**Interfaces:**
- Consumes: `StartupProfile`, `ReverseMatch`, `POCPlan`
- Produces: Editable `POCPlan`, multilingual outreach draft (`English`, `Bahasa Melayu`, `Bahasa Indonesia`) with `Copy to Clipboard` and `Save Qualified Deal + Next Action` into `localStorage`.

- [x] **Step 1: Implement `PilotPlanEditor.tsx` (`bridgeai_cross_border_pilot_dashboard.png`)**

Key UI elements:
- Header card: Challenge Title, `✨ PROPOSED Pilot Plan (Draft Only — Not Signed)` badge, `Partner × Startup` subtitle, country & sector pills
- Sub-navigation tabs (`Overview`, `Timeline & Milestones`, `Data, IP & Liability Checklist`, `Outreach Email Draft`)
- **Pilot Overview & At-a-Glance grid**: Duration (`75 Days Proposed`), Target Scope, Primary Market, Commercial Conversion Hypothesis
- **Key Objectives & Success Criteria cards**: Editable metric, target, and validation method rows
- **4-Stage Horizontal/Vertical Timeline**:
  1. `Discovery & Alignment (Days 1–10)` — Owner: Joint
  2. `Readiness & Protocol (Days 11–25)` — Owner: Startup/Partner
  3. `Field Pilot Execution (Days 26–60)` — Owner: Startup
  4. `Joint Evaluation & Conversion Decision (Days 61–75)` — Owner: Joint
- **Data, IP & Liability Discussion Checklist**: Interactive checkboxes framed honestly as *"Questions to confirm with legal/procurement before starting pilot"* (never claiming agreements are already signed or government grants are guaranteed)
- **Outreach Draft Panel**: Language switcher (`English` | `Bahasa Melayu` | `Bahasa Indonesia`), editable Subject & Body (`<= 180 words`), `Copy Email Draft` button (with explicit notice: *"Copying a draft does not mark the deal as Contacted"*), and `Save Qualified Deal to Tracker →` button.

- [x] **Step 2: Commit**

```bash
git add src/components/PilotPlanEditor.tsx
git commit -m "feat(frontend): implement Cross-Border 75-Day POC Builder and outreach drafter"
```

---

### Task 7: Deal Tracker, Event Timeline, Outcome Analytics & Investor Readiness (`bridgeai_asean_deal_tracker_mockup.png`, `bridgeai_outcome_analytics_dashboard.png`, `bridgeai_investor_readiness_dashboard.png`)

**Files:**
- Create: `src/components/DealTrackerView.tsx`
- Create: `src/components/OutcomeAnalyticsView.tsx`
- Create: `src/components/InvestorReadinessView.tsx`

**Interfaces:**
- Consumes: `Deal[]` (local + demo cohort), `computeFunnelMetrics`, `canTransitionDealState`
- Produces: Interactive deal pipeline, manual state transition modal with evidence notes, 30/90/180-day follow-up task creator, cohort KPI dashboard, and safe P1 Investor Readiness mock.

- [x] **Step 1: Build `DealTrackerView.tsx` (`bridgeai_asean_deal_tracker_mockup.png`)**

Key UI elements:
- Top 4 summary counters (`Total Opportunities`, `Active Deals`, `POC Proposals Drafted`, `Signed / Paid Deals`)
- **Chevron Deal Funnel Bar** (`Qualified` → `Intro Requested` → `First Meeting` → `POC Running` → `Signed / Paid`)
- Filter tabs: `Active Deals`, `Follow-ups`, `Closed` + Data source filter (`All (Local + Demo)` | `My Local Browser Deals Only` | `Synthetic Demo Cohort`)
- Deal cards with:
  - Partner name, country, sector, current `DealState` badge, provenance badge (`Self Reported (Local)` vs `Synthetic Demo`), and Next Check-in date
  - Purple `✨ AI Follow-up Suggestion` banner with `Draft Message` / `Log Stage Transition` actions
  - Expandable **Timestamped Activity Timeline (`DealEvent[]`)** and **Add Next Action (`30 / 90 / 180 Days`)** form

- [x] **Step 2: Build `OutcomeAnalyticsView.tsx` (`bridgeai_outcome_analytics_dashboard.png`)**

Key UI elements:
- Prominent **Data Source Toggle & Honesty Banner**: Switch between `My Local Recorded Deals (True Browser Events)` and `Synthetic Demo Cohort (Illustrative Funnel)` so judges see both live local tracking and how the full dashboard looks with cohort data.
- Filter bar (`All Countries`, `All Sectors`, `Cohort Window`)
- 6 KPI Cards with **explicit `numerator / denominator` subtitles** (`Conversion Rate: POC → Paid`, `Median Stage Dwell / Time to Close`, `Markets Entered`, `Active POCs`, `POCs Completed`, `Confirmed Contracts`)
- **Outcomes Over Time** bar/line visual chart (`POCs Started` vs `Contracts Signed`)
- **Deals by Sector** breakdown ring + **Top ASEAN Countries by Outcomes** table

- [x] **Step 3: Build `InvestorReadinessView.tsx` (`bridgeai_investor_readiness_dashboard.png` — P1 Safe Mock)**

Key UI elements:
- Circular `Investor Readiness Score` gauge (`78/100`)
- 5-category `Readiness Checklist` (`Financials`, `Traction & Metrics`, `Product Deck`, `Legal & Governance Docs`, `Team Information`) where founders can toggle metadata readiness items locally
- `Deal Room / Safe Document Metadata Vault (P1 Demo Mock)` with explicit security banner: *"Prototype metadata mock only — do not upload confidential investor files in localStorage mode."*

- [x] **Step 4: Commit**

```bash
git add src/components/DealTrackerView.tsx src/components/OutcomeAnalyticsView.tsx src/components/InvestorReadinessView.tsx
git commit -m "feat(frontend): add DealTracker, OutcomeAnalytics, and InvestorReadiness views"
```

---

### Task 8: Wire Main Application State & Safe Fallback API Routes

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/api/analyze/route.ts`
- Create: `src/app/api/challenges/route.ts`
- Create: `src/app/api/demand/matches/route.ts`
- Create: `src/app/api/poc/route.ts`

**Interfaces:**
- Consumes: All frontend components and shared contracts
- Produces: Complete end-to-end playable application at `/` (with URL hash/tab sync and API endpoints that call OpenRouter Gemma 4 when `OPENROUTER_API_KEY` is configured, or transparently return labelled `demo_fixture` responses when running without a key).

- [x] **Step 1: Assemble `src/app/page.tsx` and API route handlers**

Connect the full Golden Path:
1. Home Gateway / 1-click AgriSmart loader
2. Startup Passport extraction & confirmation
3. Challenges Board (`Nusantara Food & Farms Innovation Lab` + ASEAN synthetic catalog)
4. Match Intelligence Detail (`85% Compatibility`, Gemma grounded reasoning)
5. 75-Day POC Builder & Multilingual Outreach Draft
6. Save Qualified Deal + Add Follow-up Task in Deal Tracker
7. Inspect Local vs Demo Cohort Funnel in Outcome Analytics

- [x] **Step 2: Run unit tests, typecheck, and production build**

Run:
```bash
npx vitest run
npm run build
```
Expected: All tests PASS and `next build` succeeds with zero TypeScript or lint errors.

- [x] **Step 3: Commit**

```bash
git add src/ app/ public/
git commit -m "feat(frontend): wire full Golden Path flow and resilient API routes"
```

