// Prompt E — outreach draft. Copy-only: nothing in this module sends email.

import { AiError } from './errors';
import { runTask, type TaskDeps } from './task';
import { outreachPrompt, PROMPT_VERSIONS } from './prompt-templates';
import { OutreachDraftSchema } from './schemas';
import { findOverclaims, newReport, stripUngroundedContacts, type GuardReport } from './postvalidate';

export const LANGUAGES = ['English', 'Bahasa Melayu', 'Bahasa Indonesia'] as const;
export const MAX_BODY_WORDS = 180;

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const OutreachChecked = OutreachDraftSchema.superRefine((d, ctx) => {
  if (countWords(d.body) > MAX_BODY_WORDS) {
    ctx.addIssue({ code: 'custom', message: `body must be at most ${MAX_BODY_WORDS} words` });
  }
  const hits = findOverclaims(`${d.subject} ${d.body}`);
  if (hits.length > 0) ctx.addIssue({ code: 'custom', message: `claims an unconfirmed fact: ${hits.join(', ')}` });
  if (/\b(we have sent|i have sent|as discussed|following our meeting)\b/i.test(d.body)) {
    ctx.addIssue({ code: 'custom', message: 'implies a prior contact or a sent email' });
  }
});

export async function draftOutreach(
  input: { language: (typeof LANGUAGES)[number]; profile: unknown; demand: unknown; plan: unknown },
  deps?: TaskDeps,
) {
  if (!(LANGUAGES as readonly string[]).includes(input.language)) {
    throw new AiError('VALIDATION_ERROR', 'Unsupported language.', 400);
  }
  const sourceText = JSON.stringify(input);
  const report: GuardReport = newReport();

  const { data, meta } = await runTask({
    schema: OutreachChecked,
    user: outreachPrompt(input),
    promptVersion: PROMPT_VERSIONS.outreach,
    maxTokens: 600,
    temperature: 0.4,
    deps,
  });

  const subject = stripUngroundedContacts(data.subject, sourceText);
  const body = stripUngroundedContacts(data.body, sourceText);
  report.droppedUngroundedContacts = subject.removed + body.removed;

  return {
    draft: { subject: subject.text, body: body.text, language: input.language },
    draft_only: true as const,
    guard: report,
    meta: { ...meta, prompt_version: PROMPT_VERSIONS.outreach },
  };
}
