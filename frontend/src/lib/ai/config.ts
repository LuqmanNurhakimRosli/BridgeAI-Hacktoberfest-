// Server-only configuration for the Gemma AI layer.
// Reads environment variables lazily so builds do not need the secret.

import { AiError } from './errors';

export const DEFAULT_MODEL = 'google/gemma-4-26b-a4b-it';
export const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

export interface AiConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  appUrl: string;
  timeoutMs: number;
}

export function readAiConfig(env: Record<string, string | undefined> = process.env): AiConfig {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AiError('AI_NOT_CONFIGURED', 'OPENROUTER_API_KEY is not configured', 503);
  }
  return {
    apiKey,
    model: env.OPENROUTER_MODEL || DEFAULT_MODEL,
    baseUrl: (env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    appUrl: env.APP_URL || 'http://localhost:3000',
    timeoutMs: 30_000,
  };
}
