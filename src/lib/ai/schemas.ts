// Zod schemas for every model output. The model output is untrusted until it passes these.
// These mirror handover sections 8.3–8.7, 22.2 and 24.2–24.7. When Person 2 publishes
// src/types/index.ts, the shared shapes should be aligned with it (see plan section 8.5).

import { z } from 'zod';

export const STAGES = ['Idea', 'Pre-seed', 'Seed', 'Series A', 'Growth'] as const;
export const GOALS = ['Investment', 'Pilot Partnership', 'Market Expansion', 'Accelerator'] as const;
export const DEMAND_KINDS = ['corporate_challenge', 'vc_thesis'] as const;
export const SOURCE_STATUSES = ['synthetic_demo', 'self_reported', 'verified_public', 'verified_private'] as const;
export const SUPPORTED_COUNTRIES = [
  'Brunei', 'Cambodia', 'Indonesia', 'Laos', 'Malaysia', 'Myanmar',
  'Philippines', 'Singapore', 'Thailand', 'Vietnam',
] as const;

const str = z.string().trim().min(1).max(500);
const strList = (max: number) => z.array(str).max(max);

// Prompt A — Startup Passport
export const StartupProfileSchema = z.object({
  startup_name: z.string().trim().max(120).nullable(),
  description: z.string().trim().max(3000),
  industry: z.string().trim().max(80).nullable(),
  home_country: z.string().trim().max(40).nullable(),
  target_country: z.string().trim().max(40).nullable(),
  stage: z.enum(STAGES).nullable(),
  product: z.string().trim().max(300).nullable(),
  primary_goal: z.enum(GOALS).nullable(),
  needs: strList(10),
  // Capabilities the founder states in their own words. Suggestions only: the founder confirms
  // them before matching, and the matcher treats them as self-reported.
  capability_tags: z.array(z.string().trim().min(1).max(60)).max(15).default([]),
  missing_fields: strList(10),
  confidence_notes: strList(10),
}).strict();
export type StartupProfileOutput = z.infer<typeof StartupProfileSchema>;

const txt = (max: number) => z.string().trim().min(1).max(max);

// Prompt H (P0 direction) — one startup explained against several supplied demand records.
// Field names and limits match the public /api/demand/matches contract. Unknown keys are dropped.
export const DemandExplanationSchema = z.object({
  demand_id: str,
  why_match: txt(400),
  fit_gaps: z.array(txt(200)).max(3),
  next_action: txt(200),
  evidence_for_fit: z.array(txt(300)).max(5).default([]),
  missing_evidence: z.array(txt(300)).max(5).default([]),
});
export const DemandExplanationsSchema = z.object({
  explanations: z.array(DemandExplanationSchema).max(5),
});
export type DemandExplanation = z.infer<typeof DemandExplanationSchema>;

// Prompt H — reverse-match explanations (one entry per supplied candidate)
export const MatchExplanationSchema = z.object({
  startup_id: str,
  demand_id: str,
  fit_summary: z.string().trim().min(1).max(600),
  evidence_for_fit: strList(5),
  missing_evidence: strList(5),
  constraints: strList(5),
  suggested_next_step: z.string().trim().min(1).max(300),
}).strict();
export const MatchExplanationsSchema = z.object({
  explanations: z.array(MatchExplanationSchema).max(5),
}).strict();
export type MatchExplanation = z.infer<typeof MatchExplanationSchema>;

// Prompt I — POC draft. Field names, limits and the 4-milestone cap match the public /api/poc contract.
// status, demand_id and proposed_duration_days are NOT model output: the backend sets them.
// Unknown keys (for example a model-invented "status": "agreed") are dropped, not trusted.
export function makePocPlanSchema(durationDays: number) {
  return z.object({
    objective: txt(500),
    scope: txt(800).nullish(),
    milestones: z
      .array(
        z.object({
          day: z.number().int().min(0).max(durationDays),
          action: txt(300),
          owner: z.enum(['startup', 'partner', 'joint']),
        }),
      )
      .min(1)
      .max(4),
    success_criteria: z
      .array(z.object({ metric: txt(200), target: txt(200), validation_method: txt(300) }))
      .min(1)
      .max(5),
    preconditions: z.array(txt(300)).max(8),
    ip_questions: z.array(txt(300)).max(6),
    data_sharing_questions: z.array(txt(300)).max(6),
    liability_questions: z.array(txt(300)).max(6),
    possible_conversion_to_paid: txt(400),
    // Optional extras. Absent in older outputs, so they default rather than fail.
    roles_and_responsibilities: z.array(txt(300)).max(6).default([]),
    budget_questions: z.array(txt(300)).max(6).default([]),
    local_regulatory_checks: z.array(txt(300)).max(6).default([]),
    assumptions: z.array(txt(300)).max(6).default([]),
    next_action: txt(300).nullish(),
  });
}
export type PocPlanOutput = z.infer<ReturnType<typeof makePocPlanSchema>>;

// Prompt E — outreach draft (copy-only; never sent by the app)
export const OutreachDraftSchema = z.object({
  subject: z.string().trim().min(1).max(150),
  body: z.string().trim().min(1).max(1500),
}).strict();

// Prompt B — bounded search plan (filters only; backend validates and runs the search)
export const SearchPlanSchema = z.object({
  country: z.string().trim().max(40).nullable(),
  sector: z.string().trim().max(80).nullable(),
  stage: z.enum(STAGES).nullable(),
  goal: z.enum(GOALS).nullable(),
  demand_kind: z.enum(DEMAND_KINDS).nullable(),
  reason: z.string().trim().max(300),
}).strict();
export type SearchPlanOutput = z.infer<typeof SearchPlanSchema>;

// Prompt G — demand intake (P1). Source status from AI is always self_reported at most.
export const DemandBriefDraftSchema = z.object({
  demand_kind: z.enum(DEMAND_KINDS),
  title: z.string().trim().min(1).max(160),
  country: z.string().trim().max(40).nullable(),
  industry: z.string().trim().max(80).nullable(),
  problem: z.string().trim().min(1).max(800),
  must_have: strList(8),
  nice_to_have: strList(8),
  stages: z.array(z.enum(STAGES)).max(5),
  goals: z.array(z.enum(GOALS)).max(4),
  budget_range: z.null(),
  success_definition: z.string().trim().max(400).nullable(),
  missing_fields: strList(10),
  assumption_warnings: strList(10),
  source_status: z.enum(['self_reported', 'synthetic_demo']),
}).strict();
export type DemandBriefDraft = z.infer<typeof DemandBriefDraftSchema>;

// Prompt L — next-action coach (P1). Recommends one action from recorded events only.
const notLiteralNull = (s: string) => s.trim().toLowerCase() !== 'null' && s.trim().toLowerCase() !== 'none';

export const NextActionSchema = z.object({
  current_state: z.string().trim().min(1).max(60),
  next_action: z.string().trim().min(1).max(300).refine(notLiteralNull, 'next_action must be a real action, not null'),
  timing_reason: z.string().trim().min(1).max(300),
  proposed_follow_up: z.string().trim().max(1000).nullable(),
  confidence_limitations: strList(5),
  based_on_event_ids: strList(20),
}).strict();
export type NextActionOutput = z.infer<typeof NextActionSchema>;
