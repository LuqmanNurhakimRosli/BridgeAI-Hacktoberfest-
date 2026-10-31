# ASEAN BridgeAI

A Gemma 4-powered, mobile-first assistant that connects ASEAN startups to documented corporate demand: it builds an editable Startup Passport, matches it to challenges with a transparent score, explains the fit, and drafts a *proposed* cross-border proof-of-concept. It does not send email, sign anything, or claim a deal exists.

Hackathon track: Category A, Best Use of Gemma 4.

## Status

| Area | State |
|---|---|
| Backend routes, matcher, deal state machine, KPI maths | Done (Person 2) |
| Gemma AI layer (`src/lib/ai`), evals, fixtures | Done (Person 3) |
| Routes call the AI layer; one OpenRouter client | Done (this branch) |
| Frontend (Next.js app) | **Not in this repo yet.** `package.json` has no `next` or `react`, so `src/app/api/*/route.ts` cannot be served until it is added. |
| Deployment | Blocked on the frontend scaffold |
| Server-side deals and metrics | Not implemented (`501`). Deals are browser-only in P0. |

## Setup

```bash
npm install
cp .env.example .env.local     # then add your OpenRouter key; never commit it
npm test                       # offline, no network
npm run typecheck
```

| Variable | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | Server-side only. Never prefix with `NEXT_PUBLIC_`. |
| `OPENROUTER_MODEL` | Default `google/gemma-4-26b-a4b-it` |
| `OPENROUTER_BASE_URL` | Default `https://openrouter.ai/api/v1` |
| `APP_URL` | Sent as the OpenRouter referer |

## Scripts

| Script | What it does | Needs key |
|---|---|:---:|
| `npm test` | All unit, route, integration and fixture tests | no |
| `npm run typecheck` | `tsc --noEmit` over `src`, `tests`, `scripts` | no |
| `npm run fixtures` | Regenerates `src/lib/ai/fixtures/*.json` from the real handlers | no |
| `npm run eval:ai` | Validates the evaluation case files | no |
| `npm run smoke:openrouter` | One real call to check key, model, tools | yes |
| `npm run golden:live` | Real analyze → matches → poc through the routes | yes |
| `npm run eval:ai:live` | Real evaluation over all case sets; writes `docs/ai-eval-report.json` | yes |

## How it fits together

```
src/app/api/*/route.ts     HTTP routes (rate limit, error envelope)
src/handlers/*             thin handlers: validate -> backend logic -> AI service -> response
src/lib/                   backend: matcher, catalog, deal state machine, KPIs, errors, schemas
src/lib/ai/                Gemma layer: one OpenRouter transport, prompts, output schemas, guards, services
src/lib/contract.ts        public response schemas (importable by the frontend)
src/data/                  synthetic demo catalog (labelled synthetic_demo)
```

Principle: the backend decides scores, IDs, eligibility, stage changes and KPIs. Gemma extracts, explains and drafts. Everything it returns is validated, and the guards in `src/lib/ai/postvalidate.ts` run in code, not in prompts: unknown IDs are dropped, contact details are removed, a POC is always `proposed`, and outcomes stated as done are rejected.

- Frontend handover (start here if you build the UI): [docs/frontend-handover.md](docs/frontend-handover.md)
- API reference and frontend rules: [docs/api-contract.md](docs/api-contract.md)
- AI evaluation results and open issues: [docs/ai-evaluation.md](docs/ai-evaluation.md)
- Integration plan and decisions: [docs/integration-plan.md](docs/integration-plan.md)

## Ownership

| Area | Owner |
|---|---|
| Routes, handlers, `src/lib/*` (non-AI), data | Person 2 |
| `src/lib/ai/*`, `evals/`, AI scripts | Person 3 |
| Frontend, PWA | Person 1 |
| README, licence, video, submission | Person 4 / team |

## Limitations

- All catalog records are fictional and labelled `synthetic_demo`. No real company, investor or grant is represented.
- Scores are rule-based compatibility only, not a probability of funding or success.
- No fine-tuning: model quality comes from prompting, validation and evaluation. OpenRouter calls do not change model weights.
- Local-only persistence for deals in P0. No authentication, no sensitive documents.
- Evaluation sets are small and partly used for tuning; see the evaluation log for numbers and open failures.
