// One wrapper for every Gemma call. Server-only.
// Uses OpenRouter's OpenAI-compatible chat endpoint directly with fetch,
// so the only runtime dependency for the AI layer is zod.

import { AiError } from './errors';
import { readAiConfig, type AiConfig } from './config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ToolDefinition {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface JsonSchemaFormat {
  name: string;
  strict: true;
  schema: Record<string, unknown>;
}

export interface CallOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens: number;
  responseFormat?: JsonSchemaFormat;
  tools?: ToolDefinition[];
  // Injected for tests; defaults to the global fetch.
  fetchImpl?: typeof fetch;
  config?: AiConfig;
  // Injected for tests; defaults to a real timer.
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
}

export interface GemmaResult {
  source: 'gemma';
  text: string | null;
  toolCalls: ToolCall[];
  model: string;
  provider: string | null;
  latencyMs: number;
  usage: { promptTokens: number; completionTokens: number } | null;
  requestId: string;
}

const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);

function sleepDefault(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(baseMs: number): number {
  return baseMs + Math.floor(Math.random() * baseMs);
}

function newRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

async function attemptOnce(
  cfg: AiConfig,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; json: any } | { ok: false; status: number | null; retryAfter?: number; network?: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  try {
    const res = await fetchImpl(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': cfg.appUrl,
        'X-Title': 'ASEAN BridgeAI',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const ra = Number(res.headers.get('retry-after'));
      return { ok: false, status: res.status, retryAfter: Number.isFinite(ra) && ra > 0 ? ra : undefined };
    }
    return { ok: true, json: await res.json() };
  } catch {
    // Timeout (abort) or network failure. Never include the error text: it may echo request data.
    return { ok: false, status: null, network: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function callGemma(opts: CallOptions): Promise<GemmaResult> {
  const cfg = opts.config ?? readAiConfig();
  const fetchImpl = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? sleepDefault;
  const maxRetries = opts.maxRetries ?? 1;
  const requestId = newRequestId();

  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: opts.messages,
    max_tokens: opts.maxTokens,
  };
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.responseFormat) {
    body.response_format = { type: 'json_schema', json_schema: opts.responseFormat };
  }
  if (opts.tools?.length) {
    body.tools = opts.tools;
    body.tool_choice = 'auto';
  }

  const started = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await attemptOnce(cfg, body, fetchImpl);
    if (result.ok) {
      const json = result.json;
      const choice = json?.choices?.[0];
      const message = choice?.message;
      if (!message) {
        throw new AiError('INVALID_MODEL_OUTPUT', 'The model returned an empty response.', 502);
      }
      return {
        source: 'gemma',
        text: typeof message.content === 'string' ? message.content : null,
        toolCalls: Array.isArray(message.tool_calls) ? message.tool_calls : [],
        model: typeof json.model === 'string' ? json.model : cfg.model,
        provider: typeof json.provider === 'string' ? json.provider : null,
        latencyMs: Date.now() - started,
        usage: json.usage
          ? { promptTokens: json.usage.prompt_tokens ?? 0, completionTokens: json.usage.completion_tokens ?? 0 }
          : null,
        requestId,
      };
    }

    const status = result.status;
    // Non-retryable client errors are mapped immediately.
    if (status === 401) throw new AiError('AI_AUTH_FAILED', 'The AI key is invalid or expired. Check server configuration.', 401);
    if (status === 402) throw new AiError('AI_INSUFFICIENT_CREDITS', 'AI credits are exhausted. Showing no AI output.', 402);
    if (status === 404) throw new AiError('AI_MODEL_UNSUPPORTED', 'The serving provider does not support a requested feature.', 404);
    if (status === 429) {
      throw new AiError('UPSTREAM_RATE_LIMIT', 'The AI service is busy. Please wait a moment and try again.', 429, result.retryAfter ?? 30);
    }
    const retryable = result.network === true || (status !== null && RETRYABLE_STATUS.has(status));
    if (retryable && attempt < maxRetries) {
      await sleep(jitter(500));
      continue;
    }
    break;
  }

  throw new AiError('AI_UNAVAILABLE', 'The AI service is unavailable right now. Please try again.', 502);
}
