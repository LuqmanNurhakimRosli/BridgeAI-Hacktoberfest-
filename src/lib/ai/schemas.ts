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
  missing_fields: strList(10),
  confidence_notes: strList(10),
}).strict();
export type StartupProfileOutput = z.infer<typeof StartupProfileSchema>;

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

// Prompt I — POC draft (status is NOT model output; the backend forces it to 'proposed')
export const PocMilestoneSchema = z.object({
  day: z.number().int().min(1).max(120),
  action: z.string().trim().min(1).max(300),
  owner: z.enum(['startup', 'partner', 'joint']),
}).strict();
export const PocCriterionSchema = z.object({
  metric: z.string().trim().min(1).max(200),
  target: z.string().trim().min(1).max(200),
  validation_method: z.string().trim().min(1).max(300),
}).strict();
export const PocPlanSchema = z.object({
  proposed_duration_days: z.number().int().min(30).max(120),
  objective: z.string().trim().min(1).max(500),
  scope: z.string().trim().min(1).max(800),
  milestones: z.array(PocMilestoneSchema).min(2).max(6),
  success_criteria: z.array(PocCriterionSchema).min(1).max(5),
  roles_and_responsibilities: strList(6),
  budget_questions: strList(6),
  ip_questions: strList(6),
  data_sharing_questions: strList(6),
  security_and_liability_questions: strList(6),
  local_regulatory_checks: strList(6),
  paid_conversion_path: z.string().trim().min(1).max(400),
  assumptions: strList(6),
  next_action: z.string().trim().min(1).max(300),
}).strict();
export type PocPlanOutput = z.infer<typeof PocPlanSchema>;

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
