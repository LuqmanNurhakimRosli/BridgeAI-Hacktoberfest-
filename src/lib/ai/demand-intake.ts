// Prompt G — demand intake (P1). Turns a corporate challenge or VC thesis into a DRAFT brief.
// The output is always labelled self_reported at most; it is never verified by the model.

import { AiError } from './errors';
import { runTask, type TaskDeps } from './task';
import { demandIntakePrompt, PROMPT_VERSIONS } from './prompt-templates';
import { DemandBriefDraftSchema, type DemandBriefDraft } from './schemas';
import { findOverclaims, newReport, sanitizeStrings, type GuardReport } from './postvalidate';

export const MAX_SOURCE_CHARS = 3000;

export async function draftDemandBrief(
  input: { role: 'corporate' | 'vc'; text: string },
  deps?: TaskDeps,
) {
  const text = (input.text ?? '').trim();
  if (text.length < 20) throw new AiError('VALIDATION_ERROR', 'Please describe the challenge in a few sentences.', 400);
  if (text.length > MAX_SOURCE_CHARS) throw new AiError('VALIDATION_ERROR', 'The description is too long.', 400);

  const schema = DemandBriefDraftSchema.superRefine((d, ctx) => {
    const hits = findOverclaims(JSON.stringify(d));
    if (hits.length > 0) ctx.addIssue({ code: 'custom', message: `states an unconfirmed fact: ${hits.join(', ')}` });
  });
  const report: GuardReport = newReport();

  const { data, meta } = await runTask<DemandBriefDraft>({
    schema,
    user: demandIntakePrompt({ role: input.role, text }),
    promptVersion: PROMPT_VERSIONS.demandIntake,
    maxTokens: 1000,
    temperature: 0.2,
    deps,
  });

  const cleaned = sanitizeStrings(data, text, report) as DemandBriefDraft;
  return {
    draft: { ...cleaned, source_status: 'self_reported' as const, budget_range: null },
    needs_owner_confirmation: true,
    guard: report,
    meta: { ...meta, prompt_version: PROMPT_VERSIONS.demandIntake },
  };
}
