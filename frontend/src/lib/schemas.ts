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

// Model output schemas live with the AI layer in src/lib/ai/schemas.ts, next to the prompts and guards that use them.
