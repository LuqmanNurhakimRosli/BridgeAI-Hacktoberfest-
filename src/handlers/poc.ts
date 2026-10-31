import { AppError } from '../lib/errors';
import { demandById } from '../lib/catalog';
import { missingGateFields } from '../lib/demand-matcher';
import { pocRequestSchema } from '../lib/schemas';
import { NOTICE_SYNTHETIC } from '../lib/constants';
import { readJson } from '../lib/api';
import { generatePocPlan, type TaskDeps } from '../lib/ai';
import { publicMeta, withAi } from './ai-boundary';

// POST /api/poc. The plan is always a proposal. The server sets the status, never the model.
export async function handlePoc(req: Request, deps: TaskDeps = {}): Promise<Response> {
  const body = pocRequestSchema.parse(await readJson(req));

  const missing = missingGateFields(body.startup_profile);
  if (missing.length) {
    throw new AppError('PROFILE_INCOMPLETE', `Confirm these fields before drafting a plan: ${missing.join(', ')}.`);
  }
  const demand = demandById.get(body.demand_id);
  if (!demand) throw new AppError('UNKNOWN_DEMAND', `Unknown demand ID: ${body.demand_id}`);

  const out = await withAi(() =>
    generatePocPlan({ profile: body.startup_profile, demand, durationDays: body.duration_days }, deps),
  );

  return Response.json({
    // status and proposed_duration_days are set by the AI layer from the request, never taken from model output.
    plan: { ...out.plan, demand_id: demand.id },
    draft_only: true,
    model: out.meta.model,
    notice: NOTICE_SYNTHETIC,
    review_notes: out.guard.notes,
    meta: publicMeta(out.meta),
  });
}
