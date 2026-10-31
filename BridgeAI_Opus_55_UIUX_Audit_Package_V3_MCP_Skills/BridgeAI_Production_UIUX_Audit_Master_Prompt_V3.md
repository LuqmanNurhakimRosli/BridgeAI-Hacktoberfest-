# BridgeAI — Production UI/UX, Feature, Competitor & Release-Readiness Audit

**For:** Claude Opus 5.5 in the local coding environment  
**Project:** ASEAN BridgeAI / BridgeAI — mobile-first founder demand-to-deal platform  
**Prepared:** 31 October 2026  
**Mode:** Independent audit first; improve only after evidence, prioritisation and safeguards  
**Status:** V3 tool-assisted independent audit instructions (NOT an assertion that the current implementation is production-ready)

> **How to use:** Put this file at the repository root as `AUDIT_PROMPT.md`, place the prior handover files and design images in an accessible `references/` directory, open the repository in Claude Code / your local Claude agent, and paste **Section A** into the agent. If the repository has only mockups and no running application, have the agent audit them as designs, clearly label implementation gaps as **not yet verified**, and produce a build plan rather than pretending tests passed.

---

# A. PASTE THIS PROMPT INTO YOUR LOCAL CLAUDE AGENT

You are **Claude Opus 5.5**, acting simultaneously as:

1. Principal Product Designer and UX Researcher with expertise in mobile-first B2B SaaS, ASEAN startup founder workflows and conversion-oriented interfaces.
2. Senior Frontend Architect (Next.js, React, TypeScript, Tailwind, responsive PWA).
3. Backend / Security / Production Readiness Reviewer.
4. Applied AI Product Auditor (Gemma 4 served via OpenRouter, grounded matching, prompt injection defence, measurable quality).
5. Competitive Research Analyst, focused on verified official product capabilities, not superficial visual imitation.

**Your task is to FIRST inventory all available MCP servers, plugins, skills, browser tools and subagents; THEN inspect the actual BridgeAI repository and supplied UI/UX mockups; test the running application where possible; benchmark live comparable products; and deliver a reproducible, evidence-based production-readiness audit and prioritised redesign/implementation roadmap.** You must not give generic design advice.

## A1. Critical operating rules

- **READ the repository and provided docs before recommending changes.** The V2 handover document is a specification, not evidence that features exist. The 10 UI images are illustrative concepts, not evidence of implemented features. Check both.
- **Never call an illustrative mockup, fictional organisation, expired deadline, score, partnership, grant, contract, customer, investor or programme "verified" or "live" without independently verified supporting data and provenance.** The concept images contain potentially stale dates, sample metrics, famous organisation logos and unverifiable partnership details. Propose correction of all misleading states.
- **Separate observations into:** `[Observed in running app]`, `[Observed in source code]`, `[Visible in mockup only]`, `[From project specification]`, `[Externally verified]`, `[Not verified / needs evidence]`.
- **Do not make claims from screenshots alone** about accessibility, functional behaviour, authentication, security, persistence, AI quality, deployment, official partnerships or legal compliance.
- Do **not** replace Gemma 4 with Claude as the application runtime model. **Claude is the developer/auditor; Gemma 4 via OpenRouter is the app's runtime AI.** Confirm the configured model identifier against the current OpenRouter model catalogue. Do not assume all OpenRouter providers support the same tools / JSON schemas / modalities.
- No hidden frontend OpenRouter keys; never print or commit secrets, tokens, real founder data, confidential pitch decks, investor docs or private contact information. Do not send real data to outside services without explicit approval.
- Do not run destructive migrations or bulk changes, or deploy to public production, as part of an audit. No unapproved outbound contact, sending proposals, scraping private platforms, purchasing subscriptions, granting permissions, or publishing private information.
- **First produce the audit artifacts.** Only after a concise findings summary, implement non-destructive **approved P0 improvements** in small testable commits. If the user asked for audit only, do not implement code changes.
- If browsing, browser automation, mobile emulation or third-party login is unavailable: state limitations clearly, record URLs and provide a reproducible manual test protocol. Never imply a browser or test ran when it did not.
- Reference dates, opportunities and application windows must be checked against the actual current date, and all demo content clearly labelled as synthetic.

## A2. Product mission and primary users

**North-star product promise:** "From introductions to measurable ASEAN business outcomes." BridgeAI should help founders move from a concrete demand signal to a qualified opportunity, a human-reviewed proposal/POC and a legitimately recorded business outcome.

**Core personas (evaluate separately):**

- **Startup founder (primary mobile persona):** Has 2–5 minutes on a phone, may be on mobile data at a networking event. Needs fast onboarding, trusted opportunities, fit explanations, outreach, follow-ups and status clarity.
- **Corporate / government demand owner:** Posts verifiable problem statements, specifies requirements, reviews startup submissions, tracks POCs and confirms outcomes. For phase 1, may be implemented as authenticated demo/admin role only.
- **Investor / accelerator operator:** Expresses thesis/criteria, reviews startup readiness, assesses outreach and manages confidentiality. Do not assume they are verified users or enabled roles.
- **Programme administrator / ecosystem operator:** Approves source records, monitors attribution, reports progress and exports aggregate, non-misleading outcomes.

**Core founder job-to-be-done:** "When I identify a promising opportunity, help me know whether I qualify, why it fits my startup, what action I should take next, and how to track a real outcome — all from my phone."

**Priority golden journey (test end-to-end):**
1. Land on BridgeAI -> clearly understand who it is for and what it does.
2. Create or edit startup passport through Gemma-assisted free text -> review extracted fields and unknowns -> save securely.
3. View demand-first corporate challenges and relevant investor/partner opportunities with clearly sourced, current records.
4. Filter/search by country, sector, stage, challenge type, date and eligibility.
5. See matches: score meaning, hard eligibility, reasoning, evidence sources, risks, source freshness, and why rejected/uncertain.
6. View one opportunity detail -> save -> produce **editable** AI-generated proposal and **proposed** 60–90-day POC plan.
7. Copy/share draft intentionally (never equate copy with sent); record a contact, meeting, LOI, pilot or agreement only when user confirms the actual evidence-based event.
8. Track status, overdue follow-ups, next action and event history; see meaningful funnel and conversion analytics.
9. Return to an existing deal and continue without re-entering the entire profile.
10. Recover from error, rate-limit, loss of network, incomplete profile and no-match states.

## A3. Inputs to inspect

**Repository:** entire source tree, routes, components, CSS / design tokens, environment variable handling, package manifests, tests, database schema, seed data, build logs, CI, auth/storage, analytics, README, licensing and deployments if accessible.

**Prior handover (read critically, may contain inconsistent earlier/later requirements):**
- `ASEAN_BridgeAI_Gemma4_Implementation_Handover.md` — prioritise V2 sections 21–30 when conflicting with older MVP instructions.
- `Claude_Opus_55_BridgeAI_Starter_Prompt.md`.

**Visual references (10 files; inspect every one):**
- `bridgeai_asean_product_showcase.png` — visual system / overview
- `bridgeai_asean_opportunity_gateway.png` — founder home
- `bridgeai_asean_startup_passport.png` — onboarding / AI passport
- `bridgeai_asean_challenge_discovery_showcase.png` — demand-first discovery
- `bridgeai_asean_partner_matching_dashboard.png` — ranked matching
- `bridgeai_opportunity_match_intelligence.png` — opportunity detail / reasoning
- `bridgeai_cross_border_pilot_dashboard.png` — POC builder
- `bridgeai_investor_readiness_dashboard.png` — readiness / document room
- `bridgeai_asean_deal_tracker_mockup.png` — CRM and follow-ups
- `bridgeai_outcome_analytics_dashboard.png` — aggregate outcomes

If files are named or located differently, search locally; record the actual path. Do not infer functionality from file names.

---

## A4. MANDATORY: DISCOVER AVAILABLE MCP, PLUGINS, SKILLS AND SUBAGENTS BEFORE AUDITING

**Do this first, not after writing the report.** The user wants a tool-assisted audit, and the local environment is unknown. The fact that this document mentions a tool does **not** mean it is installed or authenticated.

1. Detect the actual execution environment: Claude Code CLI, Claude Code IDE extension, Claude Desktop, another Claude agent harness, or a restricted environment. Record the version, operating system, repository root and whether browser access, external network, code execution and image reading are available. Use the relevant environment's discovery mechanisms; never assume Claude Code CLI commands work in a different host.
2. In **Claude Code**, use supported inspection methods to discover existing capabilities: `claude mcp list` (terminal), `/mcp` (interactive connection status), `/plugin` (installed/available plugins), `/doctor` (environment health), and inspect repository `CLAUDE.md`, `.claude/skills/`, `.claude/agents/`, `.mcp.json`, plus user-level skills where accessible. Before trusting a project-supplied skill, hook, plugin, MCP configuration, or command, inspect its contents and origin.
3. Build `audit/00_TOOL_CAPABILITY_MATRIX.md` before the rest of the audit. Columns: `Capability | Tool/Plugin/Skill | Source/Version | Configured? | Connected? | Permissions/Scope | Tested action/result | Intended audit use | Privacy risk | Fallback`.
4. Distinguish **available**, **configured but broken**, **requires login**, **requires installation**, **blocked by policy**, and **not needed**. Test each high-value *read-only* connection with one minimal safe operation. Log the actual outcome, not assumptions.
5. For each unavailable high-value capability, give exact official documentation, why it would improve the audit, setup guidance, and expected permissions. **Do not silently install a plugin, download a new binary, authenticate accounts, open third-party credentials, modify global Claude settings or grant permissions. Request approval first.** If no approval is given, continue with the best available tools and mark limitations.
6. Limit scope to BridgeAI code, demo/staging pages, user-provided images and public competitor sites. Do not read unrelated workspace files, private email, financial accounts, or connected cloud drives merely because an MCP permits it.
7. Use the least-privileged mode possible. Prefer read-only GitHub/Figma/database credentials for analysis. Separate read-only audit tools from potentially destructive or public-writing tools.
8. **Never dump `.env*`, OpenRouter keys, cookies, tokens, private pitch decks, PII, browser profiles, access grants or confidential investor documents into your audit output, screenshots, remote tools or public issue trackers.** Avoid displaying secret values even in terminal logs.
9. At the end, record which tools actually executed, which outputs they generated, which checks were manual, and which are untested. Tools are evidence collectors, not evidence by their mere presence.

### A4.1. Tool selection by audit question

| Audit question / task | Preferred capability (if available, consented and fit for purpose) | What to capture | Non-MCP fallback |
|---|---|---|---|
| Do real founder journeys work at mobile widths? | **Playwright MCP / browser automation**; optionally Playwright Test for deterministic regression | Browser URL, viewport, actions, success/failure, screenshot, error logs | Local Playwright CLI/Test or manual browser checklist; mark untested if not run |
| Are there runtime exceptions, failed requests, slow interactions, layout shifts? | **Chrome DevTools MCP** (or equivalent browser DevTools) | Network failures, console errors, performance trace, LCP/CLS/INP observations and conditions | Chrome DevTools manual, Lighthouse CLI, browser performance profiler |
| Does the UI follow the real design source? | **Figma MCP + Figma skills** *only if a real Figma file is shared and permissions exist* | Read tokens, components, spacing, frames, comparisons to implemented UI | Inspect supplied PNG mockups and code tokens; do not claim editable design data |
| Are API and UI packages used correctly? | **Context7** or other verified documentation lookup plugin/MCP | Version-specific Next.js, React, Tailwind, OpenRouter, TypeScript docs, URL and access date | Official documentation in browser or installed package docs |
| Are GitHub issues, CI, PRs and release controls sound? | **GitHub MCP** *only if authorised* | Read-only issue/CI/PR status and repository evidence | `git`, local configuration, public GitHub website |
| Are database/Auth/RLS rules correct? | **Supabase MCP** or relevant actual datastore plugin if connected; use read-only access | Schema, RLS policy evidence, tenant-isolation tests in sandbox | Migrations, policies, local tests, SQL review; never touch live sensitive data |
| Are TypeScript symbols, references and refactor impacts reliable? | **TypeScript LSP / semantic-code analysis plugin** (e.g. Serena, if available) | Symbol usage, dead components, routing/data-flow dependencies | `rg`, compiler, IDE LSP, code inspection |
| Does code meet security/accessibility standards? | **Security Guidance/code-review plugin**, plus local `axe-core`, Lighthouse and lint/test tools | Findings with exact file/line and repro, WCAG criteria, OWASP control | Manual threat model + available linters; automated checks must not substitute for manual testing |
| Are docs/screens consistent and accessible? | **frontend-design skill** + project `bridgeai-audit` skill | UI inventory, token reconciliation, after-state component specifications | Manual comparison and design-system checklist |
| Can specialists work in parallel? | Claude Code **subagents** if supported/available | Separate, non-overlapping specialist reports and a reconciled verdict | Run roles sequentially without pretending agents were spawned |

### A4.2. Installation recommendations — do not assume installed

Prioritise (1) browser testing, (2) performance debugging, (3) docs lookup; add Figma/GitHub/Supabase only when that source exists and materially helps.

**Official paths to inspect and optionally suggest to the user:**

- Claude MCP configuration: https://code.claude.com/docs/en/mcp
- Claude skills: https://code.claude.com/docs/en/skills
- Claude plugins: https://code.claude.com/docs/en/plugins
- Claude subagents: https://code.claude.com/docs/en/sub-agents
- Claude marketplace listings: https://claude.com/marketplace/plugins
- Playwright MCP (Microsoft): https://github.com/microsoft/playwright/blob/main/docs/src/getting-started-mcp.md
- Chrome DevTools MCP: https://github.com/ChromeDevTools/chrome-devtools-mcp
- Figma MCP official setup: https://help.figma.com/hc/en-us/articles/39216419318551-Get-started-with-the-Figma-MCP-server
- Lighthouse CI: https://googlechrome.github.io/lighthouse-ci/

**Optional setup commands, for a user-approved Claude Code CLI environment only (verify current instructions first):**

```bash
# Check configured MCP servers (this is inspection, not installation)
claude mcp list

# If user explicitly approves a browser MCP installation, see official README:
claude mcp add playwright -- npx -y @playwright/mcp@latest

# If user explicitly approves remote Figma integration and has access:
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

In Claude Code the interactive `/mcp`, `/plugin`, `/doctor` commands can be used to inspect/manage connections. **Plugin installation is never automatic in this audit.** Inspect requested plugin permissions, provenance, licence, current version and repository trust boundaries before recommending activation.

### A4.3. MCP and plugin capability gates

Before using an external connector, evaluate:
- **Need:** Does it change the answer or add reproducible evidence?
- **Trust:** Is it official/verified or a well-reviewed maintained project? Does it execute downloaded code, hooks or arbitrary shell commands?
- **Access:** Is there read-only scope? Is it pointing at production, staging or a disposable demo project?
- **Disclosure:** Could data leave the local machine? Are screenshots, documents, browser cookies or search queries sent to third parties?
- **Approval:** Was the user's consent given for connecting, signing in, installing, scanning or writing?
- **Reproducibility:** Can another developer rerun the same check locally?

If a connector cannot meet the above, **do not use it**. Provide a safe manual alternative and note the limitation.

## A5. MANDATORY: ACTUAL BROWSER-BASED UX TESTS, NOT JUST CODE REVIEW

If browser automation is available, run BridgeAI locally or on an approved staging environment using harmless synthetic founder accounts, then:

1. Capture **mobile screenshots at 320, 360, 375, 390, 414 px**, tablet 768px and desktop 1280/1440px. Record actual viewport and browser engine. Use exact routes, not guessed URLs.
2. Run the founder golden path in **B1/B3**: first launch -> passport -> AI analysis -> discover -> filter -> match explanation -> draft -> POC -> save deal -> follow-up -> resume. Record clicks, tab order, focus, keyboard overlays, scroll positions, invalid states, and time/latency.
3. Validate buttons, keyboard navigation, form labels, input error announcements, screen-reader landmarks when possible, scroll traps, back navigation, bottom safe-area, fixed buttons, empty/loading/offline states, and whether desktop tables collapse usefully on phones.
4. Collect console/network failures and a trace/screenshot for the top 5 problems. Run Lighthouse/axe when available and **separate automated findings from manually verified WCAG 2.2 AA failures**.
5. Measure **Core Web Vitals** with stated test conditions; do not treat simulated mobile and real mid-range Android field results as identical. Report LCP, CLS, INP where measurably available; note missing metrics.
6. Use stable synthetic data, no live emails, no actual paid sign-ups, no investor outreach. Never click external partner contact forms or send proposals without explicit authorization.
7. Put screenshot/trace/report files under `audit/evidence/` only if not sensitive. Reference the filenames and paths in each finding.
8. If browser tools are missing, propose an approved install and create an exact manual test script; label all unrun checks NOT TESTED.

## A6. COMPETITOR RESEARCH USING REAL BROWSER/SOURCES

Use an approved browsing MCP or other browsing tool to inspect public pages for at least six: **Startup ASEAN, Dealroom, F6S, OpenVC, Foundersuite, HubSpot**. Optional useful comparables: Crunchbase, Carta, Gust, Y Combinator Work at a Startup, enterprise innovation/challenge portals, and ASEAN national startup agencies. Select comparables by *shared user job*, not famous brand.

For each competitor, document:
- **Verified public feature/function** and the exact official URL or documented product page.
- **User journey / interaction pattern** only if the actual public screen was viewed; otherwise mark it as inferred from product docs, not observed UX.
- **Mobile behavior** only if directly tested; login-gated behavior is `not observable` unless the user authorised a test account.
- **Fit for BridgeAI**, usability advantage and tradeoffs; a specific actionable improvement for one BridgeAI screen.
- **Observation date**, evidence screenshot/path if legal and available, access limitations, and confidence.

Compare jobs-to-be-done: trustworthy demand intake; eligibility; matching explanation; opportunity source freshness; proposal/POC; fundraising readiness; CRM stages; reminder workflow; cross-border readiness; privacy; outcome reporting. No copying proprietary designs, assets, private data or protected layouts wholesale. Use findings to distinguish BridgeAI's unique **demand -> match -> proposed pilot -> genuinely recorded deal** workflow.

## A7. LOCAL SKILL + SUBAGENT ORCHESTRATION

This handover contains an optional project skill at `.claude/skills/bridgeai-production-audit/SKILL.md` and three optional project agents under `.claude/agents/`. They are **templates to copy after review**, not proof that they are already installed. Do not overwrite existing `.claude/` files without reviewing conflicts and requesting approval.

**If supported**, assign independent, read-only specialist tasks:

| Specialist | Mission | Files to create |
|---|---|---|
| `bridgeai-frontend-auditor` | Mobile UX, design tokens, WCAG, responsive screenshot testing, navigation, component integrity | `audit/workstreams/FRONTEND_UIUX.md` |
| `bridgeai-backend-auditor` | Auth/RBAC, data-source integrity, opportunities, deal transitions, analytics, PWA/backend performance, deployment/security | `audit/workstreams/BACKEND_PRODUCTION.md` |
| `bridgeai-gemma-auditor` | OpenRouter/Gemma 4 invocation tracing, prompt injection, tool contracts, hallucination/grounding, evaluation, latency/cost | `audit/workstreams/AI_GEMMA.md` |

The **lead agent** owns tool inventory, competitor research, product strategy, issue de-duplication, severity arbitration, release verdict and final integrated audit. Do not create a busy loop of agents or consume many parallel agents merely for appearances. If subagents are unavailable, sequentially emulate the roles and record that no subagent execution occurred.

Each specialist must supply **evidence** (file/line, route, screenshot, test command/output, external URL), blockers, suggested fix, owner and acceptance criteria. If specialists disagree, reconcile using observed facts and note unresolved uncertainty. Never promote an unverified specialist assumption to a factual finding.

## A8. SKILLS AND PLUGINS: WHEN TO INVOKE THEM

- If **frontend-design** is available: use it for component usability, layout, visual hierarchy and redesign specifications **after** the first inventory; never let aesthetic polish erase privacy, correctness, accessibility or user control.
- If **playwright**/browser tools are available: use for real user journeys, interactive states and visual regression tests. Record exact screenshots and viewports.
- If **Chrome DevTools** is available: inspect runtime, requests, performance traces and console, never expose authenticated production data.
- If **Context7** is available: inspect exact installed package versions, then request version-matched current docs. Prefer official documentation when they conflict.
- If **Figma** is available: compare with a real supplied editable file; if the user gave PNGs only, do not invent Figma components or source documents.
- If **GitHub/code-review/security guidance** is available: read code, CI and PR state; do not open PRs, push changes or create external issues during audit without user approval.
- If a **custom skill** exists in `.claude/skills/`, read its `SKILL.md` and supporting files, verify safety, then use it only if it directly applies.

Tool usage must improve an actual finding: e.g., `UX-012` links to `audit/evidence/mobile_360_discover.png`, while `PERF-003` links to a recorded trace and conditions. **“Used MCP” is not a finding.**

## A9. OPTIONAL REDESIGN / FIX MODE — STRICT PHASE BOUNDARY

**Phase 1 (default):** Read-only discovery, audited local test execution, external public research, reports. Write findings *only* under `audit/`, not app components or production data. Do not run database migrations, change deployed settings, push branches or install plugins.

**Phase 2 (requires explicit user request):** Implement high-priority fixes in small branches/commits, preserving correct behaviors. Before each fix: identify issue ID, expected change, user approval for sensitive changes, and acceptance test. After each fix: run unit tests + focused browser tests + accessibility/performance regression and attach before/after evidence. No production release without the documented gates.

**No automatic "production-ready" claim.** Security and data-room access isolation, compliance review, trustworthy opportunity data, backups, observability, reliable multi-device persistence, E2E checks and real founder usability evidence are release prerequisites.

## A10. EXTRA DELIVERABLES FOR TOOL-AUGMENTED AUDIT

In addition to all files required in Section C, write:

- `audit/00_TOOL_CAPABILITY_MATRIX.md` — MCPs/plugins/skills/subagents actually available, tested, recommended and blocked, with why.
- `audit/14_BROWSER_EVIDENCE_LOG.md` — routes, device widths, steps, screenshots/trace paths, console/network, WCAG failures, performance conditions; mark missing items NOT TESTED.
- `audit/15_COMPETITOR_INTERACTION_RESEARCH.md` — observed vs documented product patterns, source URLs/dates, mobile access limitations, design hypotheses.
- `audit/16_MCP_SKILLS_SETUP_RECOMMENDATIONS.md` — **optional user-approved installations**, official docs, privacy/perms, minimal commands and fallback workflows.
- `audit/17_RELEASE_GATES_AND_REGRESSION_PLAN.md` — test automation, approval gates, operational ownership, rollbacks and evidence needed to graduate from demo to staging/beta/production.
- If browser artifacts are available: `audit/evidence/` with safely scrubbed screenshots, Lighthouse/axe artifacts and traces.

At least the tool capability matrix and audit limitations must be completed even if no MCPs or plugins are available. Include the **exact tool name and the observed output or failure** whenever claiming a test ran.

---

# B. AUDIT METHOD — COMPLETE IN ORDER

## B1. Repository reconnaissance and feature inventory

1. Inspect `package.json`, dependencies, frameworks, app route tree, screen components, layouts, services, API handlers, data, schemas, auth, and tests.
2. Check `git status` and baseline commit before edits.
3. Install/run only with safe, documented commands; verify runtime and build. Do not suppress failures or modify env keys.
4. Visit every reachable route and exercise primary UI controls. Record whether buttons, filters, tabs, forms, saving, PDF export, email actions and charts are genuinely implemented or placeholders.
5. Build a **feature evidence matrix** with columns: Feature | Mockup | Spec | Code | Working locally | Mobile verified | Data source | Production gap | Severity.
6. Record critical errors with exact route, repro steps, screenshot/video file and code location.
7. If no repo or app exists, record `NOT TESTED — source unavailable` rather than inventing scores.

Required feature inventory: Home, Founder Sign-in / Role & Organisation Selection, Onboarding, AI Passport, Corporate Challenges, Search/Filters, Recommendations, Match Detail, Risk & Evidence, Proposal, Cross-Border POC, Market Entry, Investor Readiness, Deal Room, CRM, Tasks/Reminder, Outcomes & KPI, Profile/Settings, Corporate Challenge Submission, Admin Moderation, Help/Errors/Empty States, Offline/PWA.

## B2. Competitive research — search live, do not assume

Research **minimum six** comparable products or programmes, including all of the following if accessible:

- **Startup ASEAN**: https://startup-asean.org/ — baseline ecosystem directory and taxonomy.
- **Dealroom**: https://dealroom.co/ and https://knowledge.dealroom.co/knowledge/what-is-dealroom.co — company and investor discovery, data provenance, market analytics.
- **F6S programmes**: https://www.f6s.com/programs — programme discovery, filters, deadlines.
- **OpenVC CRM**: https://www.openvc.app/CRM — fundraising investor pipeline and follow-up UX.
- **Foundersuite Investor CRM**: https://www.foundersuite.com/features/investor_crm_software — investor stages, collaborators, tasks, files.
- **HubSpot CRM / pipeline**: https://www.hubspot.com/products/crm/pipeline-management — actual stage model, tasks, reporting and mobile CRM patterns.

**Additionally discover at least one current corporate open-innovation / challenge-management platform** (for example a reputable corporate innovation programme operator). Verify the vendor's actual relevant capability on its official website; do not fabricate a comparison merely because a platform name sounds suitable.

For each competitor:
- Product and URL; research access date; source page title; direct evidence URL (official product/docs preferred).
- User persona and job-to-be-done; what the platform demonstrably does.
- Mobile information architecture and discovery flow, only if public screenshots/live site accessible.
- Strengths and weaknesses of its observed public UX; mark untested private workflows `NOT OBSERVABLE`.
- Patterns worth adapting and patterns BridgeAI should avoid; never copy exact brand assets, proprietary screen designs or text.
- Which BridgeAI feature it benchmarks (profile, challenge, match, data provenance, CRM, POC, investor readiness, analytics).
- **Gap table:** BridgeAI current implementation versus competitor evidence, with confidence tag.

Research questions: Which product handles first-use onboarding best? Who exposes eligibility and source freshness? How are notifications and overdue tasks surfaced on mobile? How are risks and unknowns communicated? What permissions / document-sharing controls are evident? What is the clearest path from opportunity discovery to a next action? What is BridgeAI's unique value beyond becoming another directory / generic CRM?

No fake awards, rankings, conversions, retention data, growth figures or unsupported claims. Product websites are marketing sources; label claims accordingly. Cite official pages and independent evidence where available.

## B3. UX heuristics / user journey audit

Use Nielsen's 10 usability heuristics plus a task-based mobile walkthrough. Assess:

1. Time-to-value: first 30 seconds, first recommendation, first legitimate next action.
2. Navigation clarity and information architecture. Restrict mobile bottom navigation to ~4–5 primary destinations; put complex features inside contextual detail pages rather than overcrowding tabs.
3. Progressive disclosure of advanced features (data room, regulations, multi-country analytics) without hiding essentials.
4. Founder comprehension: replace jargon (`LOI`, `POC`, `soft landing`) or provide short explanations; use human action labels.
5. Search relevance, filtering, sort, saved state, incomplete results, zero matches, no source, outdated deadline and duplicate records.
6. Trust: display current source, provenance, last checked, eligibility status, `demo data` tags, truthful match score explanation, clearly distinguished drafted/sent/accepted/completed states.
7. AI integration: useful inline actions and editable outputs, explainability and unknowns rather than a generic chatbot.
8. Input and validation: defaults, autofill, country selectors, dependent fields, file limits, save draft, return/resume, success/error notices.
9. Error prevention and recovery; undo, confirmation for consequential changes and no fabricated achievements.
10. Language & locale: clear English first, planned Bahasa Melayu/Indonesian support, dates/timezones (ASEAN), phone formatting, currencies by country and accessible currency comparison.
11. Intermittent connectivity; credible loading/empty/error/offline states. Avoid spinner-only long AI waits; show staged progress with cancel/retry.
12. Information hierarchy: one dominant CTA per screen, no massive dashboard overwhelming a new founder.
13. Support and onboarding discoverability.
14. Roles: founder does not see admin-only actions, corporate reviewers have distinct workflow, user-switching is real and authorised.

For every core screen produce: goal | current user action | observed blockers | recommended hierarchy | content changes | components | responsive layout | accessibility | states | acceptance tests. Include **before/after written wireframe**. If browser screenshot tooling exists, add annotated screenshots; else provide precise UI text layouts.

## B4. Responsive / mobile testing

Test (or explicitly specify not tested) widths **320, 360, 375, 390, 414, 768, 1024, 1440 CSS px**. Test Android Chrome and iPhone Safari / simulator when available; at least desktop browser mobile emulation otherwise.

Checklist:
- No horizontal overflow / cropped actions; no tiny text or >2-line truncated critical content.
- Buttons and tabs reachable one-handed; safe-area bottom padding; keyboard does not obscure primary CTA, sheet/modal or nav.
- Long filter rows scroll/expand deliberately; chips readable; no accidental sideways page scroll.
- Dense tables/graphs on phones become stacked cards or drill-down, not microscopic desktop tables.
- Touch target at least WCAG 2.2 target-size requirements, with a practical **44×44 CSS px design target** for frequently used controls (44 is a product recommendation, not the WCAG numeric requirement).
- Fonts scale 200%; high contrast; colour not sole differentiator; focus visible; logical headings; keyboard & screen-reader navigation.
- Test accessibility against **WCAG 2.2 AA**; label failures by exact Success Criterion, route, and reproduction. Prefer automated axe/Lighthouse plus manual checks (automation alone is insufficient).
- Forms have visible labels, errors in text, sensible autocomplete, password manager compatibility, accessible progress steps.
- PWA: valid manifest/icons, installability where supported, offline fallback, update messaging, cache safety, and no caching confidential docs without approved design.

## B5. Design-system audit

Compare the 10 concept screens for inconsistent branding, colours, type scale, spacing, card shape, icons, tabs, score rings, status colours and nav labels. Choose **one canonical design system** rather than copying all mockup variations.

Deliver token recommendations for: brand colours, foreground/background, surfaces, success/warning/error/info, focus ring, typography scale, spacing, radii, shadows, borders, heights, breakpoints, responsive grid, motion reduction and skeleton states. Provide Tailwind/CSS variable mapping and sample component spec for Button, Field, Select, Pill/Badge, OpportunityCard, MatchScore, DealStage, ProgressStepper, Modal/BottomSheet, EmptyState, Alert, KPI card, Timeline and BottomNav.

Reject interfaces that rely on marketing-poster ornament (large skylines, excessive gradients, micro text) inside task-heavy product screens. Brand storytelling can remain on the marketing landing page.

## B6. Data, correctness and trust audit

- Separate **fictional demo**, **real sourced**, **unverified user-submitted**, **organisation-confirmed**, **expired**, **draft** and **archived** records; define visible labels for each.
- Check opportunity title, source URL, publisher, date published, application close date, country, currency, programme rules, requirements, contact source, last verified and owner.
- Never attach real corporation logos to invented challenges, POCs, funding amounts, statuses or artificial endorsement.
- Reject mismatched deadlines / fabricated current active challenges from the 2025 concept images.
- Explain scores as compatibility scores from visible factors (not odds of funding). Handle hard eligibility (country, stage, category, deadline) before soft score. Display missing evidence/unknowns.
- Company verification must be an actual editorial/process-backed status, not a decorative green check.
- Avoid unconsented reuse of sensitive pitch materials; trace storage, retention, deletion and who can access them.
- Validate provenance for programme, grant, soft-landing and regulatory content; do not promise funds/approval.

## B7. Gemma 4 / OpenRouter runtime AI audit

Inspect actual integration, not just config docs:
- Confirm model ID live at OpenRouter. Check backend-only key, authorized server route, rate limits, request size, cost controls, bounded timeouts/retries and circuit breaker/fallback.
- Identify every runtime AI interaction and ensure requests to Gemma 4 (not Claude) really occur. Trace prompt version, inputs, tool calls, backend execution, parsed output, Zod validation and UI state.
- Prompt injection threat model for: founder text, corporate challenge text, uploaded pitch decks, linked website excerpts, partner description, emails and document metadata. Untrusted content must never instruct tools or override system constraints.
- For tool calling, model proposes a permitted tool + parameters; trusted backend validates arguments, authorizes user, executes reads, bounds returned data. All state-changing operations require explicit human confirmation.
- Ground explanations only in retrieved source IDs; cite source IDs/URLs or mark inferences. Do not let model invent opportunities, staff contacts or grants.
- Compare prompt variants against an evaluation set of at least **30** examples (include mismatched eligibility, Malaysia↔Indonesia, Singapore, other ASEAN countries, sparse founder profiles, no matches, contradictions, prompt injection, multilingual inputs, invalid/expired opportunity, sensitive data) and record per-example pass/fail.
- Audit JSON validity, factual consistency, partner-ID correctness, hallucination rate, eligibility rejection, multilingual clarity, latency distribution, error recovery, tokens/cost per successful flow, UI-perceived wait.
- Determine whether real LoRA fine-tuning is needed. **Prompt tuning/evaluation is not weight fine-tuning; OpenRouter hosted inference alone does not train model weights.** Recommend fine-tuning only with benchmark evidence, rights-cleared data and a separate hosted weight deployment plan.
- AI output for LOI, IP, liability and legal/regulatory language must be clearly **draft / review required**, never described as validated legal advice.

## B8. Deal states, outcomes and analytics accuracy audit

Define separate concepts: saved lead, qualified introduction, contacted, meeting completed, proposal/LOI, POC agreement signed, POC started, POC finished, paid contract executed, closed won, closed lost, inactive. A call to `copy` does not prove an email was sent; an AI-generated POC is not an executed pilot.

- Deal stage changes need timestamp, actor, prior stage, new stage, evidence/reference and audit trail.
- Funnel metrics: document cohort, unique entity, selected start/end dates, current stage vs ever-reached-stage, numerator, denominator, exclusions, draft/demo filtering.
- Conversion rate example: `number of POCs reaching signed paid work / number of eligible POCs completed in the selected cohort`; define cohort rather than mixing lifetime and period totals.
- `Time to close`: use event timestamps for confirmed closed-won deals only, define start event, median/mean and incomplete cases.
- Multi-currency contract totals: never add RM, SGD, IDR and USD as raw numbers; store currency and conversion date/rate, or show separate currencies.
- Countries entered: require verified market-entry evidence, not the founder choosing a target country.
- Distinguish real-user activity from seeded demo event sequences in every aggregate.
- Check the funnel visually: stage counts should follow actual event semantics; no fake growth arrows or impossible numbers.

## B9. Production / security / operational gates

Review against OWASP ASVS 5.0.0, especially:
- Authentication, verified email where needed, sessions, account recovery, CSRF/XSS controls and safe redirects.
- Organization/tenant isolation; roles `founder`, `corporate`, `investor`, `moderator`, `admin` with **server-side RBAC**; deny access to other companies' documents/deals by changing IDs (IDOR test).
- File upload: content type, MIME sniff, max size, virus scanning / quarantine where feasible, private object storage, signed download URLs, no public buckets for pitch decks, deletion and retention.
- Data room must not advertise encryption, audit logs, external investor access or permissions that are merely illustrated, not implemented/tested.
- GDPR / local privacy questions require jurisdiction-specific review; propose compliance review, never falsely certify legal compliance in all ASEAN countries.
- Rate limiting, input/output validation, audit logs, telemetry redaction, secrets management, backups/restore, migrations, HTTPS, environment separation, audit/event provenance, and incident response basics.
- Production observability: client errors, API error rates, AI error/timeout/cost, SLOs and alert destinations; avoid storing raw confidential prompts in logs.
- Deployment verification: CI lint/typecheck/unit/e2e, production build, real staging link, migrations, rollback runbook and supported browsers.

## B10. Prioritisation and explicit release decision

Classify findings:
- `P0 / Blocker`: unsafe, misleading, unusable golden path, data exposure, broken auth, broken key AI action, fabricated verified claims, fundamentally incorrect KPI or persistent data loss.
- `P1 / High`: major navigation friction, invalid matching, missing error states, nonfunctional important flow, accessibility failure affecting important tasks, inadequate QA coverage.
- `P2 / Medium`: visual consistency, documentation, secondary friction, performance improvements outside release blockers.
- `P3 / Later`: delight, advanced automation, complex investor room, gamification, optional integrations.

For each finding record `impact (1–5)`, `reach (1–5)`, `confidence (1–5)`, `effort (1–5)`, `risk if unfixed (1–5)`. Use these to support ordering, without allowing a numeric score to downgrade genuine P0 security or deceptive claims. For each item specify fix, owner (Frontend / Backend / AI), hours/days estimate as an engineering planning estimate, dependency, acceptance criteria and verification test.

Score **only evidence-backed areas** on a 0–4 scale (`0=missing`, `1=major gaps`, `2=partially useful`, `3=good with minor gaps`, `4=strong/production-standard`):
- Founder first-use / onboarding
- Mobile usability / responsive design
- Opportunity discovery / trust
- Matching and AI explainability
- Proposal / POC workflow
- Deal CRM and truthful status tracking
- Analytics and measurement
- Accessibility / inclusive UX
- Performance / PWA reliability
- Security / privacy / identity
- Operability / deployability

For each domain give evidence and confidence. **Do not calculate an overall numerical score if major domains cannot be observed**. A good UI score alone cannot imply production readiness.

Release conclusion must explicitly be ONE of:
- **NOT READY — critical blockers**
- **STAGING READY — for controlled internal testing, not real sensitive founder data**
- **LIMITED BETA READY — with documented limitations and safeguards**
- **PRODUCTION READY — supported by tested controls and real-user acceptance evidence**

Production ready requires P0=0, adequate security/tenant controls, verified end-to-end journeys, sourced data, measured accessibility/performance, privacy/compliance review, reliable persistence/backup, and user acceptance. If any necessary evidence is absent, choose a lower category and explain the gates.

---

# C. REQUIRED DELIVERABLES (WRITE ACTUAL FILES)

Create an `audit/` folder containing (also see **A10** for required tool-assisted evidence outputs):

1. `00_EXECUTIVE_SUMMARY.md` — verdict, top 10 problems, strengths, highest-impact UX improvements, decision for beta vs production, what was/wasn't tested.
2. `01_FEATURE_INVENTORY.md` — every route/feature, image/spec/code/live state, factual/source confidence, functional test status.
3. `02_UX_HEURISTIC_MOBILE_AUDIT.md` — persona journeys, screen-by-screen issue register, mobile/responsive evidence, errors/empty/loading, accessibility mapping and annotated screenshots when available.
4. `03_COMPETITOR_BENCHMARK.md` — minimum 6 researched platforms, links/access dates/observability, comparison matrix, best patterns to adopt, avoid copying.
5. `04_PROPOSED_INFORMATION_ARCHITECTURE.md` — new mobile 4–5 tab IA, role-specific user flows, before/after wireframes, consistent labels and navigation.
6. `05_DESIGN_SYSTEM_AND_COMPONENTS.md` — tokens, accessibility specs, responsive rules, components and per-screen implementation guidance.
7. `06_GEMMA_OPENROUTER_AUDIT.md` — actual prompts/integration/tool calls/grounding/evaluation and improvement plan with a scored 30-case evaluation set.
8. `07_SECURITY_DATA_AND_ANALYTICS.md` — data source integrity, auth/RBAC, document-room design, deal event schema, KPI formula dictionary, privacy and production concerns.
9. `08_PRIORITIZED_BACKLOG.md` — table of actionable P0–P3 items with owners, affected files, effort, dependencies, acceptance tests.
10. `09_PRODUCTION_READINESS_CHECKLIST.md` — must-pass launch gates and explicit release verdict; label unverified items `NOT TESTED`.
11. `10_IMPLEMENTATION_PLAN_3_OWNERS.md` — clear non-overlapping role split: Frontend UX, Backend/Data/Security, Gemma/AI; proposed milestones, integration contracts and handoff points.
12. `11_RESEARCH_SOURCES.md` — every external claim and benchmark source (URL, date accessed, what exactly it proves).
13. `12_TEST_CASES.md` — reproducible E2E, regression, mobile, access-control, AI and metrics validation steps, including expected outcomes.
14. `13_BEFORE_AFTER_PROPOSALS.md` — side-by-side text wireframes or screenshot annotations for top 5 redesigns, plus sample microcopy.

Also deliver:
- A **one-page summary in your final response** with the top three fixes, the release verdict, best reference products, and file links/paths.
- A proposed **first 5 PRs / commits**, small, safe and in priority order, including smoke-test commands.
- No invented screenshot references, file paths, successful test outcomes or competitor capabilities.

---

# D. SUGGESTED TARGET MOBILE IA (HYPOTHESIS TO VALIDATE)

**Bottom navigation (4 tabs):**
1. **Home** — one-sentence AI next action, progress, 1–3 relevant opportunities.
2. **Discover** — corporate challenges, investors and programmes, filters and saved items.
3. **My Deals** — pipeline, tasks, notes, follow-ups, POC status.
4. **Profile** — Startup Passport, investor readiness, preferences, language, help/settings.

**Contextual flows (not extra permanent tabs):**
- `Discover > Opportunity Detail > Why It Matches > Generate POC / Proposal > Save Deal`
- `My Deals > Deal Detail > Activity Timeline > Next Action > Draft Follow-up`
- `Profile > Edit Passport > AI Extraction > Confirm`
- `Profile > Investor Readiness > Document Room` (feature-gated until truly secure)
- `Discover > Market Entry / Soft Landing` (clearly sourced, country-specific)
- Analytics: small personal insight cards in Home / My Deals; full multi-country admin dashboard on tablet/desktop and mobile drill-down rather than phone-sized complex charts.

Alternative role navs should be designed separately: Corporate/Programme owner: `Home | Challenges | Applicants | Outcomes | Profile` (5 tabs if needed). Admin: desktop-first moderation and reporting.

Treat this IA as a hypothesis, not a mandatory cosmetic change: compare against actual founder tasks and usability evidence.

---

# E. CRITICAL QUESTIONS THE AUDIT MUST ANSWER

1. Can a new founder go from blank screen to an actionable, sourced match on mobile in a reasonable number of steps? Where do they drop off?
2. What is the single best primary CTA on each screen? Which buttons are duplicate, unclear, inactive, or falsely imply action?
3. Are a founder's saved information and deals reliably private and persistent across devices? If not, is the UI truthful about demo/local-only storage?
4. Does the match score explain **why**, what is missing, and hard eligibility? Does it distinguish source evidence from LLM inference?
5. How does BridgeAI uniquely differ from Startup ASEAN, Dealroom, F6S, OpenVC, Foundersuite and HubSpot? Which *specific verified* UX patterns should it adopt?
6. Are POC templates editable, measurable and honest about approvals, IP, privacy, data sharing, budget and prospective vs signed status?
7. Do opportunity records and corporate/investor logos have provenance and current valid dates? How are expired records handled?
8. Can a user accidentally believe a draft email has been sent or a generated proposal accepted?
9. Is the deal funnel auditable and correct by country/sector/period, with no mixed currencies or fake totals?
10. Does BridgeAI pass WCAG 2.2 AA for the key journeys? How does it behave at 320px, with large text, keyboard open and weak network?
11. Are confidential pitch decks and data rooms protected by actual auth/RBAC/private storage? If not, what must be hidden before production?
12. Is Gemma 4 genuinely providing value, with measurable evaluation quality, or only generating cosmetic explanations? How to improve prompting, retrieval, tool use and latency?
13. What specifically must be fixed to move from **hackathon demo -> internal beta -> pilot -> production**?

---

# F. READY-TO-USE AUDIT TABLE FORMATS

## Finding record (repeat one per issue)

| Field | Content |
|---|---|
| ID | `UX-001` / `AI-001` / `DATA-001` / `SEC-001` etc. |
| Severity | P0 / P1 / P2 / P3 |
| Screen / Route | Exact route and device width |
| Evidence type | Code / live / mockup / reference / unverified |
| Observed issue | Concrete, reproducible factual statement |
| User impact | Founder task affected |
| Competitor precedent | Verified URL, exact relevant pattern, not an opinion |
| Recommendation | Precise interaction/content/layout or code change |
| Owner | Frontend / Backend / AI |
| Effort | Rough estimate |
| Acceptance criteria | Testable success conditions |
| Evidence | Screenshot/log/source line where available |

## Feature comparison

| Feature / task | BridgeAI (observed) | Startup ASEAN | Dealroom | F6S | OpenVC / Foundersuite | HubSpot | BridgeAI redesign | Confidence/source |
|---|---|---|---|---|---|---|---|---|
| First-run founder onboarding | | | | | | | | |
| Source-backed discovery | | | | | | | | |
| Explainable compatibility | | | | | | | | |
| Draft a pilot / proposal | | | | | | | | |
| Maintain follow-up / stage | | | | | | | | |
| Outcome provenance | | | | | | | | |

## Three-owner work split

| Owner | Primary scope | Deliverables | Must coordinate with |
|---|---|---|---|
| **Frontend / UX** | IA, responsive routes, design tokens, accessibility, forms, loading/empty/error, mobile testing | Components + E2E coverage | Backend API contracts, AI UI states |
| **Backend / Data / Security** | Auth/RBAC, opportunity source lifecycle, scoring, deals/event logs, KPI formulas, private document handling, deployment | Secure APIs + schemas + data tests | Frontend models, AI tool schemas |
| **Gemma / AI** | OpenRouter integration, prompt versions, grounding, tools, output validation, red team, evaluation metrics | Reliable model service + eval report | Backend retrieval/authorization, frontend explanations |

---

# G. EXTERNAL REFERENCES / STANDARDS TO VERIFY LIVE

Use these as a **starting benchmark library**, not a substitute for fresh research, screenshots, manual tests or independent validation:

- Startup ASEAN official portal — https://startup-asean.org/
- Dealroom overview — https://knowledge.dealroom.co/knowledge/what-is-dealroom.co
- Dealroom product — https://dealroom.co/
- F6S programmes — https://www.f6s.com/programs
- OpenVC fundraising CRM — https://www.openvc.app/CRM
- Foundersuite Investor CRM — https://www.foundersuite.com/features/investor_crm_software
- HubSpot pipeline management — https://www.hubspot.com/products/crm/pipeline-management
- WCAG 2.2 official — https://www.w3.org/TR/wcag/
- MDN Mobile Accessibility Checklist — https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Mobile_accessibility_checklist
- PWA checklist — https://web.dev/articles/pwa-checklist
- Core Web Vitals — https://web.dev/articles/vitals
- OWASP ASVS 5.0 — https://asvs.owasp.org/
- OpenRouter developer platform — https://openrouter.ai/developers
- OpenRouter tool-calling guide — https://openrouter.ai/blog/tutorials/tool-calling/

**Final agent instruction:** Discover and use appropriate **installed** MCPs, plugins, skills and subagents where they can produce real evidence. Think and act like an independent product auditor, not a designer trying to justify the existing mockups. Show evidence, identify what is absent, distinguish demo claims from real integrations, benchmark verified competitors, redesign around the founder's tasks, and give an actionable implementation sequence with no unsupported claim of production readiness.
