import { completeJson, DEFAULT_MODEL, openRouterClient, type ModelClient } from '../lib/model';
import { passportOutputSchema, analyzeRequestSchema } from '../lib/schemas';
import { PASSPORT_PROMPT_VERSION, SYSTEM_PROMPT, passportTask } from '../lib/prompts';
import { readJson } from '../lib/api';

// POST /api/analyze: founder text -> editable Startup Passport. Gemma does extraction only.
export async function handleAnalyze(req: Request, model: ModelClient = openRouterClient()): Promise<Response> {
  const body = analyzeRequestSchema.parse(await readJson(req));
  const profile = await completeJson(
    model,
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: passportTask(body.description, body.locale) },
    ],
    passportOutputSchema,
    1000,
  );
  return Response.json({
    profile,
    meta: { model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL, prompt_version: PASSPORT_PROMPT_VERSION },
  });
}
