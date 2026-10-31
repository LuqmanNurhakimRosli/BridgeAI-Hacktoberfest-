// Generates the frontend fixtures by running the REAL routes and handlers against a scripted network.
//   npm run fixtures        -> rewrites src/lib/ai/fixtures/*.json
// tests/fixtures.test.ts re-runs buildFixtures() and fails if the files on disk are out of date.
// Every fixture is labelled meta.source = "fixture": the UI must show "Demo fixture", never the Gemma badge.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { route } from '../src/lib/api';
import { handleAnalyze } from '../src/handlers/analyze';
import { handleDemandMatches } from '../src/handlers/demand-matches';
import { handlePoc } from '../src/handlers/poc';
import { toRequestProfile } from '../src/lib/contract';
import type { TaskDeps } from '../src/lib/ai';

const config = {
  apiKey: 'fixture-key', model: 'google/gemma-4-26b-a4b-it', baseUrl: 'https://openrouter.ai/api/v1',
  appUrl: 'http://localhost:3000', timeoutMs: 1000,
};

type Step = { status: number; body?: unknown; headers?: Record<string, string> };
const chat = (content: string): Step => ({
  status: 200,
  body: { model: config.model, provider: 'fixture', choices: [{ message: { role: 'assistant', content } }], usage: { prompt_tokens: 0, completion_tokens: 0 } },
});

function network(steps: Step[]): TaskDeps {
  const queue = [...steps];
  const fetchImpl = (async () => {
    const next = queue.shift();
    if (!next) throw new Error('fixture network: no more scripted steps');
    return new Response(JSON.stringify(next.body ?? {}), { status: next.status, headers: next.headers });
  }) as unknown as typeof fetch;
  return { fetchImpl, config, sleep: async () => {} };
}

let ip = 0;
async function call(handler: (req: Request, deps: TaskDeps) => Promise<Response>, path: string, body: unknown, deps: TaskDeps) {
  const req = new Request(`http://fixtures${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.9.0.${++ip}` },
    body: JSON.stringify(body),
  });
  const res = await route((r) => handler(r, deps), { ai: true })(req);
  const retryAfter = res.headers.get('Retry-After');
  return { status: res.status, ...(retryAfter ? { retry_after_header: retryAfter } : {}), body: (await res.json()) as Record<string, any> };
}

// Marks metadata as canned so the UI cannot mistake a fixture for a live Gemma call.
function labelled(body: Record<string, any>): Record<string, any> {
  if (body.meta) body.meta = { ...body.meta, source: 'fixture', provider: null, latency_ms: 0 };
  return body;
}

const FOUNDER_TEXT =
  'We are AgriSmart, a Malaysian seed-stage startup building phone-based AI leaf-disease detection. We need an Indonesian company with a real field-pilot problem to solve.';

const passport = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    startup_name: 'AgriSmart', description: FOUNDER_TEXT, industry: 'AgriTech', home_country: 'Malaysia', target_country: 'Indonesia',
    stage: 'Seed', product: 'Phone-based AI leaf-disease detection', primary_goal: 'Pilot Partnership',
    needs: ['An Indonesian company with a field-pilot problem'], capability_tags: ['crop disease detection', 'mobile workflow'],
    missing_fields: [], confidence_notes: ['Stage "seed-stage" stated by founder', 'Target country stated by founder'],
    ...over,
  });

const explanation = JSON.stringify({
  explanations: [{
    demand_id: 'DEMO-CH-001',
    why_match: "AgriSmart's phone-based leaf-disease detection addresses the crop disease detection requirement in this synthetic challenge.",
    fit_gaps: ['Confirm offline operation (nice-to-have).', 'Field-test evidence is not provided.'],
    next_action: 'Prepare a short discovery questionnaire before proposing a pilot.',
    evidence_for_fit: ['Founder states phone-based disease detection', 'Stated target country is Indonesia'],
    missing_evidence: ['No field-test results provided', 'Offline operation not confirmed'],
  }],
});

const plan = JSON.stringify({
  objective: 'Test whether phone-based leaf-disease screening can run at a small group of farms in this synthetic challenge.',
  scope: 'Proposed field screening at a small number of farms, using agreed crop images and an agreed evaluation method.',
  milestones: [
    { day: 0, action: 'Discovery meeting to confirm the problem and the buyer requirements', owner: 'joint' },
    { day: 14, action: 'Data-access and consent confirmation for crop images', owner: 'partner' },
    { day: 45, action: 'Field screening run at agreed farms, with weekly review notes', owner: 'startup' },
    { day: 75, action: 'Joint review of results against the proposed success criteria', owner: 'joint' },
  ],
  success_criteria: [{ metric: 'Screening agreement with expert review on a sampled set of images', target: 'Proposed target to be agreed before the run', validation_method: 'Expert re-check of a sampled subset, agreed in advance' }],
  preconditions: ['Farmer consent for crop images', 'A named field contact at the partner'],
  ip_questions: ['Who owns any improvements made to the model during the pilot?'],
  data_sharing_questions: ['Which crop images may be used and stored, and for how long?'],
  liability_questions: ['Who is responsible if a screening result leads to a wrong crop treatment?'],
  budget_questions: ['Is there a pilot budget, and who pays for field time?'],
  local_regulatory_checks: ['Confirm with a qualified adviser whether agricultural or data rules apply in Indonesia.'],
  roles_and_responsibilities: ['Startup: provide the detection tool and a field workflow guide (proposed)', 'Partner: nominate farms and a field contact (proposed)'],
  assumptions: ['Partner farms are willing to participate', 'Images can be collected lawfully'],
  possible_conversion_to_paid: 'Hypothesis only: a paid pilot could follow if the agreed criteria are met. This is not a promise.',
  next_action: 'Hold the discovery meeting. No pilot work starts before the consent check.',
});

export async function buildFixtures(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};

  const a = await call(handleAnalyze, '/api/analyze', { description: FOUNDER_TEXT }, network([chat(passport())]));
  out['analyze-agrismart.json'] = labelled(a.body);

  const incompleteText = 'We build an app that helps people manage their farms.';
  const inc = await call(handleAnalyze, '/api/analyze', { description: incompleteText }, network([chat(passport({
    startup_name: null, description: incompleteText, industry: null, home_country: null, target_country: null, stage: null,
    product: 'Farm management app', primary_goal: null, needs: [], capability_tags: [], missing_fields: [],
    confidence_notes: ['Industry is not stated; "farms" alone does not confirm AgriTech'],
  }))]));
  out['analyze-incomplete.json'] = labelled(inc.body);

  const profile = toRequestProfile(a.body.profile);
  const m = await call(handleDemandMatches, '/api/demand/matches', { startup_profile: profile }, network([chat(explanation)]));
  out['matches-agrismart.json'] = labelled(m.body);

  const p = await call(handlePoc, '/api/poc', { startup_profile: profile, demand_id: 'DEMO-CH-001' }, network([chat(plan)]));
  out['poc-agrismart.json'] = labelled(p.body);

  const errors: Record<string, unknown> = {};
  const incompleteProfile = { ...profile, stage: null };
  errors.profile_incomplete = await call(handleDemandMatches, '/api/demand/matches', { startup_profile: incompleteProfile }, network([]));
  errors.unknown_demand = await call(handlePoc, '/api/poc', { startup_profile: profile, demand_id: 'DEMO-NOPE' }, network([]));
  errors.validation_error = await call(handleAnalyze, '/api/analyze', { description: '' }, network([]));
  errors.ai_unavailable = await call(handlePoc, '/api/poc', { startup_profile: profile, demand_id: 'DEMO-CH-001' }, network([{ status: 500 }, { status: 500 }]));
  errors.rate_limited = await call(handlePoc, '/api/poc', { startup_profile: profile, demand_id: 'DEMO-CH-001' }, network([{ status: 429, headers: { 'retry-after': '30' } }]));
  errors.invalid_model_output = await call(handlePoc, '/api/poc', { startup_profile: profile, demand_id: 'DEMO-CH-001' }, network([chat('not json'), chat('still not json')]));
  out['errors.json'] = errors;

  return out;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/lib/ai/fixtures');
  mkdirSync(dir, { recursive: true });
  buildFixtures().then((files) => {
    for (const [name, data] of Object.entries(files)) writeFileSync(resolve(dir, name), JSON.stringify(data, null, 2) + '\n');
    console.log(`Wrote ${Object.keys(files).length} fixtures to src/lib/ai/fixtures`);
  });
}
