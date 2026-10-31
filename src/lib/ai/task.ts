// Shared runner for every Gemma task: one system prompt, one user prompt, validation,
// one repair call, and safe metadata. Services build on this.

import type { ZodType } from 'zod';
import { callGemma, type ChatMessage, type GemmaResult } from './call-gemma';
import { GLOBAL_SYSTEM } from './prompt-templates';
import { generateValidated } from './json-output';

export type LlmFn = (messages: ChatMessage[], opts: { maxTokens: number; temperature?: number }) => Promise<GemmaResult>;

export interface TaskDeps {
  llm?: LlmFn;
}

export interface AiMeta {
  source: 'gemma';
  model: string;
  provider: string | null;
  prompt_version: string;
  latency_ms: number;
  schema_valid: true;
  repaired: boolean;
  request_id: string;
}

const defaultLlm: LlmFn = (messages, opts) =>
  callGemma({ messages, maxTokens: opts.maxTokens, temperature: opts.temperature });

export async function runTask<T>(args: {
  schema: ZodType<T>;
  user: string;
  promptVersion: string;
  maxTokens: number;
  temperature: number;
  deps?: TaskDeps;
}): Promise<{ data: T; meta: AiMeta }> {
  const llm = args.deps?.llm ?? defaultLlm;
  let lastLatency = 0;
  let lastModel = '';
  let lastProvider: string | null = null;
  let lastRequest = '';

  const { data, repaired } = await generateValidated<T>(args.schema, async (repair) => {
    const messages: ChatMessage[] = [{ role: 'system', content: GLOBAL_SYSTEM }, { role: 'user', content: args.user }];
    if (repair) {
      messages.push({ role: 'assistant', content: repair.previous.slice(0, 4000) });
      messages.push({
        role: 'user',
        content: `Your previous output failed validation: ${repair.error}. Return corrected JSON only, with the same keys and the same rules.`,
      });
    }
    const res = await llm(messages, { maxTokens: args.maxTokens, temperature: args.temperature });
    lastLatency = res.latencyMs;
    lastModel = res.model;
    lastProvider = res.provider;
    lastRequest = res.requestId;
    return res.text;
  });

  return {
    data,
    meta: {
      source: 'gemma',
      model: lastModel,
      provider: lastProvider,
      prompt_version: args.promptVersion,
      latency_ms: lastLatency,
      schema_valid: true,
      repaired,
      request_id: lastRequest,
    },
  };
}
