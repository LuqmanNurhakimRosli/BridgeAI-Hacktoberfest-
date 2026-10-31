// Live golden path through the real routes and handlers, with the real Gemma call.
//   OPENROUTER_API_KEY=... npm run golden:live
// Runs analyze -> matches -> poc twice: with the capability tags Gemma suggested, and with tags the founder
// would confirm from the challenge's must-have list. Exits 1 if a hard check fails. Prints no secrets.

import { route } from '../src/lib/api';
import { handleAnalyze } from '../src/handlers/analyze';
import { handleDemandMatches } from '../src/handlers/demand-matches';
import { handlePoc } from '../src/handlers/poc';
import { demandById } from '../src/lib/catalog';
import { readAiConfig } from '../src/lib/ai/config';
import { analyzeResponseSchema, matchesResponseSchema, pocResponseSchema, toRequestProfile } from '../src/lib/contract';

const DEFAULT_TEXT =
  'We are AgriSmart, a Malaysian seed-stage startup building phone-based AI leaf-disease detection. We need an Indonesian company with a real field-pilot problem to solve.';
const textArg = process.argv.indexOf('--text');
const FOUNDER_TEXT = textArg > -1 ? process.argv[textArg + 1] : DEFAULT_TEXT;
const DEMAND_ID = 'DEMO-CH-001';

let ip = 0;
async function post(handler: (req: Request) => Promise<Response>, path: string, body: unknown) {
  const req = new Request(`http://golden${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.8.0.${++ip}` },
    body: JSON.stringify(body),
  });
  const started = Date.now();
  const res = await route(handler, { ai: true })(req);
  return { status: res.status, ms: Date.now() - started, json: (await res.json()) as any };
}

const failures: string[] = [];
function check(label: string, ok: boolean, detail = '') {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures.push(label);
}

async function main() {
  readAiConfig(); // fails fast, without printing anything secret
  const demand = demandById.get(DEMAND_ID)!;

  console.log('1. POST /api/analyze');
  const a = await post(handleAnalyze, '/api/analyze', { description: FOUNDER_TEXT });
  check('200 and matches the response contract', a.status === 200 && analyzeResponseSchema.safeParse(a.json).success, `${a.ms} ms`);
  if (a.status !== 200) {
    console.log('   error:', a.json?.error);
    process.exitCode = 1;
    return;
  }
  const analyzed = analyzeResponseSchema.parse(a.json);
  check('meta.source is gemma', analyzed.meta.source === 'gemma', `${analyzed.meta.model} via ${analyzed.meta.provider ?? 'unknown'}, repaired=${analyzed.meta.repaired}`);
  const p = analyzed.profile;
  console.log(`   industry=${p.industry} home=${p.home_country} target=${p.target_country} stage=${p.stage} goal=${p.primary_goal}`);
  console.log(`   suggested capability_tags: ${JSON.stringify(p.capability_tags)}`);
  console.log(`   missing_fields: ${JSON.stringify(p.missing_fields)}`);
  check('target country, stage and goal were extracted (needed for matching)', Boolean(p.target_country && p.stage && p.primary_goal));

  const variants: Array<[string, string[]]> = [
    ['A. tags as Gemma suggested', p.capability_tags],
    [`B. tags confirmed from ${DEMAND_ID} must_have`, demand.must_have],
  ];

  for (const [name, tags] of variants) {
    console.log(`\n${name}  ${JSON.stringify(tags)}`);
    const profile = { ...toRequestProfile(p), capability_tags: tags };

    const m = await post(handleDemandMatches, '/api/demand/matches', { startup_profile: profile, demand_ids: [DEMAND_ID] });
    const parsed = matchesResponseSchema.safeParse(m.json);
    check('matches: 200 and matches the response contract', m.status === 200 && parsed.success, `${m.ms} ms`);
    if (!parsed.success) continue;
    const hit = parsed.data.matches.find((x) => x.demand_id === DEMAND_ID);
    check('matches: demand present with a backend score', Boolean(hit), hit ? `score=${hit.score}` : '');
    check('matches: Gemma explanation returned', parsed.data.ai_status === 'ok' && Boolean(hit?.ai_analysis), `ai_status=${parsed.data.ai_status}`);
    if (hit?.ai_analysis) console.log(`   why_match: ${hit.ai_analysis.why_match}`);

    const q = await post(handlePoc, '/api/poc', { startup_profile: profile, demand_id: DEMAND_ID });
    const poc = pocResponseSchema.safeParse(q.json);
    check('poc: 200 and matches the response contract', q.status === 200 && poc.success, `${q.ms} ms`);
    if (poc.success) {
      check('poc: status proposed, 75 days, draft only', poc.data.plan.status === 'proposed' && poc.data.plan.proposed_duration_days === 75 && poc.data.draft_only);
      check('poc: starts with a discovery step and has no review notes', poc.data.review_notes.length === 0, poc.data.review_notes.join('; '));
      console.log(`   objective: ${poc.data.plan.objective}`);
      console.log(`   milestones: ${poc.data.plan.milestones.map((x) => `d${x.day} ${x.owner}`).join(', ')}  repaired=${poc.data.meta.repaired}`);
    } else {
      console.log('   error:', q.json?.error);
    }
  }

  console.log(failures.length ? `\n${failures.length} check(s) failed:\n- ${failures.join('\n- ')}` : '\nAll checks passed.');
  if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Golden path failed:', (err as { code?: string }).code ?? 'UNKNOWN');
  process.exitCode = 1;
});
