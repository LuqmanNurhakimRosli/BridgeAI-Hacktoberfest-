// Prompt A — Startup Passport extraction.

import { AiError } from './errors';
import { runTask, type TaskDeps } from './task';
import { passportPrompt, PROMPT_VERSIONS, type Locale } from './prompt-templates';
import { StartupProfileSchema, GOALS, type StartupProfileOutput } from './schemas';
import { newReport, normalizeProfile, sanitizeStrings, scrubAllContacts } from './postvalidate';

export const MAX_DESCRIPTION_CHARS = 3000;

export interface PassportInput {
  description: string;
  locale?: Locale;
  country?: string;
  goal?: (typeof GOALS)[number];
}

export function validatePassportInput(input: PassportInput): PassportInput {
  const description = (input.description ?? '').trim();
  if (description.length < 1) throw new AiError('VALIDATION_ERROR', 'Please describe your startup first.', 400);
  if (description.length > MAX_DESCRIPTION_CHARS) {
    throw new AiError('VALIDATION_ERROR', `Please keep the description under ${MAX_DESCRIPTION_CHARS} characters.`, 400);
  }
  return { ...input, description };
}

export async function extractStartupProfile(input: PassportInput, deps?: TaskDeps) {
  const clean = validatePassportInput(input);
  const user = passportPrompt(clean);
  const { data, meta } = await runTask({
    schema: StartupProfileSchema,
    user,
    promptVersion: PROMPT_VERSIONS.passport,
    maxTokens: 1200,
    temperature: 0.1,
    deps,
  });

  const report = newReport();
  const sourceText = clean.description;
  // A Passport never needs contact details, so none survive in model-written fields.
  const cleaned = scrubAllContacts(sanitizeStrings(data, sourceText, report), report) as StartupProfileOutput;
  // The founder's own text is the source of record for the description field.
  const profile = normalizeProfile({ ...cleaned, description: sourceText }, report);

  return {
    profile,
    needs_founder_confirmation: true,
    guard: report,
    meta: { ...meta, prompt_version: PROMPT_VERSIONS.passport },
  };
}
