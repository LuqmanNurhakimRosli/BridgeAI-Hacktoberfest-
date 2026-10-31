import { z } from 'zod';
import { StartupProfileSchema, DemandExplanationSchema } from './ai/schemas';

// The public response contract for the AI-backed routes, as code. The frontend can import these types,
// and tests check real handler output against them. Documented in docs/api-contract.md.
// Extra fields are allowed, so adding an optional field is never a breaking change.

export const aiMetaSchema = z.object({
  // 'fixture' marks canned data. The UI must show "Demo fixture" instead of the Gemma badge for it.
  source: z.enum(['gemma', 'fixture']),
  model: z.string(),
  provider: z.string().nullable(),
  prompt_version: z.string(),
  latency_ms: z.number(),
  repaired: z.boolean(),
});
export type AiMetaPublic = z.infer<typeof aiMetaSchema>;

export const errorEnvelopeSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

// POST /api/analyze
export const analyzeResponseSchema = z.object({
  profile: StartupProfileSchema,
  needs_founder_confirmation: z.literal(true),
  meta: aiMetaSchema,
});

// POST /api/demand/matches
export const matchSchema = z.object({
  demand_id: z.string(),
  score: z.number(),
  score_breakdown: z.object({
    sector: z.number(), must_have: z.number(), geography: z.number(), stage: z.number(), readiness: z.number(),
  }),
  reasons: z.array(z.string()),
  unknowns: z.array(z.string()),
  hard_eligibility: z.enum(['needs_verification', 'withheld']),
  withheld_reasons: z.array(z.string()),
  // null when the model was unavailable or its output was invalid. Never a fabricated explanation.
  ai_analysis: DemandExplanationSchema.nullable(),
});
export const matchesResponseSchema = z.object({
  matches: z.array(matchSchema),
  withheld: z.array(z.object({ demand_id: z.string(), withheld_reasons: z.array(z.string()) })),
  ai_status: z.enum(['ok', 'unavailable', 'invalid_output', 'not_run']),
  meta: aiMetaSchema.nullable(),
  data_notice: z.string(),
});

// POST /api/poc
export const pocResponseSchema = z.object({
  plan: z.object({
    objective: z.string(),
    scope: z.string().nullish(),
    milestones: z.array(z.object({ day: z.number(), action: z.string(), owner: z.enum(['startup', 'partner', 'joint']) })).min(1).max(4),
    success_criteria: z.array(z.object({ metric: z.string(), target: z.string(), validation_method: z.string() })).min(1),
    preconditions: z.array(z.string()),
    ip_questions: z.array(z.string()),
    data_sharing_questions: z.array(z.string()),
    liability_questions: z.array(z.string()),
    possible_conversion_to_paid: z.string(),
    roles_and_responsibilities: z.array(z.string()),
    budget_questions: z.array(z.string()),
    local_regulatory_checks: z.array(z.string()),
    assumptions: z.array(z.string()),
    next_action: z.string().nullish(),
    // Set by the server. A model can never change these.
    demand_id: z.string(),
    status: z.literal('proposed'),
    proposed_duration_days: z.number().int().min(60).max(90),
  }),
  draft_only: z.literal(true),
  model: z.string(),
  notice: z.string(),
  review_notes: z.array(z.string()),
  meta: aiMetaSchema,
});

// The request body for /api/demand/matches and /api/poc is stricter than the /api/analyze response:
// it has no missing_fields or confidence_notes. This helper does the conversion the frontend must do.
export function toRequestProfile(profile: z.infer<typeof StartupProfileSchema>) {
  const { missing_fields: _m, confidence_notes: _c, ...rest } = profile;
  return rest;
}
