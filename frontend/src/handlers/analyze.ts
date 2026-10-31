import { analyzeRequestSchema } from '../lib/schemas';
import { readJson } from '../lib/api';
import { extractStartupProfile, type TaskDeps } from '../lib/ai';
import { publicMeta, withAi } from './ai-boundary';

// POST /api/analyze: founder text -> editable Startup Passport. Gemma does extraction only.
export async function handleAnalyze(req: Request, deps: TaskDeps = {}): Promise<Response> {
  const body = analyzeRequestSchema.parse(await readJson(req));
  const out = await withAi(() => extractStartupProfile({ description: body.description, locale: body.locale }, deps));
  return Response.json({
    profile: out.profile,
    needs_founder_confirmation: out.needs_founder_confirmation,
    meta: publicMeta(out.meta),
  });
}
