# BridgeAI — Preliminary UI/UX Audit and Competitor Benchmark Brief

**Prepared:** 31 October 2026  
**Assessment type:** Preliminary visual/concept audit plus verified public competitor feature comparison  
**Inputs:** 10 AI-generated BridgeAI UI concept images and V2 handover Markdown  
**IMPORTANT LIMITATION:** The local BridgeAI application's source code, running app, API behaviours, authentication, security and real-user tests were **not** provided to this preliminary assessment. This is **not** a verified production-readiness audit; the local Claude agent must conduct those tests using the attached master prompt.

## 1. Executive perspective

The BridgeAI concepts show a strong product narrative: moving startups from regional opportunity **discovery** to a **qualified match**, **human-approved POC / proposal**, **recorded follow-up**, and **measurable outcomes**. This is a more distinct direction than another ASEAN startup directory.

However, the current collection of **illustrative images** is closer to a polished concept deck than a testable end-user product design. The designs sometimes mix a marketing-poster layout with functional app controls and display sample company names/logos, expired dates and achievements in ways that would be inappropriate for a real deployed product without verification. There is also variation in nav structure and page labels between mockups, raising a strong risk of fragmented information architecture.

**Preliminary recommendation:** Build one clear founder mobile journey and a consistent design system first. Use official-source-backed opportunity records, transparent AI scoring, and honest deal states. Do not expose an investor deal room or display 'secure', 'verified', 'closed', 'sent', grant amount, or signed-contract statuses without actual supporting infrastructure and evidence.

**Release readiness verdict:** `NOT ASSESSED — implementation unavailable`. Do not claim a live production-ready release on the basis of these mockups.

## 2. Evidence-based preliminary findings from concept images

These observations are about **illustrated UI content**, not claims of real software defects.

| ID | Image(s) | Preliminary observation | Why this matters to founders | Proposed improvement | Priority if also true in the running app |
|---|---|---|---|---|---|
| UI-01 | All ten | Navigation labels and number of bottom tabs change between screens, e.g. Opportunities / Challenges / Matches / Deals / POCs / Deal Room / Insights. | A busy founder can lose track of where tasks live. | One canonical mobile 4-tab IA: Home, Discover, My Deals, Profile; advanced subviews are contextual. | P1 |
| DATA-01 | Challenges, Match Results, Opportunity Detail, POC Builder | Corporate examples, application deadlines, grant/budget figures, verification checks and logos appear in illustrative cards; some deadlines explicitly show 2025. | May lead founders to treat old or synthetic opportunities as current and verified. | Tag fixture/demo vs official sourced; remove invented links/logos; show `source`, `last checked`, status and expiration. | P0 if publicly represented as live |
| DATA-02 | Home, Deal Tracker, Analytics | Numerical outputs such as 12 opportunities, 5 POCs, 2 closed deals, success trend percentages and millions in contracts are illustrated without visible calculation provenance. | Creates false impact claims. | Generate metrics from recorded auditable events; show `Demo data` prominently for seed metrics; show empty state otherwise. | P0 if reported as genuine |
| TRUST-01 | Investor Readiness | 'Bank-level security', secure sharing and activity logs are visually advertised in the mockup. | Confidential pitch decks and cap tables are sensitive. | Hide these promises until tested private file storage, server-side RBAC and audited access control exist. | P0 |
| TRUST-02 | Opportunity Detail, POC Builder | 'Generate Proposal', 'Send Proposal', 'Create POC Plan' are visually adjacent without a clear distinction between draft and authorised outbound action. | Founders may believe an email was sent or a partnership formed. | Use explicit states: Draft → Reviewed → Copied/Shared → Sent (confirmed) → Responded → Signed (verified); never infer an external action. | P0 if misleading in app |
| UX-01 | Challenges, Matches, Tracker, Analytics | Long cards, multiple badges, dense microcopy and complex charts may be difficult to scan on a 360px screen. | Small fonts and high cognitive load reduce task completion. | Prioritise one decision/action per card; collapse secondary metadata; use drill-down mobile charts; test at 320–414px and 200% zoom. | P1 |
| UX-02 | Startup Passport | Multi-step onboarding displays many fields simultaneously, some repeated in AI preview; upload and manual entry routes could conflict. | Increases early abandonment. | Start from 1 free-text question; show AI-extracted editable summary; ask only essential missing information; autosave drafts. | P1 |
| UX-03 | Matching | Big '92% Match' scores are prominent, but score meaning/eligibility and evidence are less prominent than score itself. | A founder may read scores as probability of funding. | Label `Compatibility score` + breakdown, eligibility gate, source and unknowns; never imply likelihood of getting investment. | P1 |
| UX-04 | Deal tracker | The concept combines a many-stage funnel, multiple tabs, summary tiles, reminder rows and large cards on one phone screen. | It may conceal the next best action. | Top of screen should answer `What needs action today?`; show overdue tasks and 1 CTA, then progress and details. | P1 |
| UX-05 | POC Builder | A dense six-tab POC screen with objectives, timeline, legal checklists and budget may overwhelm a first-time founder. | The founder needs to understand draft feasibility quickly. | Mobile summary first; progressive `Timeline`, `Success Criteria`, `Risks`, `Budget`, `Review`; draft status and human review clearly indicated. | P1 |
| UX-06 | Analytics | Full-size multi-series graphs, doughnut charts and country tables are shown on mobile without an obvious hierarchy for a founder. | Less useful than a concise personal health/action summary. | Founder analytics: 3 meaningful KPI cards and drill-down; ecosystem aggregate analytics are admin/reporting views. | P2 |
| DESIGN-01 | All ten | UI showcases use decorative skyline imagery and background promotion around task screens. | A marketing campaign design is not the same as an ergonomic working interface. | Keep brand illustrations on landing/onboarding only; task screens have clean space, large touch targets and accessible contrast. | P2 |
| TRUST-03 | Country/Market features | UI suggests regional grant support and regulatory/compliance confidence without showing primary documentation. | Cross-border regulatory errors can lead to bad decisions. | Source-backed country checklists with date, jurisdiction and `not legal advice` disclaimer; no automatic 'eligible' label without rules. | P0/P1 depending on live claims |
| UX-07 | AI UI, all screens | AI 'assistant' badges and copy do not automatically demonstrate useful real model behaviours. | Judges/customers need specific evidence of what Gemma actually contributes. | Document real Gemma calls, source-grounded fit explanation, editable POC generation and failures; add 'How this was generated'. | P1 |

## 3. Competitor benchmarks: verified public capabilities

These are **feature descriptions evidenced by publicly available official product pages**, not hands-on usability scores. Ask the local agent to inspect public current interfaces where possible and explicitly mark inaccessible flows.

| Product | Relevant verified public features | What BridgeAI should learn | BridgeAI's differentiated opportunity | Primary evidence |
|---|---|---|---|---|
| **Startup ASEAN** | Official regional portal provides startup ecosystem listings and regional programmes/partners; its own FAQ describes public database exploration and phased feature rollout. | Reliable ecosystem taxonomy, filters, sources and cross-country context. | From opportunity discovery to recorded proposal, POC and outcome evidence. | https://startup-asean.org/ and https://startup-asean.org/faq |
| **Dealroom** | Global startup/investor database, company data, discovery, ecosystem mapping and investor matching support; information uses sources, partnerships and research verification. | Consistent organisation records, source provenance, advanced filters and rich profiles. | Founder-ready actions and POC conversion, not just intelligence mapping. | https://knowledge.dealroom.co/knowledge/what-is-dealroom.co and https://dealroom.co/about/ |
| **F6S** | Public startup programmes directory with search/filter categories, locations and application dates. | Time-sensitive programme filters, deadline and eligibility visibility. | Explainable match + concrete outreach + continuous deal follow-through. | https://www.f6s.com/programs |
| **OpenVC CRM** | Fundraising CRM with pipeline, investor interactions, tasks, notes, follow-ups, investor-list import and pitch-deck tracking according to its official product page. | Clear founder-oriented deal pipeline and explicit next actions. | ASEAN cross-border corporate POCs and government challenges in addition to fundraising. | https://www.openvc.app/CRM |
| **Foundersuite Investor CRM** | Custom investor funnel stages; tasks, to-dos, files and team collaboration according to product description. | Pipeline progression, owner and last interaction date, task reminders, team collaboration. | Demand-first corporate matching, POC templates and regional outcome accountability. | https://www.foundersuite.com/features/investor_crm_software |
| **HubSpot** | CRM combines contacts, tasks, deals, pipeline stages, reporting; sales AI can draft follow-ups and recommend next actions, subject to product tier. | Reusable activity timeline, explicit lifecycle states, owner permissions, editable AI suggestions. | Lightweight founder-mobile ASEAN demand-to-deal operating system instead of general-purpose sales CRM. | https://www.hubspot.com/products/crm and https://www.hubspot.com/products/crm/pipeline-management and https://www.hubspot.com/products/sales/deal-progression |

**Do not assert that BridgeAI is superior to these tools without comparative user-task testing and real functional evidence.** More features does not equal better UX.

### Notable product-positioning insight

A credible BridgeAI tagline is **"Discover real ASEAN challenges, understand your fit, propose a pilot, and follow through."** This unites the currently fragmented user journey and is testable. Avoid broad "one platform for everyone" messaging that masks the primary founder task.

## 4. UX improvement recommendations by screen

**Home**
- Primary block: 'You have 2 next actions' with a concise one-sentence Gemma suggestion; show 1–3 matched challenges, not a long generic dashboard.
- Keep four KPI cards only if they represent the user's actual recorded data. Else `Create Startup Passport` and `Explore demo` CTA.

**AI Startup Passport**
- Ask for startup goal in natural language, then generate editable passport with confirmed vs unknown fields; preserve a draft.
- Split essential data (business, sector, country, objective) from optional funding/target-market details.
- Upload is optional and off until secure content processing is implemented. Clearly display retention/processing notice.

**Discover**
- Default to `For You` and `All Opportunities` switch, not many permanent pages. Distinguish corporate challenge, grant, accelerator and investor thesis.
- Show eligibility and active deadlines at top of cards. Add source and `last verified` labels; a demo record must not wear a genuine verification check.
- Phone filters via bottom sheet, with chips showing active selections and a one-tap `Clear filters`.

**Match Details**
- Above fold: title, country, deadline, verified/source state, eligibility outcome, top 3 reasons, `View requirements` and primary action `Prepare proposal`.
- Compatibility score detail explains factors and weights; risks/missing evidence below fold, with collapsible sections.

**POC Planner**
- Draft status banner; compact 4-step preview (Scope, Setup, Pilot, Evaluate), measurable KPIs and owners; export/share as a human-reviewed proposal only.
- Move legal/IP/privacy terms into 'Questions to resolve' until counsel/partner confirms.

**Deal Tracker**
- Primary sort: overdue / due today / upcoming actions. One deal card answers 'Who? At what stage? What is due?'.
- Timestamps/events distinguish manually recorded status, sent message, meeting occurred and signed agreement.
- Show archived and lost deals as first-class states (not only 'closed deal').

**Analytics**
- Personal founder metrics: qualified matches, contacted, meetings, pilot proposals and confirmed paid outcomes. Ecosystem KPI drill-down for managers/admins only.
- Label cohort, period and currency; source every figure from deal events; do not invent trend arrows.

**Investor readiness and data room**
- Readiness checklist may be delivered as a lightweight assessment. Document room must stay hidden/disabled until security architecture is implemented and tested.

## 5. Mandatory production-readiness work (concept-stage recommendation)

| Gate | Requirement | Verification |
|---|---|---|
| Source truth | A reproducible source-backed opportunity lifecycle | Record URLs, timestamps, official status and expiry tests |
| Authentication | Account identity, session and safe recovery | Login/logout/reset flows and session tests |
| Authorisation | Organization separation / least privilege | Attempt cross-account reads/edits on every API |
| Private docs | Secure upload, private storage, signed links, retention | File-handling security tests, no public URLs for pitch decks |
| AI correctness | Gemma runtime validation + 30+ eval cases | Grounding/JSON accuracy, hard-eligibility tests, injection cases |
| UX mobile | 320–414px plus 768/1024/1440, voiceover and keyboard | Screenshots, axe/WCAG 2.2 AA, actual-device smoke test |
| Metrics | Documented denominators, audited stages, money by currency | Event-based automated tests and report reconciliation |
| Reliability | Error, loading and offline recovery; observability | E2E tests, Lighthouse/Core Web Vitals, failure injection |
| Deployment | Staging/production separation, CI, rollback, backup | Deploy/rollback smoke tests |
| Legal/privacy | Consent, privacy notice, retention and local jurisdiction review | Written policy and legal/compliance review |

### Three-owner prioritised implementation roadmap (provisional)

**Owner 1 — Frontend & UX**
1. Canonical nav and founder journey / state hierarchy.
2. Reusable accessible component library and mobile screen redesign.
3. Empty/loading/error/draft/offline states and keyboard/screen-reader verification.
4. Device screenshot regression and browser E2E tests.

**Owner 2 — Backend, Data & Security**
1. Source record schema and status validation, auth/tenant boundaries.
2. Deal event log, honest stage transitions, KPI formulas.
3. Protected file storage only if releasing a real data room.
4. Rate limits, validation, CI/deploy, logs and backup/restore.

**Owner 3 — Gemma / AI Engineering**
1. Trace live OpenRouter Gemma calls and enforce source-grounded outputs.
2. Version prompts, validate structured results and tools, bound context/cost.
3. Build 30+ examples and evaluate correctness, prompt injection, latency.
4. Improve passport, explainable matching, editable POC proposal and recovery states.

**Release phases:**
- **Demo / research:** synthetic records explicitly identified; no real secret documents; local demo flows.
- **Controlled beta:** verified opportunities, user consent, signed-in user profiles, robust status event model, tested mobile UX and safe AI workflows.
- **Production:** all critical security/privacy/data truth gates, multi-tenant isolation, tested file controls if enabled, backups, monitoring, audited accuracy, real users and support process.

## 6. External standards

- WCAG 2.2 AA — https://www.w3.org/TR/wcag/
- Mobile accessibility checklist — https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Mobile_accessibility_checklist
- Progressive Web App checklist — https://web.dev/articles/pwa-checklist
- Core Web Vitals — https://web.dev/articles/vitals
- OWASP ASVS — https://asvs.owasp.org/
- OpenRouter tool-calling overview — https://openrouter.ai/blog/tutorials/tool-calling/

**Next step:** Run the master prompt against your actual local repository. The agent should preserve and extend this report with code/live evidence, screenshots, measured results, competing systems, and a defensible release decision. This preliminary report is a starting hypothesis, not a certification.
