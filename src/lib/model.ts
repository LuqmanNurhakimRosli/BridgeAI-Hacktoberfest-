import OpenAI from 'openai';
import type { z } from 'zod';
import { AppError } from './errors';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// Abstraction over OpenRouter so tests can inject a fake model.
export interface ModelClient {
  complete(messages: ChatMessage[], maxTokens: number): Promise<string>;
}

// Raised by a ModelClient for transport failures. Carries only the status and flags.
export class ModelTransportError extends Error {
  constructor(
    readonly status?: number,
    readonly timeout = false,
    readonly retryAfter?: string,
  ) {
    super('model transport error');
  }
}

export const DEFAULT_MODEL = 'google/gemma-4-26b-a4b-it';

export function openRouterClient(): ModelClient {
  let sdk: OpenAI | null = null;
  return {
    async complete(messages, maxTokens) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new ModelTransportError(401);
      // maxRetries: 0, because completeJson() owns the single retry.
      sdk ??= new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:3000',
          'X-Title': 'ASEAN BridgeAI',
        },
        timeout: 30_000,
        maxRetries: 0,
      });
      try {
        const res = await sdk.chat.completions.create({
          model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
          messages,
          max_tokens: maxTokens,
          temperature: 0.2,
        });
        return res.choices[0]?.message?.content ?? '';
      } catch (err: any) {
        if (err?.name === 'APIConnectionTimeoutError') throw new ModelTransportError(undefined, true);
        throw new ModelTransportError(err?.status, false, err?.headers?.['retry-after']);
      }
    },
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callWithRetry(model: ModelClient, messages: ChatMessage[], maxTokens: number): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await model.complete(messages, maxTokens);
    } catch (err) {
      if (!(err instanceof ModelTransportError)) throw err;
      if (err.status === 401) throw new AppError('AI_UNAVAILABLE', 'Model service is not configured or rejected the request.');
      if (err.status === 402) throw new AppError('AI_UNAVAILABLE', 'Model credits are exhausted.');
      if (err.status === 429) {
        throw new AppError('UPSTREAM_RATE_LIMIT', 'Model service is rate limited. Try again shortly.', err.retryAfter ?? '30');
      }
      const retryable = err.timeout || (err.status ?? 500) >= 500;
      if (!retryable || attempt >= 1) {
        throw new AppError('AI_UNAVAILABLE', 'Model service is unavailable. Try again later.');
      }
      await sleep(200 + Math.random() * 300); // jitter before the single retry
    }
  }
}

function parseJson(raw: string): unknown {
  // The spec forbids code fences, but strip them defensively.
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    return undefined;
  }
}

// One call, then one repair request if the output fails schema validation.
// Never returns unvalidated model output.
export async function completeJson<T>(
  model: ModelClient,
  messages: ChatMessage[],
  schema: z.ZodType<T>,
  maxTokens: number,
): Promise<T> {
  const convo = [...messages];
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callWithRetry(model, convo, maxTokens);
    const result = schema.safeParse(parseJson(raw));
    if (result.success) return result.data;
    convo.push(
      { role: 'assistant', content: raw },
      { role: 'user', content: 'That reply was not valid JSON matching the required shape. Return only the corrected JSON object, with no prose.' },
    );
  }
  throw new AppError('INVALID_MODEL_OUTPUT', 'Model output failed validation.');
}
