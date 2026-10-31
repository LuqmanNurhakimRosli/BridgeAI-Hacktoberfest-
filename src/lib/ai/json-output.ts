// Turns raw model text into schema-valid data: fence stripping, JSON parsing,
// Zod validation, and one bounded repair request. Never returns unvalidated data.

import type { ZodType } from 'zod';
import { AiError } from './errors';

export function extractJsonText(raw: string): string {
  let text = raw.trim();
  // Remove accidental Markdown code fences.
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  // If prose surrounds the object, keep the outermost braces.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) text = text.slice(start, end + 1);
  return text;
}

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function parseWithSchema<T>(raw: string | null, schema: ZodType<T>): ParseResult<T> {
  if (!raw) return { ok: false, error: 'Empty response' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonText(raw));
  } catch {
    return { ok: false, error: 'Response was not valid JSON' };
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 8)
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    return { ok: false, error: `Schema check failed: ${issues}` };
  }
  return { ok: true, data: result.data };
}

// Runs a model call, validates it, and performs at most one repair call.
// `call` receives an optional repair note (the previous output and the validation error).
export async function generateValidated<T>(
  schema: ZodType<T>,
  call: (repair?: { previous: string; error: string }) => Promise<string | null>,
): Promise<{ data: T; schemaValid: true; repaired: boolean }> {
  const first = await call();
  const firstParse = parseWithSchema(first, schema);
  if (firstParse.ok) return { data: firstParse.data, schemaValid: true, repaired: false };

  const second = await call({ previous: first ?? '', error: firstParse.error });
  const secondParse = parseWithSchema(second, schema);
  if (secondParse.ok) return { data: secondParse.data, schemaValid: true, repaired: true };

  throw new AiError('INVALID_MODEL_OUTPUT', 'The AI response could not be validated. Please try again.', 502);
}
