// Prompt B — bounded search plan. Gemma proposes filters; backend code validates and runs the search.
// Also the fallback when a provider does not support tool calling.

import { runTask, type TaskDeps } from './task';
import { searchPlanPrompt, PROMPT_VERSIONS } from './prompt-templates';
import { SearchPlanSchema, SUPPORTED_COUNTRIES, type SearchPlanOutput } from './schemas';

export async function planSearch(input: { profile: unknown }, deps?: TaskDeps) {
  const { data, meta } = await runTask({
    schema: SearchPlanSchema,
    user: searchPlanPrompt({ profile: input.profile }),
    promptVersion: PROMPT_VERSIONS.searchPlan,
    maxTokens: 400,
    temperature: 0,
    deps,
  });

  // Unknown countries are dropped rather than sent to the search.
  const supported = new Set<string>(SUPPORTED_COUNTRIES.map((c) => c.toLowerCase()));
  const plan: SearchPlanOutput = {
    ...data,
    country: data.country && supported.has(data.country.toLowerCase()) ? data.country : null,
  };
  return { plan, meta: { ...meta, prompt_version: PROMPT_VERSIONS.searchPlan } };
}
