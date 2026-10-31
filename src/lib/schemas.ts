import { z } from 'zod';

export const STAGES = ['Idea', 'Pre-seed', 'Seed', 'Series A', 'Growth'] as const;
export const GOALS = ['Investment', 'Pilot Partnership', 'Market Expansion', 'Accelerator'] as const;
export const DEMAND_KINDS = ['corporate_challenge', 'vc_thesis'] as const;
export const SOURCE_STATUSES = ['synthetic_demo', 'self_reported', 'verified_public', 'verified_private'] as const;
// P0 has no verification workflow, so only these evidence values may be written.
export const P0_EVIDENCE = ['self_reported', 'synthetic_demo'] as const;
export const DEAL_STATES = [
  'identified', 'qualified', 'introduction_requested', 'first_meeting',
  'proposal_shared', 'negotiation', 'agreement_signed',
  'poc_running', 'poc_completed', 'contract_signed', 'paid',
  'closed_lost', 'on_hold',
] as const;

const text = (max: number) => z.string().trim().min(1).max(max);
const nullableText = (max: number) => text(max).nullable();

export const startupProfileSchema = z.strictObject({
  startup_name: nullableText(120),
  description: text(3000),
  industry: nullableText(60),
  home_country: nullableText(60),
  target_country: nullableText(60),
  stage: z.enum(STAGES).nullable(),
  product: nullableText(300),
  primary_goal: z.enum(GOALS).nullable(),
  needs: z.array(text(200)).max(10).default([]),
  // Founder-declared capabilities. Always treated as self_reported in P0.
  capability_tags: z.array(text(60)).max(30).default([]),
});
export type StartupProfile = z.infer<typeof startupProfileSchema>;

export const demandBriefSchema = z.object({
  id: z.string().min(1),
  demand_kind: z.enum(DEMAND_KINDS),
  buyer_name: z.string(),
  title: z.string(),
  country: z.string(),
  industry: z.string(),
  problem: z.string(),
  must_have: z.array(z.string()),
  nice_to_have: z.array(z.string()),
  stages: z.array(z.enum(STAGES)),
  goals: z.array(z.enum(GOALS)),
  budget_range: z.unknown().nullable().optional(),
  data_status: z.enum(SOURCE_STATUSES),
  source_url: z.string().nullable().optional(),
  last_verified_at: z.string().nullable().optional(),
});
export type DemandBrief = z.infer<typeof demandBriefSchema>;

export const dealEventSchema = z.object({
  id: z.string().min(1),
  deal_id: z.string().min(1),
  event_type: z.string().min(1),
  from_state: z.enum(DEAL_STATES),
  to_state: z.enum(DEAL_STATES),
  happened_at: z.string(),
  actor_id: z.string().min(1),
  evidence_status: z.enum(SOURCE_STATUSES),
  note: z.string().max(500).optional(),
  evidence_ref: z.string().max(200).nullable().optional(),
});
export type DealEvent = z.infer<typeof dealEventSchema>;
export type DealState = (typeof DEAL_STATES)[number];

// ---- Request bodies ----

export const analyzeRequestSchema = z.strictObject({
  description: text(3000),
  locale: z.enum(['en', 'ms', 'id']).default('en'),
});

export const matchesRequestSchema = z.strictObject({
  startup_profile: startupProfileSchema,
  demand_ids: z.array(z.string().min(1).max(60)).max(5).optional(),
});

export const pocRequestSchema = z.strictObject({
  startup_profile: startupProfileSchema,
  demand_id: z.string().min(1).max(60),
  match_id: z.string().max(60).optional(),
  duration_days: z.number().int().min(60).max(90).default(75),
});

export const challengesQuerySchema = z.object({
  country: z.string().trim().min(1).max(40).optional(),
  type: z.enum(DEMAND_KINDS).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

// ---- Model outputs (validated locally; the model is never trusted) ----

export const passportOutputSchema = z.object({
  startup_name: z.string().nullable(),
  description: z.string(),
  industry: z.string().nullable(),
  home_country: z.string().nullable(),
  target_country: z.string().nullable(),
  stage: z.enum(STAGES).nullable(),
  product: z.string().nullable(),
  primary_goal: z.enum(GOALS).nullable(),
  needs: z.array(z.string()).max(10),
  missing_fields: z.array(z.string()).max(15),
  confidence_notes: z.array(z.string()).max(10),
});

export const matchExplanationOutputSchema = z.object({
  explanations: z
    .array(
      z.object({
        demand_id: z.string(),
        why_match: text(400),
        fit_gaps: z.array(text(200)).max(3),
        next_action: text(200),
      }),
    )
    .max(5),
});

export function makePocOutputSchema(durationDays: number) {
  return z.object({
    objective: text(500),
    milestones: z
      .array(
        z.object({
          day: z.number().int().min(0).max(durationDays),
          action: text(300),
          owner: z.enum(['startup', 'partner', 'joint']),
        }),
      )
      .min(1)
      .max(4),
    success_criteria: z
      .array(z.object({ metric: text(200), target: text(200), validation_method: text(300) }))
      .min(1)
      .max(5),
    preconditions: z.array(text(300)).max(8),
    ip_questions: z.array(text(300)).max(6),
    data_sharing_questions: z.array(text(300)).max(6),
    liability_questions: z.array(text(300)).max(6),
    possible_conversion_to_paid: text(400),
  });
}
