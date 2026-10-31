# Frontend handover — ASEAN BridgeAI (for Person 1)

Written 31 Oct 2026 by Person 3 (Gemma AI). This is everything you need to build the mobile UI on top of the backend (Person 2) and the AI layer (Person 3). Read section 0 first; the rest is reference.

---

## 0. Start here

1. **There is no Next.js app yet.** `package.json` has no `next`, `react` or Tailwind. The API routes under `src/app/api/` exist, but nothing can serve them until you add Next.js (section 4). This is the main blocker for the whole team, including deployment.
2. **The API is finished and tested for P0.** Three AI-backed routes (`analyze`, `demand/matches`, `poc`), one catalog route (`challenges`), and a pure state machine and KPI library for deals that you run in the browser. Build against the contract in [api-contract.md](api-contract.md) and the ready-made examples in `src/lib/ai/fixtures/`. You can build the whole UI without a key or a network.
3. **Deals live only in the browser** (`localStorage`). `/api/deals*` and `/api/metrics` return `501` on purpose. You write the small browser store; the logic (`deal-fsm.ts`, `kpi-metrics.ts`) is done (section 9).
4. **Five rules the UI must follow** (details in section 8): show data labels (synthetic/self-reported), show the Gemma badge only for real Gemma output, never say anything was sent, agreed or paid unless the user recorded it, a POC is always "proposed", and let the founder pick capability tags from the challenge's list.
5. **Where the code is:** the integration work is on a local branch, `feat/integrate-ai`, that has **not been pushed**. GitHub `main` still has only Person 2's backend. Ask the repo owner to push it and open the PR before you branch (section 1).

---

## 1. Where the code is

| | |
|---|---|
| Repo | https://github.com/LuqmanNurhakimRosli/BridgeAI-Hacktoberfest- |
| `main` on GitHub | Person 2's backend only (PR #1 merged) |
| `feat/integrate-ai` | Backend + AI layer, wired together. Local to Person 3's machine; **not pushed, no PR yet** |
| Base your work on | `feat/integrate-ai` once it is pushed (or its merged `main`) |

Commits on `feat/integrate-ai` (newest first): fix round-trip limits → record live evaluation → tests, contract, fixtures, golden-path script → route `/api/*` through the AI layer → restore live eval report. Person 2 has not reviewed the changes to their files yet (section 14).

---

## 2. Status board

| Area | Owner | State |
|---|---|---|
| Next.js app, PWA, all screens | **Person 1 (you)** | **Not started in the repo** |
| API routes, handlers, matcher, catalog | Person 2 | Done for P0 |
| Deal state machine, KPI maths | Person 2 | Done (pure library; the browser store is yours) |
| Server-side deals, auth, metrics | Person 2 | Not implemented (`501`), P2 scope |
| Gemma AI layer, prompts, guards, evals | Person 3 | Done for P0 |
| AI wired into the routes | Person 3 | Done, tested live |
| TTS (read aloud) | Person 3 + you | Proposed only, not built (section 16) |
| Deployment, README polish, LICENSE, video, submission | Person 4 / team | Not done. README updated; no LICENSE file; `package.json` says ISC |

**Tests:** 117 pass offline (`npm test`), typecheck clean (`npm run typecheck`). **Live golden path** (real Gemma through the real routes) passed all checks on 31 Oct 2026.

---

## 3. Setup

```bash
git clone https://github.com/LuqmanNurhakimRosli/BridgeAI-Hacktoberfest-
cd BridgeAI-Hacktoberfest-
git checkout feat/integrate-ai      # once pushed
npm install
cp .env.example .env.local          # add the OpenRouter key; never commit it
npm test
npm run typecheck
```

| Variable | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | Server only. Never prefix with `NEXT_PUBLIC_` and never import server modules in client code. |
| `OPENROUTER_MODEL` | Default `google/gemma-4-26b-a4b-it` |
| `OPENROUTER_BASE_URL` | Default `https://openrouter.ai/api/v1` |
| `APP_URL` | Sent as the OpenRouter referer |

| Script | Needs key | Notes |
|---|:---:|---|
| `npm test` / `npm run typecheck` | no | |
| `npm run fixtures` | no | Regenerates `src/lib/ai/fixtures/*.json` from the real handlers |
| `npm run smoke:openrouter`, `golden:live`, `eval:ai:live` | yes | These scripts read `process.env` directly and do **not** load `.env.local`. Set `OPENROUTER_API_KEY` in your shell first. |

---

## 4. Adding Next.js (the blocker)

Do this first, in this repo, so the existing `src/app/api/*/route.ts` files are served as-is.

- Install `next`, `react`, `react-dom` (and Tailwind if you want it). Add `dev`, `build`, `start` scripts.
- The route files are standard App Router handlers (`export const POST = route(handler, { ai: true })`). Keep them where they are.
- `package.json` has `"type": "module"`; Next supports this.
- `tsconfig.json` currently has `moduleResolution: Bundler`, `resolveJsonModule`, `types: ["node"]` and `include: ["src", "tests", "scripts"]`. Next will add `jsx`, `lib: dom` and its plugin; accept those. There is no `@/` path alias; add `paths` if you want one.
- `npm test` must stay green after you add Next. Vitest imports the route files directly, without Next.
- **POC drafting takes 14 to 26 s** (section 12). Set the route's max duration and check your host's function timeout before deploying.
- The AI rate limiter is in-memory (20 requests per minute per IP, resets on cold start). The real safety net is a spend cap on the OpenRouter key.

---

## 5. What runs where (important)

**Server-only. Never import in client components:** `src/lib/ai/index.ts`, `call-gemma.ts`, `config.ts`, `task.ts`, `tools.ts`, `src/handlers/*`, `src/lib/api.ts`, `src/lib/catalog.ts` (use `/api/challenges` instead). The AI modules read the API key from the environment.

**Safe in the browser (pure, no secrets):**
- `src/lib/contract.ts` — Zod response schemas for the three AI routes and the error envelope, plus `toRequestProfile()`.
- `src/lib/schemas.ts` — request schemas and the `StartupProfile`, `DemandBrief`, `DealEvent`, `DealState` types.
- `src/lib/deal-fsm.ts` and `src/lib/kpi-metrics.ts` — deal state and funnel maths.
- `src/lib/constants.ts`.

---

## 6. The user flow and the endpoint behind each step

```
Home (Passport)  ->  Challenges  ->  Match detail  ->  POC Builder  ->  Deals  ->  Insights
 /api/analyze        /api/challenges   /api/demand/       /api/poc        browser     browser
                                       matches                            (FSM)       (KPI maths)
```

| Screen | Calls | What to show | Notes |
|---|---|---|---|
| Home / Passport | `POST /api/analyze` | Editable profile; missing fields highlighted; Gemma badge | Founder must confirm before anything else. `needs_founder_confirmation` is always `true`. |
| Challenges | `GET /api/challenges` | Cards with a `Synthetic Demo` label; filters by `country`, `type` | Three demo records (section 10). |
| Match detail | `POST /api/demand/matches` | Score and breakdown, `reasons`, `unknowns`, Gemma explanation, withheld list with reasons | `ai_analysis` can be `null` (section 7). |
| POC Builder | `POST /api/poc` | Editable proposed plan, the question lists, `review_notes`, "Proposed draft" banner | 14 to 26 s: show progress. |
| Deals | none (browser) | Saved deals, timeline, allowed next stages, one next-action field | Uses `deal-fsm.ts` (section 9). |
| Insights | none (browser) | Funnel with numerator and denominator; real and synthetic counts separate | Uses `kpi-metrics.ts`. |

The handover document's four-tab layout (Home, Challenges, Deals, Insights, with Match and POC nested) fits this flow. Mobile first at 360 to 430 px, 44 px touch targets, no horizontal scroll, no reliance on gestures.

---

## 7. API quick reference

Full detail, error table and examples: [api-contract.md](api-contract.md). The code version is `src/lib/contract.ts`. Real example responses are in `src/lib/ai/fixtures/` (`analyze-agrismart.json`, `analyze-incomplete.json`, `matches-agrismart.json`, `poc-agrismart.json`, `errors.json`).

| Route | Request | Response (success) |
|---|---|---|
| `POST /api/analyze` | `{ description, locale?: "en"\|"ms"\|"id" }` | `{ profile, needs_founder_confirmation: true, meta }` |
| `GET /api/challenges?country&type&limit` | query | `{ briefs[], notice }` |
| `POST /api/demand/matches` | `{ startup_profile, demand_ids? }` | `{ matches[], withheld[], ai_status, meta\|null, data_notice }` |
| `POST /api/poc` | `{ startup_profile, demand_id, duration_days? (60–90, default 75) }` | `{ plan, draft_only: true, model, notice, review_notes[], meta }` |
| `/api/deals`, `/api/deals/[id]/events`, `/api/metrics` | | `501 NOT_IMPLEMENTED` |

Errors are always `{ "error": { "code", "message" } }`. Messages are safe to show; they never reveal whether the key, credits or provider was the cause.

### Things that will bite you
1. **Profile conversion.** `/api/analyze` returns `missing_fields` and `confidence_notes`. The next two routes reject unknown fields. Always send `toRequestProfile(profile)`.
2. **`ai_analysis` can be `null` on any match**, even when `ai_status` is `ok`. Show `reasons` and `unknowns` instead. Never fill in text yourself.
3. **`ai_status`** is `ok`, `unavailable`, `invalid_output` or `not_run`. Anything but `ok` still returns valid scores. Show "AI explanation unavailable", not an error page.
4. **`meta` is `null`** on matches when the model did not run.
5. **The Passport profile is a suggestion.** `capability_tags` and `industry` come from the model. The founder edits them.
6. **Rate limit:** 20 AI requests per minute per client (`RATE_LIMITED`, 429). Provider limit is `UPSTREAM_RATE_LIMIT` with a `Retry-After` header.
7. **Request body limit:** 16 KB.

### Error to UI behaviour

| HTTP | `code` | Suggested UI |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Inline field message |
| 404 | `UNKNOWN_DEMAND` | "That challenge is no longer available" |
| 422 | `PROFILE_INCOMPLETE` | Send the founder back to the missing fields (`target_country`, `stage`, `primary_goal`) |
| 429 | `RATE_LIMITED` / `UPSTREAM_RATE_LIMIT` | Cooldown using `Retry-After`; no automatic retry loop |
| 502 | `INVALID_MODEL_OUTPUT` | "Try again" button. Never show a made-up result. |
| 503 | `AI_UNAVAILABLE` | "AI is unavailable" with retry. Scores and the rest of the app still work. |
| 501 | `NOT_IMPLEMENTED` | Should never be called. Deals are browser-only. |

### Minimal client helper

```ts
import { z } from 'zod';
import { errorEnvelopeSchema } from '../lib/contract';

export async function post<T>(path: string, body: unknown, schema: z.ZodType<T>) {
  const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) {
    const err = errorEnvelopeSchema.safeParse(json);
    return { ok: false as const, status: res.status, code: err.success ? err.data.error.code : 'UNKNOWN',
             message: err.success ? err.data.error.message : 'Unexpected error.', retryAfter: Number(res.headers.get('Retry-After')) || undefined };
  }
  return { ok: true as const, data: schema.parse(json) };
}
// usage: post('/api/analyze', { description }, analyzeResponseSchema)
```

---

## 8. Rules the UI must follow

These come from the project's trust rules. They are product requirements, not style.

1. **Data labels.** Every catalog record shows `Synthetic Demo` (the field is `data_status`). Founder input is `self_reported`. Nothing in P0 is `verified_*`.
2. **Gemma badge.** Show "Powered by Gemma 4 via OpenRouter" only when `meta.source === "gemma"`. For `"fixture"` show "Demo fixture". If `meta` is `null` or the call failed, show no badge.
3. **Honest wording.** Never show "contacted", "sent", "agreed", "signed", "funded" or "paid" unless the user recorded that event. Copying an outreach draft is not sending it. Saving a match creates a `qualified` event only.
4. **A POC is a proposal.** `plan.status` is always `"proposed"`. Show a "Proposed draft, not agreed" banner and `review_notes`. Legal, IP, data and liability items are questions for advisers, not legal advice. `possible_conversion_to_paid` is a hypothesis.
5. **Scores are compatibility, not probability.** Never show a percentage or "chance of success". In P0 the highest reachable score is **75**: founder-declared capabilities count at 50%, and the readiness component is always 0. Show the score with its `score_breakdown` (sector 30, must-have, geography 15, stage 15, readiness) and the `unknowns`.
6. **Capability tags are chips, not free text.** The matcher gives credit only when a tag equals a challenge `must_have` string (case-insensitive). With real Gemma output, the suggested tag `"ai leaf-disease detection"` scored **60**; picking the challenge's own tags (`crop disease detection`, `mobile workflow`) scored **75**. Render the challenge's `must_have` strings as selectable chips, pre-selecting any that match a suggested tag.
7. **Withheld is not hidden.** Show `withheld` challenges with their reasons (`stage_incompatible`, `goal_mismatch`). Hiding them makes the matching look arbitrary.
8. **No secrets or sensitive data.** `localStorage` holds synthetic and self-reported data only. No real documents. Do not claim cross-device sync or background reminders.
9. **Accessibility.** Visible focus, labelled controls, readable contrast, loading and error states on every AI call, no animation-only feedback.

---

## 9. Deals, the state machine and KPIs (browser side)

Person 2 wrote these as **pure functions**. You write the thin `localStorage` store around them.

### Events
```ts
// DealEvent (src/lib/schemas.ts)
{ id, deal_id, event_type, from_state, to_state, happened_at /* ISO */, actor_id /* 'demo_user' */,
  evidence_status /* 'self_reported' | 'synthetic_demo' in P0 */, note?: string /* <= 500 */, evidence_ref?: string | null }
```
The current state is derived from the event log (`deriveState(events)`), never stored separately.

### Rules enforced by `applyEvent(track, events, event)`
- Only the `commercial_poc` track exists in P0.
- Path: `identified → qualified → introduction_requested → first_meeting → proposal_shared → agreement_signed → poc_running → poc_completed → contract_signed → paid`.
- From any non-final state a deal may go to `closed_lost` or `on_hold`. From `on_hold` it can only resume to where it was, or go to `closed_lost`. `paid` and `closed_lost` are final.
- `from_state` must equal the current state, or it returns `INVALID_TRANSITION`. Re-sending the same event `id` is safe (returns the existing log, `duplicate: true`). Moving to the same state is `DUPLICATE_EVENT`.
- Evidence must be `self_reported` or `synthetic_demo`.
- Nothing creates a state automatically. A draft or a generated POC never advances a deal.

### Usage
```ts
import { applyEvent, deriveState, allowedNext } from '../lib/deal-fsm';

const event = {
  id: crypto.randomUUID(), deal_id, event_type: 'match_qualified',
  from_state: deriveState(events), to_state: 'qualified',
  happened_at: new Date().toISOString(), actor_id: 'demo_user', evidence_status: 'self_reported', note: 'Saved from match DEMO-CH-001',
};
const result = applyEvent('commercial_poc', events, event);
if (result.ok) save(result.events); else showError(result.message);

allowedNext(events, deriveState(events));   // offer only these buttons
```
Store with each deal: its `deal_id`, `demand_id`, the confirmed profile, the saved POC plan (as `proposed`), and its event log. Add one manual next-action field. In-app reminders only while the app is open.

### KPIs (`src/lib/kpi-metrics.ts`)
```ts
const { real, synthetic } = splitBySource(allEventLogs);
funnel(real);                                   // qualified / introduction_requested / first_meeting counts
conversion(real, 'qualified', 'introduction_requested'); // { numerator, denominator, rate_percent|null }
timeToClose(real);                              // { average_days|null, completed, in_progress }
```
Always show the numerator and denominator, and show real and synthetic deals as separate numbers. `rate_percent` is `null` when the denominator is 0; show "no data", not 0%.

### Gap: no sample deals
There are no synthetic sample deals or events in the repo, so an Insights screen would be empty. The handover wants a clearly labelled synthetic demo funnel next to the real counts. Someone needs to create a small `synthetic_demo` event set (Person 2's data, or yours); agree who.

---

## 10. The demo catalog (3 records, all `synthetic_demo`)

| ID | Kind | Buyer | Title | Country | Industry | Must-have | Stages | Goals |
|---|---|---|---|---|---|---|---|---|
| `DEMO-CH-001` | corporate_challenge | Nusantara Food & Farms Innovation Lab (Synthetic Demo) | Offline-ready crop disease detection pilot | Indonesia | AgriTech | crop disease detection; mobile workflow | Pre-seed, Seed, Series A | Pilot Partnership, Market Expansion |
| `DEMO-CH-002` | corporate_challenge | Mekong Payments Lab (Synthetic Demo) | Merchant cash-flow forecasting pilot | Vietnam | FinTech | cash-flow forecasting; data privacy controls | Seed, Series A | Pilot Partnership |
| `DEMO-VC-001` | vc_thesis | Straits Venture Capital Partners (Demo) | Early-stage applied AI ventures in ASEAN | Singapore | AI | validated use case | Seed, Series A | Investment |

For the AgriSmart golden path, `DEMO-CH-001` scores 75 with the right tags, `DEMO-CH-002` is eligible with a low score of 15, and `DEMO-VC-001` is withheld (`goal_mismatch`). In the fixture only `DEMO-CH-001` has an explanation (`ai_analysis: null` for `DEMO-CH-002`); live Gemma may explain both, so handle either.

---

## 11. Fixtures and building without a key

`src/lib/ai/fixtures/*.json` are full API responses, produced by running the real handlers against a scripted network, so the shapes cannot drift (a test fails if they do). Every AI response in them has `meta.source: "fixture"`.

- `errors.json` has a real example of each error (`PROFILE_INCOMPLETE`, `UNKNOWN_DEMAND`, `VALIDATION_ERROR`, `AI_UNAVAILABLE`, `UPSTREAM_RATE_LIMIT` with `retry_after_header`, `INVALID_MODEL_OUTPUT`), each with `status` and `body`.
- Suggested: a `NEXT_PUBLIC_USE_FIXTURES=true` switch in your fetch helper that returns these instead of calling the API. Then the badge logic shows "Demo fixture".
- If you change the API behaviour, run `npm run fixtures` and commit the result.

The golden-path input (also in `scripts/golden-path.ts`): *"We are AgriSmart, a Malaysian seed-stage startup building phone-based AI leaf-disease detection. We need an Indonesian company with a real field-pilot problem to solve."*

---

## 12. Person 2's work (backend), in detail

Merged to GitHub `main` in PR #1 (`feat(backend): P0 demand-to-deal API, matcher, deal FSM and KPIs`).

- **Routes** (`src/app/api/*`): `analyze`, `challenges`, `demand/matches`, `poc`, plus `deals`, `deals/[id]/events` and `metrics` as honest `501` stubs. A shared `route()` wrapper adds the error envelope, a 16 KB body limit and the in-memory rate limit (`src/lib/api.ts`).
- **Matcher** (`src/lib/demand-matcher.ts`): deterministic. Score = sector 30 + must-have (up to 15 in P0) + geography 15 + stage 15 + readiness (0 in P0). Hard gates withhold candidates for `stage_incompatible` and `goal_mismatch`. A candidate is never "eligible" in P0, only `needs_verification` or `withheld`, because nothing is verified.
- **Catalog** (`src/lib/catalog.ts`, `src/data/demand-briefs.json`): validated at load.
- **Deal state machine** and **KPI maths**: pure, tested (section 9).
- **Tests:** about 41 tests across routes, FSM, matcher and KPIs.
- **Limits and known gaps:** only the `commercial_poc` track; no server-side persistence; matcher compares capability tags by exact text (section 8, rule 6); no synthetic sample deals.

## 13. Person 3's work (Gemma AI), in detail

All in `src/lib/ai/`. Gemma 4 (`google/gemma-4-26b-a4b-it`) via OpenRouter, server-side only.

- **Transport** (`call-gemma.ts`): one OpenRouter client, 30 s timeout, one retry with jitter on timeout or 5xx, mapped errors for 401, 402, 404, 429.
- **Services:** Passport extraction, startup-to-demands explanation, POC draft. Also built and tested but **not wired to any route**: reverse explanation (demand to startups), outreach email draft (English, Bahasa Melayu, Bahasa Indonesia), search plan, tool-call loop, demand intake, next-action coach.
- **Guards, enforced in code, not prompts** (`postvalidate.ts`): unknown demand IDs dropped; emails and URLs removed from model text; a POC's status, duration and `demand_id` always set by the server (model-invented values ignored); outcomes stated as done ("already signed and paid") rejected and repaired once; industry normalised to a taxonomy; empty strings become `null`; limits match the request schemas so anything `/api/analyze` returns can be sent straight back.
- **Prompts** are versioned (`passport-v4`, `matches-v1`, `poc-v2`, …) and treat user text as data inside `<data name="…">` blocks with `<` escaped.
- **Evaluation** (`evals/v2`, `scripts/eval-ai.ts`, `docs/ai-evaluation.md`). Latest live run: passport 24/29, match 8/8, POC 6/6, outreach 10/10, coach 4/6; 0 prompt-leak or injection failures and 0 contact leaks. Latency p50 3.2 s, p95 11.1 s. The passport set was used for tuning, so it is not a clean test set; single runs vary.
- **Live latency through the routes:** analyze 3 to 4 s, matches 4 to 7 s, **POC 14 to 26 s** (one run included a repair call).

### Open AI issues (so you are not surprised)
- Gemma leaves `primary_goal` empty when intent is only implied ("expand into Thailand") and sometimes infers an industry from a vague hint. The founder-confirm step covers this; make the fields easy to edit.
- The next-action coach failed validation on 2 of 6 cases in the last run. It is not on any route; do not build UI for it yet.
- Outreach language quality (Malay and Indonesian) needs a native-speaker review before it is shown.
- The AI makes no claim of fine-tuning. It is prompting, validation and evaluation only.

## 14. Integration changes made to Person 2's files (they should review)

The plan and decisions are in [integration-plan.md](integration-plan.md). Changes to their code:
- `src/lib/model.ts` and `src/lib/prompts.ts` deleted; the `openai` dependency removed. One transport now (`src/lib/ai/call-gemma.ts`).
- `src/handlers/analyze.ts`, `poc.ts`, `demand-matches.ts` rewritten to call the AI services. Public response shapes are unchanged except for **added optional fields** (`meta`, `needs_founder_confirmation`, `review_notes`, `evidence_for_fit`, `missing_evidence`, `capability_tags`, and optional POC extras).
- `src/lib/schemas.ts`: the model-output schemas moved to `src/lib/ai/schemas.ts`.
- New: `src/handlers/ai-boundary.ts` (maps AI errors to the existing public codes), `src/lib/contract.ts`, `src/lib/constants.ts`.
- `tests/helpers.ts` and `tests/routes.test.ts` adapted to the new model seam. One route-level retry test moved into `tests/integration.test.ts`, where it runs against the real transport. Assertions were otherwise kept.
- `package.json` (name `asean-bridgeai`, scripts, `tsx` added), `tsconfig.json` (scripts included), `.env.example`, `README.md`.

---

## 15. Risks and open decisions

| Item | Detail | Owner |
|---|---|---|
| No Next.js | Blocks serving, deployment and the demo | You |
| Not pushed / no PR | Integration is on one machine | Person 3 (needs the owner's go-ahead) |
| Person 2 review | Their files changed | Person 2 |
| POC latency | 14 to 26 s; check host function timeout; show progress | You + deployer |
| Tag wording | Free-text tags score lower (60 vs 75) | You (chips, section 8) |
| No sample deals | Insights would be empty | Person 2 or you |
| OpenRouter key | Was pasted in a chat; **rotate it**, and use a separate capped key for the deployed app | Owner |
| License | `package.json` says ISC; a MIT LICENSE file with the copyright holder's name is needed for submission | Owner |
| Deadline | Handover states 3:00 PM on 31 Oct 2026, with the video by 2:30 PM. Stop adding scope when a milestone slips. | Everyone |

---

## 16. TTS (read aloud): proposed, not built

Nothing speech-related exists in the code. A design has been researched and is waiting for a decision from the owner. Summary:
- OpenRouter serves Kokoro (`hexgrad/kokoro-82m`) through `POST /api/v1/audio/speech` with the same key. Kokoro covers English but **not Malay or Indonesian**. Indonesian has verified voices on `microsoft/mai-voice-2.1-flash`. No OpenRouter speech model lists a Malay voice, so Malay would fall back to the browser's `speechSynthesis`.
- Request MP3 explicitly; the default is raw PCM that `<audio>` cannot play.
- Planned split: Person 3 builds a speakable-text and chunking helper, an OpenRouter call, and a `/api/tts` route. You would build a `useSpeech` hook and a `ListenButton`, unlocking the audio element inside the tap handler (iOS), playing short sentence chunks as they arrive, and falling back to the browser voice. About an hour each.
- It is an accessibility add-on, not part of the Gemma track. Treat it as P1, after the app is served and deployed.

---

## 17. Frontend definition of done

- [ ] Next.js added; `npm run dev` serves the existing `/api/*` routes; `npm test` still passes.
- [ ] Passport: description in, editable profile out, unknowns highlighted, founder confirms.
- [ ] Challenges: three cards with `Synthetic Demo` labels and filters.
- [ ] Match detail: score with breakdown, reasons, unknowns, Gemma explanation or a clear fallback, withheld list with reasons, capability-tag chips.
- [ ] POC Builder: editable proposed plan, banner, question lists, `review_notes`, progress state for 14 to 26 s.
- [ ] Deals: save as `qualified`, timeline, only allowed next stages offered, one manual next action, persists after refresh on the same device.
- [ ] Insights: funnel with numerator and denominator; real and synthetic separate.
- [ ] Every error code handled with the behaviour in section 7; every AI call has loading and error states.
- [ ] Badge logic: Gemma only when `meta.source === "gemma"`; "Demo fixture" otherwise.
- [ ] Works at 390 px on a real phone; keyboard focus visible; no horizontal scroll.
- [ ] Deployed URL works with a server-side key (and the key is not in the client bundle).

## 18. Where to find things

| Need | File |
|---|---|
| API contract with examples and error table | `docs/api-contract.md`, `src/lib/contract.ts` |
| Real example responses | `src/lib/ai/fixtures/*.json` |
| How the two halves were joined, and why | `docs/integration-plan.md` |
| AI results, open issues, how to run evals | `docs/ai-evaluation.md` |
| Original product spec and screen design | `reference/ASEAN_BridgeAI_Gemma4_Implementation_Handover.md` (sections 2, 21 to 27), outside the repo |
| Run the whole flow with real Gemma | `npm run golden:live` (needs the key in your shell) |
