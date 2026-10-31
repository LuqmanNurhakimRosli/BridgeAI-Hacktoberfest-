import { AppError } from '../lib/errors';
import { demandById, demandBriefs } from '../lib/catalog';
import { missingGateFields, rankDemands, type Assessment } from '../lib/demand-matcher';
import { completeJson, openRouterClient, type ModelClient } from '../lib/model';
import { matchExplanationOutputSchema, matchesRequestSchema } from '../lib/schemas';
import { NOTICE_SYNTHETIC, SYSTEM_PROMPT, matchTask } from '../lib/prompts';
import { readJson } from '../lib/api';

type AiStatus = 'ok' | 'unavailable' | 'invalid_output' | 'not_run';

// POST /api/demand/matches. Scores are computed before any model call and never change.
export async function handleDemandMatches(req: Request, model: ModelClient = openRouterClient()): Promise<Response> {
  const body = matchesRequestSchema.parse(await readJson(req));
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

  const explanations = new Map<string, { why_match: string; fit_gaps: string[]; next_action: string }>();
  let ai_status: AiStatus = 'not_run';
  if (eligible.length) {
    try {
      const out = await completeJson(
        model,
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: matchTask(profile, candidatesForPrompt(eligible)) },
        ],
        matchExplanationOutputSchema,
        900,
      );
      ai_status = 'ok';
      const allowed = new Set(eligible.map((a) => a.demand_id));
      for (const e of out.explanations) {
        // Drop any ID the model invented or that was not a candidate.
        if (allowed.has(e.demand_id) && !explanations.has(e.demand_id)) explanations.set(e.demand_id, e);
      }
    } catch (err) {
      if (!(err instanceof AppError)) throw err;
      ai_status = err.code === 'INVALID_MODEL_OUTPUT' ? 'invalid_output' : 'unavailable';
    }
  }

  return Response.json({
    matches: eligible.map((a) => ({
      ...a,
      ai_analysis: explanations.get(a.demand_id) ?? null,
    })),
    withheld: withheld.map(({ demand_id, withheld_reasons }) => ({ demand_id, withheld_reasons })),
    ai_status,
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
