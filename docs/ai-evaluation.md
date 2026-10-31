# AI Evaluation Log — ASEAN BridgeAI (Gemma 4 via OpenRouter)

Only measured results are recorded here. Targets from the handover are not results.
Raw per-case output of the latest run: `docs/ai-eval-report.json` (written by `npm run eval:ai:live`).
All live runs on 31 Oct 2026, model `google/gemma-4-26b-a4b-it` via OpenRouter, one run per row. Single runs of an LLM vary, so differences of one or two cases between runs are not evidence of improvement or regression.

## 1. Provider capability check (live)

Three calls, `max_tokens` 200.

| Capability | Result | Serving provider (as returned) | Latency | Output |
|---|---|---|---|---|
| Plain chat | Pass | DekaLLM | 911 ms | `READY` |
| JSON schema (`response_format`, strict) | Pass | PrimeIntellect | 1200 ms | valid JSON |
| Tool calling (`tools`, `tool_choice: auto`) | Pass | PrimeIntellect | 3344 ms | `search_opportunities({"country":"Indonesia"})` |

The serving provider changes between calls (DekaLLM, PrimeIntellect and Cloudflare were all seen). Schema and tool support were each checked on one provider. The app does not depend on JSON-schema mode: every output is validated with Zod, with one repair call. The tool loop in `src/lib/ai/tools.ts` is implemented and tested offline, but **no route uses it**; routes use the deterministic backend search.

## 2. Offline tests (no network)

`npm test`: **7 files, 113 tests passing.** `npm run typecheck` is clean over `src`, `tests` and `scripts`.

| File | Tests | Covers |
|---|---:|---|
| `tests/ai/ai.test.ts` | 49 | Transport error mapping and retries, JSON repair, every service and its guards, tool loop, helpers |
| `tests/integration.test.ts` | 18 | Real route → handler → AI service → HTTP transport with a scripted network: golden path, retry after timeout, 401/402/404/429/5xx/timeout and invalid-JSON mapping, key never in a response or request body, guards at route level, data-block escaping |
| `tests/fixtures.test.ts` | 5 | Fixtures match the public contract, are labelled `fixture`, and are up to date with the real handlers |
| `tests/routes.test.ts`, `deal-fsm`, `demand-matcher`, `kpi-metrics` | 41 | Person 2's backend suite (one route-level retry test moved into the integration file, where it runs against the real transport) |

## 3. Live golden path through the real routes

`npm run golden:live` (analyze → matches → poc, real Gemma, real handlers). All checks passed.

| Step | Result | Latency |
|---|---|---:|
| `/api/analyze` | Valid contract; industry AgriTech, Malaysia → Indonesia, Seed, Pilot Partnership | 3.6 s |
| `/api/demand/matches`, tags as Gemma suggested (`["ai leaf-disease detection"]`) | Score **60**; explanation returned | 3.7 s |
| `/api/poc` (same profile) | Proposed, 75 days; **repair call was needed** | 26.4 s |
| `/api/demand/matches`, tags from the challenge `must_have` | Score **75**; explanation returned | 6.7 s |
| `/api/poc` | Proposed, 75 days, no repair | 13.7 s |

Findings:
- **The score depends on tag wording.** The backend matcher gives must-have credit only for exact tag matches. Free-text tags from the model scored 60; tags chosen from the challenge's list scored 75. The UI should offer the `must_have` strings as selectable chips (see `docs/api-contract.md`).
- **POC drafting is slow:** 14–26 s, and one run needed a repair. Check the hosting platform's function timeout before deploying and show a progress state. The cause of that repair was not captured.

## 4. Live evaluation (case sets)

`npm run eval:ai:live`. Two runs are shown: before the integration (run 1) and after (run 2, which exercises the prompts the routes actually use).

| Set | Cases | Run 1 (pre-integration, `passport-v3`) | Run 2 (post-integration, `passport-v4`, `matches-v1`, `poc-v2`) |
|---|---:|---|---|
| Passport | 29 | 25/29 pass; field accuracy 97.9%; unknown-field handling 86.7%; leaks 0; contact leaks 0 | **24/29** pass; field accuracy 96.9%; unknown-field handling 86.7%; leaks 0; contact leaks 0 |
| Reverse match | 8 | IDs 100%; claim-free 100%; missing evidence flagged 100% | Same: 100% / 100% / 100% |
| POC draft | 6 | proposed 100%; no overclaims 100%; discovery and consent milestones 100% | Same: 100% on all four |
| Outreach | 10 | within 180 words 100%; clean 100%; language heuristic 100% | Same: 100% on all three |
| Next action (P1) | 6 | known IDs 100%; no overclaims 100% | known IDs **66.7%**; no overclaims **66.7%**; **2 call errors** (`INVALID_MODEL_OUTPUT`: C-05, C-06) |

Run 2 latency across 57 calls: **p50 3.2 s, p95 11.1 s**. Schema-valid rate for passport 100% in both runs.

### Open issues
**Passport (run 2: MY-02, OT-03, OT-08, INC-01, INC-04).** Four of five are `primary_goal` left `null` (or inferred when it should be unknown) for intent the founder states in plain words: "expand into Thailand", "need market entry", "test it with a Vietnamese distributor". Leaving a goal unknown is the safe direction, because the founder confirms the profile, but it costs the user an extra field. INC-01 (industry inferred as AgriTech from "farms") is the opposite error. The failing cases changed between runs (MY-06 failed in run 1 and passed in run 2), so this is variance around a model that is cautious about goals. Not tuned further: the passport set was used for tuning in run 1 and is no longer a held-out set.

**Next-action coach (P1).** Two of six cases failed validation after the repair in run 2, and it was 100% in run 1. It is not wired to any route and should not be presented as ready.

**Not verified by script.** The `expect_flag` labels of the match, POC and coach cases and the outreach language quality need human review. The outreach language check is a heuristic.

## 5. Behaviour worth knowing
- A candidate description that tried to set its own score and claim a signed agreement (match case M-08): the model refused and flagged it.
- A POC that states an outcome as done ("already signed and paid") is rejected and repaired once; if it fails again the route returns `502 INVALID_MODEL_OUTPUT`, never a fake plan.
- If the model is down, `/api/demand/matches` still returns the backend scores with `ai_status: "unavailable"` and `ai_analysis: null`.

## 6. Changes made after seeing results
1. **Industry taxonomy** (`normalizeIndustry`): "Agriculture", "Fintech" and similar map to `AgriTech`, `FinTech` and so on; the prompt lists the allowed values.
2. **Eval harness fix:** leak and contact checks ran on the founder's verbatim text, which contains injected phrases by design. They now check only model-written fields. An offline run no longer overwrites the live report.
3. **Stricter contact rule:** Passport fields have all emails and URLs removed, even ones the founder typed.
4. **Coach schema:** a literal `"null"` next action is rejected.
5. **Integration:** routes call the AI layer; POC and explanation schemas follow the existing public contract; model-invented keys such as `status` are dropped; prompt data blocks use `<data name="…">` with `<` escaped; Passport now suggests `capability_tags` and respects `locale`. Prompt versions bumped accordingly.

## 7. Known limitations
- One model, one day, one run per row; providers vary by call.
- Small sets (29 / 8 / 6 / 10 / 6 cases); not statistically strong.
- Bahasa outputs need native-speaker review.
- No model weights were trained or fine-tuned; adaptation is prompting, validation and evaluation only.

## 8. How to run
```bash
npm test                      # offline
npm run typecheck
npm run eval:ai               # validates case files, no network
# live (key in the environment or .env.local; never committed)
npm run smoke:openrouter
npm run golden:live
npm run eval:ai:live
```
