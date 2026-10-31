# Integration Plan — Backend (Person 2) + Gemma AI layer (Person 3)

Status: **proposal, nothing executed yet.** Date: 31 Oct 2026.

## 1. What is wrong today

The repo holds two working halves that were built separately and overlap.

| Area | Person 2 (backend) | Person 3 (AI layer) | Problem |
|---|---|---|---|
| Model transport | `src/lib/model.ts` (`openai` SDK, `ModelClient`, `completeJson`) | `src/lib/ai/call-gemma.ts` (fetch, `callGemma`) | Two OpenRouter clients; two retry and error policies |
| Prompts | `src/lib/prompts.ts` (`passport-v1`, no versions for others) | `src/lib/ai/prompt-templates.ts` (`passport-v3`, versioned) | Two sets of prompts that can drift |
| Output schemas | `src/lib/schemas.ts` | `src/lib/ai/schemas.ts` | Different field names and limits (see section 3) |
| Errors | `AppError` + `ERROR_STATUS` | `AiError` (more codes) | Two error types; one public envelope needed |
| Guards | ID filter in the matches handler, `status: proposed` in the POC handler | ID grounding, contact scrub, overclaim check, industry taxonomy, forced status | Backend routes get none of the extra guards |
| Tests | `tests/*.test.ts` (45), fake `ModelClient` | `tests/ai/ai.test.ts` (49), fake `llm` | Two fakes, two styles |
| Evals | none | `evals/v2`, `scripts/eval-ai.ts` | Evals test my services, not the routes the app calls |

**Nothing in the routes calls `src/lib/ai` today.** The Gemma behaviour that was live-tested is not the behaviour behind `/api/*`.

### Findings that change the design
1. **The Passport never produces `capability_tags`.** The matcher gives must-have credit only for founder-declared `capability_tags`. Real Gemma output has none, so the AgriSmart golden path scores **60, not 75** (sector 30 + geography 15 + stage 15). The tests pass only because `tests/helpers.ts` hard-codes the tags.
2. **Match explanation direction differs.** Backend: one startup, many demands, keyed by `demand_id`. Mine: one demand, many startups, keyed by `startup_id`. The P0 flow is the backend's direction.
3. **No frontend and no Next.js in the repo.** `package.json` has no `next`, `react` or Tailwind, so `src/app/api/*/route.ts` cannot be served yet. Real HTTP integration testing is blocked until Person 1 pushes a scaffold. Until then, test by calling handlers with `Request` objects (the style `routes.test.ts` already uses).
4. **Parent folder is cluttered:** loose duplicate `src/`, `tests/`, `scripts/`, `evals/`, `docs/` next to the real repo `BridgeAI-Hacktoberfest-/`.
5. **Nothing is pushed.** GitHub has `main` and `feat/backend-matching` only. Local `main` is 2 commits ahead.

## 2. Target architecture

```
HTTP route (src/app/api/*)           -> backend owns: request validation, rate limit, catalog, scoring, FSM, KPIs
  handler (src/handlers/*)           -> thin: validate -> backend logic -> call AI service -> shape response
    AI service (src/lib/ai/*)        -> AI owner owns: transport, prompts, output schemas, guards, metadata
      callGemma -> OpenRouter -> Gemma 4
```

- **One transport:** `src/lib/ai/call-gemma.ts`. `src/lib/model.ts` and `src/lib/prompts.ts` are retired.
- **One public error envelope** `{ error: { code, message } }`, produced by `AppError` at the handler boundary. `AiError` is translated there.
- **Backend keeps ownership of:** `demand-matcher.ts`, `catalog.ts`, `deal-fsm.ts`, `kpi-metrics.ts`, `api.ts`, deals and metrics routes. No change to these.
- **Public response shapes stay as the backend shipped them** (additive fields only), because they are already merged and tested.

## 3. Decisions to confirm (recommended default in bold)

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | Which response contract wins | Backend shapes / my shapes | **Backend shapes, extended with optional fields.** My schemas change to match. |
| D2 | Retire `model.ts` and `prompts.ts` | Yes / keep both | **Yes, after Person 2 agrees** (handover: backend imports the AI owner's client). |
| D3 | POC length of milestones | Backend: max 4, day 0..N; mine: max 6, day 1..120 | **Backend's** (also matches handover 8.6) |
| D4 | Match explanation shape | `why_match / fit_gaps / next_action` vs my richer fields | **Keep the backend's three fields**; add optional `evidence_for_fit` and `missing_evidence` |
| D5 | `capability_tags` | Extract in Passport / founder types them | **Both:** Passport suggests tags, labelled self-reported, founder edits before matching |
| D6 | Public AI error codes | Expose my detailed codes / map to backend codes | **Map to `AI_UNAVAILABLE`, `UPSTREAM_RATE_LIMIT`, `INVALID_MODEL_OUTPUT`**; never expose key or billing details |
| D7 | Where the handover and plan docs live | Repo `docs/` / parent folder only | **Your call.** Putting them in the repo publishes them on GitHub. |

### Contract mapping (D1, D3, D4)

| Endpoint | Existing public shape (kept) | Added, optional |
|---|---|---|
| `POST /api/analyze` | `{ profile, meta: { model, prompt_version } }` | `meta.source`, `meta.provider`, `meta.latency_ms`, `meta.repaired`; `profile.capability_tags` |
| `POST /api/demand/matches` | `ai_analysis: { why_match, fit_gaps[≤3], next_action }`, `ai_status`, `withheld` | `ai_analysis.evidence_for_fit`, `ai_analysis.missing_evidence`; `meta` |
| `POST /api/poc` | `plan: { objective, milestones≤4, success_criteria, preconditions, ip_questions, data_sharing_questions, liability_questions, possible_conversion_to_paid, demand_id, status, proposed_duration_days }`, `draft_only`, `notice` | `scope`, `budget_questions`, `local_regulatory_checks`, `assumptions`, `next_action`; `meta` |

My schema renames: `security_and_liability_questions` → `liability_questions`; milestone `day` 0..duration; milestones ≤ 4.

## 4. Phases

Rough effort in brackets. Each phase ends with `npm test` and `npm run typecheck` green.

### Phase 0 — Safety and housekeeping [10 min]
1. Confirm D1–D7 above. Tell Person 2 which files change: `model.ts`, `prompts.ts`, `schemas.ts` (model-output part), the three handlers, `routes.test.ts`, `helpers.ts`.
2. `diff -r` the loose parent-folder copies against the repo copies. If identical, delete the loose copies (they are duplicates; the repo and git hold the originals). If not identical, stop and list the differences.
3. Move `Person3_Gemma_AI_Implementation_Plan.md` out of the parent folder (it already exists as `docs/Person3_Gemma_AI_Implementation_Plan.md`).
4. Create branch `feat/integrate-ai` from local `main`. Do not push yet.

Resulting parent folder: `OctoberFest/` → `BridgeAI-Hacktoberfest-/` (the repo) and, depending on D7, `reference/` with the two handover files.

### Phase 1 — Contract freeze [15 min]
1. Add `docs/api-contract.md`: request and response examples for `/api/analyze`, `/api/demand/matches`, `/api/poc`, error envelope and codes.
2. Update my fixtures in `src/lib/ai/fixtures/` to the frozen shapes (they currently use my field names). Person 1 will build against these.

### Phase 2 — One transport, one error type [25 min]
1. Align `src/lib/ai/schemas.ts` with D1–D6 (renames, limits, optional fields, `capability_tags`).
2. Add `src/lib/ai/to-app-error.ts`: `AiError` → `AppError` mapping (D6). `AI_UNAVAILABLE` → 503, `UPSTREAM_RATE_LIMIT` → 429 with `Retry-After`, `INVALID_MODEL_OUTPUT` → 502.
3. Add a `ModelClient`-compatible adapter on top of `callGemma` (single retry owner) so handlers can be migrated one at a time without breaking tests.
4. Add `explainMatchesForStartup({ profile, demands })` to the reasoning service (P0 direction, keyed by `demand_id`). Keep the existing direction for P1.

### Phase 3 — Rewire handlers [35 min]
Order, with tests passing after each:
1. `handlers/analyze.ts` → `extractStartupProfile` (adds contact scrub, industry taxonomy, `capability_tags`, meta).
2. `handlers/poc.ts` → `generatePocPlan` (adds overclaim repair, discovery/consent warnings). Server still sets `status`, `demand_id`, `proposed_duration_days`.
3. `handlers/demand-matches.ts` → `explainMatchesForStartup`. Scores, withheld list and `ai_status` logic unchanged.
4. Delete `src/lib/model.ts` and `src/lib/prompts.ts`. Move `NOTICE_SYNTHETIC` to a small shared constants file. Remove the unused `openai` dependency.
5. Migrate `tests/helpers.ts` `fakeModel` to the `llm` fake used in `tests/ai`. Keep every existing assertion in `routes.test.ts`; change only the fake plumbing.

### Phase 4 — Integration tests [30 min]
- **Contract tests:** every handler response parses against the frozen response schema; error envelope on every failure path.
- **Golden path (offline):** analyze → founder confirms tags → matches (`DEMO-CH-001`, score 75, `needs_verification`) → POC (75 days, `proposed`).
- **Failure paths through the real handlers:** 401, 402, 404, 429 (with `Retry-After`), timeout and invalid JSON each give the right status and envelope, with no key text or provider detail.
- **Guards at route level:** injected contact in Passport removed; invented `demand_id` dropped; `status: agreed` from the model ignored; "already signed" POC repaired.
- **Regression:** the existing 45 backend tests and 49 AI tests still pass (some move files).
- **Add `scripts/golden-path.ts`:** runs analyze → matches → poc by calling handlers directly with `Request` objects, so no Next.js server is needed.

### Phase 5 — Live verification [15 min, uses the OpenRouter key]
1. `npm run smoke:openrouter` (capability check, current provider).
2. `scripts/golden-path.ts --live`: record real score, latencies, any repair.
3. Re-run `npm run eval:ai:live` and update `docs/ai-evaluation.md` with the post-integration numbers.
4. Confirm the golden-path score is 75 with real Gemma-produced tags, or document the actual number.

### Phase 6 — Project management and docs [15 min]
- `package.json`: rename from `backend` to `asean-bridgeai`; keep the scripts.
- `.env.example`: add `OPENROUTER_BASE_URL`; keep key placeholder only.
- `README.md`: replace "backend P0 in progress" with setup, scripts (`test`, `typecheck`, `eval:ai`, `smoke:openrouter`), folder map, ownership table, and the synthetic-data and no-fine-tuning statements.
- `docs/ai-evaluation.md`: add the integration results and the open items.
- Commit in small steps on `feat/integrate-ai`. Open one PR to `main` with Person 2 as reviewer. Push only after your approval.

## 5. Final folder map

```
OctoberFest/
  BridgeAI-Hacktoberfest-/        <- the only project folder
    src/app/api/*                 routes (Person 2)
    src/handlers/*                thin handlers (Person 2)
    src/lib/                      backend logic: matcher, catalog, FSM, KPI, api, errors, schemas (Person 2)
    src/lib/ai/                   Gemma layer: transport, prompts, schemas, guards, services, fixtures (Person 3)
    tests/                        backend tests + tests/ai + integration tests
    evals/v2/                     AI case sets
    scripts/                      smoke, eval, golden-path
    docs/                         api-contract, integration-plan, ai-evaluation, person plans
  reference/ (optional, D7)       handover + starter prompt
```

## 6. Risks

| Risk | Mitigation |
|---|---|
| Person 2 edits the same files while I rewire them | Agree a freeze on `model.ts`, `prompts.ts`, `schemas.ts`, handlers and `routes.test.ts`, or work on top of their latest branch; PR with them as reviewer |
| Breaking the 45 backend tests | Keep all assertions; migrate fakes first; run the suite after every handler change |
| Contract change breaks Person 1 | Backend shapes stay; only optional fields are added; updated fixtures and `docs/api-contract.md` delivered before they build |
| Real Gemma returns fewer tags, so golden path scores 60 | D5: Passport suggests tags, founder confirms; document the real number |
| No Next.js yet, so no real HTTP test or deploy | Handler-level and `golden-path.ts` tests now; one `next dev` smoke when Person 1 pushes a scaffold. Deployment needs a Next.js app: flag to the team |
| Live key reused across runs | Rotate the key; keep it in `.env.local` only |

## 7. Done when
- `grep` finds no import of `lib/model` or `lib/prompts`.
- `npm test` and `npm run typecheck` pass.
- Golden path passes offline and live; live numbers recorded.
- Parent folder contains only the repo (plus optional `reference/`).
- PR open to `main`, reviewed by Person 2, and the contract doc delivered to Person 1.
