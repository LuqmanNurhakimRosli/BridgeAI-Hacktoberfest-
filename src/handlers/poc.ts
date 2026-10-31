import { AppError } from '../lib/errors';
import { demandById } from '../lib/catalog';
import { missingGateFields } from '../lib/demand-matcher';
import { pocRequestSchema } from '../lib/schemas';
import { NOTICE_SYNTHETIC } from '../lib/constants';
import { readJson } from '../lib/api';
import { generatePocPlan, type TaskDeps } from '../lib/ai';
import { publicMeta, withAi } from './ai-boundary';
import { toRequestProfile } from '../lib/contract';

// POST /api/poc. The plan is always a proposal. The server sets the status, never the model.
export async function handlePoc(req: Request, deps: TaskDeps = {}): Promise<Response> {
  const rawBody = (await readJson(req)) as any;
  const rawProfile = rawBody?.startup_profile ?? rawBody?.profile;
  const cleanProfile = rawProfile ? toRequestProfile(rawProfile) : rawProfile;
  const demandId = rawBody?.demand_id ?? rawBody?.demand?.id;
  const durationDays = rawBody?.duration_days ?? rawBody?.durationDays ?? 75;
  const body = pocRequestSchema.parse({
    startup_profile: cleanProfile,
    demand_id: demandId,
    match_id: rawBody?.match_id,
    duration_days: durationDays,
  });

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
