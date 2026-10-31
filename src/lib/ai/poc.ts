// Prompt I — editable 60–90-day POC draft. Always returned as 'proposed'.

import { AiError } from './errors';
import { runTask, type TaskDeps } from './task';
import { pocPrompt, PROMPT_VERSIONS } from './prompt-templates';
import { PocPlanSchema, type PocPlanOutput } from './schemas';
import { findOverclaims, finalizePocPlan, newReport, sanitizeStrings, type GuardReport } from './postvalidate';

export const ALLOWED_POC_DAYS = { min: 60, max: 90, default: 75 } as const;

// Overclaims make the output invalid, which triggers the one repair call.
const PocPlanChecked = PocPlanSchema.superRefine((plan, ctx) => {
  const hits = findOverclaims(JSON.stringify(plan));
  if (hits.length > 0) {
    ctx.addIssue({ code: 'custom', message: `states an unconfirmed outcome as fact: ${hits.join(', ')}` });
  }
});

export async function generatePocPlan(
  input: { profile: unknown; demand: unknown; durationDays?: number; sourceText?: string },
  deps?: TaskDeps,
) {
  const durationDays = input.durationDays ?? ALLOWED_POC_DAYS.default;
  if (!Number.isInteger(durationDays) || durationDays < ALLOWED_POC_DAYS.min || durationDays > ALLOWED_POC_DAYS.max) {
    throw new AiError(
      'VALIDATION_ERROR',
      `POC duration must be between ${ALLOWED_POC_DAYS.min} and ${ALLOWED_POC_DAYS.max} days.`,
      400,
    );
  }

  const user = pocPrompt({ profile: input.profile, demand: input.demand, durationDays });
  const sourceText = input.sourceText ?? JSON.stringify({ profile: input.profile, demand: input.demand });
  const report: GuardReport = newReport();

  const { data, meta } = await runTask<PocPlanOutput>({
    schema: PocPlanChecked,
    user,
    promptVersion: PROMPT_VERSIONS.poc,
    maxTokens: 1800,
    temperature: 0.4,
    deps,
  });

  const cleaned = sanitizeStrings(data, sourceText, report) as PocPlanOutput;
  // The duration is set by the caller, not by the model.
  const plan = finalizePocPlan({ ...cleaned, proposed_duration_days: durationDays }, report);

  return {
    plan,
    status: 'proposed' as const,
    disclaimer: 'Proposed draft for discussion. Not agreed, not signed, not funded.',
    guard: report,
    meta: { ...meta, prompt_version: PROMPT_VERSIONS.poc },
  };
}

export { PocPlanChecked };
