import { AiError } from '../lib/ai/errors';
import type { AiMeta } from '../lib/ai';
import { AppError } from '../lib/errors';

// The AI layer has its own detailed error codes. The public API exposes only the backend's codes,
// and never says whether the key, the credits or the provider was the cause.
export function toAppError(err: unknown): unknown {
  if (!(err instanceof AiError)) return err;
  switch (err.code) {
    case 'VALIDATION_ERROR':
      return new AppError('VALIDATION_ERROR', err.message);
    case 'UPSTREAM_RATE_LIMIT':
      return new AppError('UPSTREAM_RATE_LIMIT', 'Model service is rate limited. Try again shortly.', String(err.retryAfterSec ?? 30));
    case 'INVALID_MODEL_OUTPUT':
      return new AppError('INVALID_MODEL_OUTPUT', 'Model output failed validation.');
    case 'AI_INSUFFICIENT_CREDITS':
      return new AppError('AI_UNAVAILABLE', 'Model credits are exhausted.');
    case 'AI_AUTH_FAILED':
    case 'AI_NOT_CONFIGURED':
      return new AppError('AI_UNAVAILABLE', 'Model service is not configured or rejected the request.');
    default:
      return new AppError('AI_UNAVAILABLE', 'Model service is unavailable. Try again later.');
  }
}

// Runs an AI service call and converts its errors to the public error type.
export async function withAi<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw toAppError(err);
  }
}

// The metadata the UI needs for its "Powered by Gemma 4" badge. No request IDs or secrets.
export function publicMeta(meta: AiMeta) {
  return {
    source: meta.source,
    model: meta.model,
    provider: meta.provider,
    prompt_version: meta.prompt_version,
    latency_ms: meta.latency_ms,
    repaired: meta.repaired,
  };
}
