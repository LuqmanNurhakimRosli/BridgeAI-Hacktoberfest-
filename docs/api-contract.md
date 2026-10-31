# API contract — AI-backed routes

Source of truth in code: [`src/lib/contract.ts`](../src/lib/contract.ts) (Zod schemas, importable by the frontend).
Ready-made examples: `src/lib/ai/fixtures/*.json`, generated from the real handlers by `npm run fixtures`.
Extra response fields may be added at any time (additive). Fields are not renamed or removed without a contract change.

## Rules the frontend must follow

1. **Profile conversion.** `/api/analyze` returns `missing_fields` and `confidence_notes`. `/api/demand/matches` and `/api/poc` reject unknown fields. Convert with `toRequestProfile(profile)` (drops those two).
2. **Founder confirms before matching.** `needs_founder_confirmation` is always `true`. Show the profile as editable. Never send an unconfirmed profile on.
3. **Capability tags: use chips, not free text.** The matcher gives must-have credit only when a tag exactly equals a challenge `must_have` string (case-insensitive). Live test with real Gemma: it suggested `"ai leaf-disease detection"` → score **60**; tags picked from the challenge's `must_have` (`crop disease detection`, `mobile workflow`) → score **75**. Show `must_have` strings from `/api/challenges` as selectable chips, pre-selecting any that match a suggested tag.
4. **`ai_analysis` can be `null` on any match**, even when `ai_status` is `ok` (the model may explain only some candidates). Show the deterministic `reasons` and `unknowns` instead. Never invent text.
5. **Badge.** Show "Powered by Gemma 4 via OpenRouter" only when `meta.source === "gemma"`. For `"fixture"` show "Demo fixture". `meta` is `null` on `/api/demand/matches` when the model did not run.
6. **A POC is a proposal.** `plan.status` is always `"proposed"` and `draft_only` is `true`. Show `review_notes` (for example a missing discovery or consent milestone) beside the plan.
7. **Errors.** Every error is `{ "error": { "code", "message" } }`. Messages are safe to show. They never say whether the key, credits or provider was the cause.

## POST /api/analyze

Request: `{ "description": string (1–3000 chars), "locale"?: "en" | "ms" | "id" }`

Response `200`: `{ profile, needs_founder_confirmation: true, meta }`
`profile`: `startup_name, description, industry, home_country, target_country, stage, product, primary_goal, needs[], capability_tags[], missing_fields[], confidence_notes[]`. Unknowns are `null` and listed in `missing_fields`. `industry` is normalised to `AgriTech | AI | FinTech | HealthTech | EdTech | Logistics | CleanTech`, or kept as written. Emails and URLs are never present in model-written fields. `description` is the founder's text, verbatim.

## POST /api/demand/matches

Request: `{ startup_profile, demand_ids?: string[] (max 5) }` — `target_country`, `stage` and `primary_goal` are required, otherwise `422 PROFILE_INCOMPLETE`.

Response `200`:
```json
{
  "matches": [{ "demand_id": "DEMO-CH-001", "score": 75, "score_breakdown": {}, "reasons": [], "unknowns": [],
                "hard_eligibility": "needs_verification", "withheld_reasons": [],
                "ai_analysis": { "demand_id": "", "why_match": "", "fit_gaps": [], "next_action": "",
                                 "evidence_for_fit": [], "missing_evidence": [] } }],
  "withheld": [{ "demand_id": "DEMO-VC-001", "withheld_reasons": ["goal_mismatch"] }],
  "ai_status": "ok | unavailable | invalid_output | not_run",
  "meta": { "source": "gemma", "model": "", "provider": "", "prompt_version": "", "latency_ms": 0, "repaired": false },
  "data_notice": "Includes synthetic demo records. ..."
}
```
`score` is computed by the backend and never changed by the model. `ai_status` other than `ok` means the scores are still valid and `ai_analysis` is `null`.

## POST /api/poc

Request: `{ startup_profile, demand_id, duration_days?: 60–90 (default 75), match_id?: string }`

Response `200`: `{ plan, draft_only: true, model, notice, review_notes[], meta }`
`plan`: `objective, scope?, milestones[1–4] {day 0..N, action, owner: startup|partner|joint}, success_criteria[] {metric, target, validation_method}, preconditions[], ip_questions[], data_sharing_questions[], liability_questions[], possible_conversion_to_paid, roles_and_responsibilities[], budget_questions[], local_regulatory_checks[], assumptions[], next_action?` plus server-set `demand_id`, `status: "proposed"`, `proposed_duration_days`.
Legal, IP, data and liability items are questions for advisers, not legal advice. `possible_conversion_to_paid` is a hypothesis.

## Errors

| HTTP | `code` | When | Notes |
|---:|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad body, unknown field, bad duration, body over 16 KB | |
| 404 | `UNKNOWN_DEMAND` | `demand_id` not in the catalog | |
| 422 | `PROFILE_INCOMPLETE` | Missing `target_country`, `stage` or `primary_goal` | |
| 429 | `RATE_LIMITED` | More than 20 AI requests per minute per client | In-memory, best effort |
| 429 | `UPSTREAM_RATE_LIMIT` | Model provider is rate limiting | `Retry-After` header |
| 502 | `INVALID_MODEL_OUTPUT` | Output still invalid after one repair | Never a fake result |
| 503 | `AI_UNAVAILABLE` | No key, rejected key, no credits, provider down or timeout after one retry | |
| 501 | `NOT_IMPLEMENTED` | `/api/deals*`, `/api/metrics` | Deals are browser-only in P0 |

On `/api/demand/matches` the AI failures (`unavailable`, `invalid_output`) do not become errors: the response is `200` with scores and `ai_status` set.

## Latency

Measured live (Gemma 4 via OpenRouter, 31 Oct 2026): analyze ≈ 3–4 s, matches ≈ 4–7 s, poc ≈ 14–26 s (the high value included a repair call). Show a progress state for POC drafting, and check the hosting platform's function timeout before deploying.
