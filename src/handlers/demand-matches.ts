import { AppError } from '../lib/errors';
import { demandById, demandBriefs } from '../lib/catalog';
import { missingGateFields, rankDemands, type Assessment } from '../lib/demand-matcher';
import { matchesRequestSchema } from '../lib/schemas';
import { NOTICE_SYNTHETIC } from '../lib/constants';
import { readJson } from '../lib/api';
import { explainDemandsForStartup, type TaskDeps } from '../lib/ai';
import { publicMeta, withAi } from './ai-boundary';
import { toRequestProfile } from '../lib/contract';

type AiStatus = 'ok' | 'unavailable' | 'invalid_output' | 'not_run';
type Explanation = Awaited<ReturnType<typeof explainDemandsForStartup>>['explanations'][number];

// POST /api/demand/matches. Scores are computed before any model call and never change.
export async function handleDemandMatches(req: Request, deps: TaskDeps = {}): Promise<Response> {
  const rawBody = (await readJson(req)) as any;
  const rawProfile = rawBody?.startup_profile ?? rawBody?.profile;
  const cleanProfile = rawProfile ? toRequestProfile(rawProfile) : rawProfile;
  const body = matchesRequestSchema.parse({
    startup_profile: cleanProfile,
    demand_ids: rawBody?.demand_ids,
  });
  const profile = body.startup_profile;

  const missing = missingGateFields(profile);
  if (missing.length) {
    throw new AppError('PROFILE_INCOMPLETE', `Confirm these fields before matching: ${missing.join(', ')}.`);
  }

  const ids = body.demand_ids ?? demandBriefs.map((d) => d.id);
  const unknown = ids.find((id) => !demandById.has(id));
  if (unknown) throw new AppError('UNKNOWN_DEMAND', `Unknown demand ID: ${unknown}`);

  const ranked = rankDemands(profile, ids.map((id) => demandById.get(id)!));
  const eligible = ranked.filter((a) => a.withheld_reasons.length === 0).slice(0, 5);
  const withheld = ranked.filter((a) => a.withheld_reasons.length > 0);

  const explanations = new Map<string, Explanation>();
  let ai_status: AiStatus = 'not_run';
  let meta: ReturnType<typeof publicMeta> | null = null;
  if (eligible.length) {
    try {
      // The AI layer drops any demand ID the model invented or that was not a candidate.
      const out = await withAi(() =>
        explainDemandsForStartup({ profile, candidates: candidatesForPrompt(eligible) }, deps),
      );
      ai_status = 'ok';
      meta = publicMeta(out.meta);
      for (const e of out.explanations) explanations.set(e.demand_id, e);
    } catch (err) {
      if (!(err instanceof AppError)) throw err;
      ai_status = err.code === 'INVALID_MODEL_OUTPUT' ? 'invalid_output' : 'unavailable';
    }
  }

  return Response.json({
    matches: eligible.map((a) => {
      const demand = demandById.get(a.demand_id);
      return {
        ...a,
        demand,
        score_label: `${a.score}% Fit`,
        data_status: demand?.data_status ?? 'synthetic_demo',
        ai_analysis: explanations.get(a.demand_id) ?? null,
      };
    }),
    withheld: withheld.map(({ demand_id, withheld_reasons }) => ({ demand_id, withheld_reasons })),
    ai_status,
    meta,
    data_notice: NOTICE_SYNTHETIC,
  });
}

// Only the fields Gemma needs to explain fit. Keeps the prompt small and bounded.
function candidatesForPrompt(eligible: Assessment[]) {
  return eligible.map((a) => {
    const d = demandById.get(a.demand_id)!;
    return {
      demand_id: d.id,
      title: d.title,
      industry: d.industry,
      country: d.country,
      problem: d.problem,
      must_have: d.must_have,
      nice_to_have: d.nice_to_have,
      data_status: d.data_status,
      score: a.score,
      unknowns: a.unknowns,
    };
  });
}
