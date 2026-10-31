// Prompt L — next-action coach (P1). Reads recorded events only; never writes deal state.

import { AiError } from './errors';
import { runTask, type TaskDeps } from './task';
import { nextActionPrompt, PROMPT_VERSIONS } from './prompt-templates';
import { NextActionSchema, type NextActionOutput } from './schemas';
import { findOverclaims, newReport, sanitizeStrings, type GuardReport } from './postvalidate';

export interface RecordedEvent {
  id: string;
  event_type: string;
  from_state: string;
  to_state: string;
  happened_at: string;
  evidence_status: string;
  note?: string;
}

export async function suggestNextAction(input: { events: RecordedEvent[] }, deps?: TaskDeps) {
  if (input.events.length === 0) throw new AiError('VALIDATION_ERROR', 'No recorded events yet.', 400);
  const knownIds = new Set(input.events.map((e) => e.id));

  const schema = NextActionSchema.superRefine((a, ctx) => {
    const unknown = a.based_on_event_ids.filter((id) => !knownIds.has(id));
    if (unknown.length > 0) ctx.addIssue({ code: 'custom', message: `unknown event IDs: ${unknown.join(', ')}` });
    const hits = findOverclaims(JSON.stringify(a));
    if (hits.length > 0) ctx.addIssue({ code: 'custom', message: `states an unconfirmed fact: ${hits.join(', ')}` });
  });
  const report: GuardReport = newReport();

  const { data, meta } = await runTask<NextActionOutput>({
    schema,
    user: nextActionPrompt({ events: input.events }),
    promptVersion: PROMPT_VERSIONS.nextAction,
    maxTokens: 500,
    temperature: 0.3,
    deps,
  });

  const sourceText = JSON.stringify(input.events);
  const cleaned = sanitizeStrings(data, sourceText, report) as NextActionOutput;
  return {
    advice: cleaned,
    // Advice only. The app must not change deal state based on this output.
    advisory_only: true as const,
    guard: report,
    meta: { ...meta, prompt_version: PROMPT_VERSIONS.nextAction },
  };
}
