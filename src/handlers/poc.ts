import { AppError } from '../lib/errors';
import { demandById } from '../lib/catalog';
import { missingGateFields } from '../lib/demand-matcher';
import { completeJson, openRouterClient, DEFAULT_MODEL, type ModelClient } from '../lib/model';
import { makePocOutputSchema, pocRequestSchema } from '../lib/schemas';
import { NOTICE_SYNTHETIC, SYSTEM_PROMPT, pocTask } from '../lib/prompts';
import { readJson } from '../lib/api';

// POST /api/poc. The plan is always a proposal. The server sets the status, never the model.
export async function handlePoc(req: Request, model: ModelClient = openRouterClient()): Promise<Response> {
  const body = pocRequestSchema.parse(await readJson(req));

  const missing = missingGateFields(body.startup_profile);
  if (missing.length) {
    throw new AppError('PROFILE_INCOMPLETE', `Confirm these fields before drafting a plan: ${missing.join(', ')}.`);
  }
  const demand = demandById.get(body.demand_id);
  if (!demand) throw new AppError('UNKNOWN_DEMAND', `Unknown demand ID: ${body.demand_id}`);

  const plan = await completeJson(
    model,
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: pocTask(body.startup_profile, demand, body.duration_days) },
    ],
    makePocOutputSchema(body.duration_days),
    1200,
  );

  return Response.json({
    plan: {
      ...plan,
      demand_id: demand.id,
      status: 'proposed' as const,
      proposed_duration_days: body.duration_days,
    },
    draft_only: true,
    model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    notice: NOTICE_SYNTHETIC,
  });
}
