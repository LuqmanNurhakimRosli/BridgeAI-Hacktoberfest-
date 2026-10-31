// Bounded tool-calling loop (handover section 9). Only whitelisted, read-only tools run.
// Backend code validates arguments and executes the search; the model never touches data directly.
// Falls back to the search-plan path if the provider rejects tools (AI_MODEL_UNSUPPORTED).

import { z } from 'zod';
import { AiError } from './errors';
import { callGemma, type ChatMessage, type ToolCall, type ToolDefinition } from './call-gemma';
import type { AiConfig } from './config';
import { SUPPORTED_COUNTRIES, GOALS, STAGES, DEMAND_KINDS } from './schemas';

export const MAX_TOOL_ROUNDS = 2;
export const MAX_TOOL_RESULTS = 8;

const SearchArgs = z.object({
  country: z.enum(SUPPORTED_COUNTRIES).nullable(),
  sector: z.string().trim().max(80).nullable(),
  stage: z.enum(STAGES).nullable(),
  goal: z.enum(GOALS).nullable(),
  demand_kind: z.enum(DEMAND_KINDS).nullable(),
}).strict();

export type SearchArgs = z.infer<typeof SearchArgs>;

export const SEARCH_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'search_opportunities',
    description: 'Search the local ASEAN catalog using validated filters. Read-only. Never creates records.',
    parameters: {
      type: 'object',
      properties: {
        country: { type: ['string', 'null'], enum: [...SUPPORTED_COUNTRIES, null] },
        sector: { type: ['string', 'null'] },
        stage: { type: ['string', 'null'], enum: [...STAGES, null] },
        goal: { type: ['string', 'null'], enum: [...GOALS, null] },
        demand_kind: { type: ['string', 'null'], enum: [...DEMAND_KINDS, null] },
      },
      required: ['country', 'sector', 'stage', 'goal', 'demand_kind'],
      additionalProperties: false,
    },
  },
};

export type CatalogSearch = (args: SearchArgs) => Array<Record<string, unknown>>;

export interface ToolLoopResult {
  results: Array<Record<string, unknown>>;
  rounds: number;
  toolCallsRun: number;
  finalText: string | null;
  mode: 'tools' | 'fallback_required';
}

export async function runSearchToolLoop(
  input: { userPrompt: string; search: CatalogSearch; fetchImpl?: typeof fetch; config?: AiConfig },
): Promise<ToolLoopResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: 'Use the search tool to find catalog records for the profile. Do not invent records.' },
    { role: 'user', content: input.userPrompt },
  ];
  let toolCallsRun = 0;
  let results: Array<Record<string, unknown>> = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let res;
    try {
      res = await callGemma({ messages, maxTokens: 400, temperature: 0, tools: [SEARCH_TOOL], fetchImpl: input.fetchImpl, config: input.config });
    } catch (err) {
      if (err instanceof AiError && err.code === 'AI_MODEL_UNSUPPORTED') {
        return { results: [], rounds: round, toolCallsRun, finalText: null, mode: 'fallback_required' };
      }
      throw err;
    }

    if (res.toolCalls.length === 0) {
      return { results, rounds: round + 1, toolCallsRun, finalText: res.text, mode: 'tools' };
    }

    messages.push({ role: 'assistant', content: res.text ?? '', tool_calls: res.toolCalls });
    for (const call of res.toolCalls) {
      const { content, ran } = runOneCall(call, input.search);
      if (ran) toolCallsRun++;
      messages.push({ role: 'tool', tool_call_id: call.id, content });
      if (ran) results = mergeResults(results, safeParseResults(content));
    }
  }
  // Round cap reached: stop, return what the backend already retrieved.
  return { results: results.slice(0, MAX_TOOL_RESULTS), rounds: MAX_TOOL_ROUNDS, toolCallsRun, finalText: null, mode: 'tools' };
}

function runOneCall(call: ToolCall, search: CatalogSearch): { content: string; ran: boolean } {
  if (call.type !== 'function' || call.function.name !== SEARCH_TOOL.function.name) {
    return { content: JSON.stringify({ error: 'tool not allowed' }), ran: false };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(call.function.arguments);
  } catch {
    return { content: JSON.stringify({ error: 'invalid arguments' }), ran: false };
  }
  const parsed = SearchArgs.safeParse(raw);
  if (!parsed.success) return { content: JSON.stringify({ error: 'invalid arguments' }), ran: false };
  const rows = search(parsed.data).slice(0, MAX_TOOL_RESULTS);
  return { content: JSON.stringify(rows), ran: true };
}

function safeParseResults(content: string): Array<Record<string, unknown>> {
  try {
    const v = JSON.parse(content);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function mergeResults(a: Array<Record<string, unknown>>, b: Array<Record<string, unknown>>) {
  const seen = new Set(a.map((r) => String(r.id)));
  const out = [...a];
  for (const r of b) {
    if (!seen.has(String(r.id))) {
      seen.add(String(r.id));
      out.push(r);
    }
  }
  return out.slice(0, MAX_TOOL_RESULTS);
}
