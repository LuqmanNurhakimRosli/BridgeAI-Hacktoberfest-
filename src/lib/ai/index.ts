// Public entry point for the Gemma AI layer. Import from here in route handlers only (server-side).

export { extractStartupProfile, validatePassportInput, MAX_DESCRIPTION_CHARS } from './passport';
export { explainMatches, MAX_CANDIDATES } from './reasoning';
export { generatePocPlan, ALLOWED_POC_DAYS } from './poc';
export { draftOutreach, LANGUAGES, MAX_BODY_WORDS } from './outreach';
export { planSearch } from './search-plan';
export { runSearchToolLoop, SEARCH_TOOL, MAX_TOOL_ROUNDS, MAX_TOOL_RESULTS } from './tools';
export { draftDemandBrief } from './demand-intake';
export { suggestNextAction } from './next-action';
export { PROMPT_VERSIONS } from './prompt-templates';
export { AiError, toPublicError } from './errors';
export type { AiErrorCode } from './errors';
export type { AiMeta, TaskDeps, LlmFn } from './task';
