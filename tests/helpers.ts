import type { ChatMessage } from '../src/lib/ai/call-gemma';
import type { TaskDeps } from '../src/lib/ai';
import type { StartupProfile } from '../src/lib/schemas';

// Scripted fake model, injected at the AI layer's `llm` seam. Each call consumes the next scripted
// reply; the last reply repeats. Errors in the script are thrown, which simulates transport failures
// (use AiError to match what the real transport throws). Transport retries are covered separately
// in tests/integration.test.ts, which injects a fake `fetch` instead.
export function fakeModel(script: Array<string | Error>) {
  const calls: ChatMessage[][] = [];
  let i = 0;
  const deps: TaskDeps & { calls: ChatMessage[][] } = {
    calls,
    async llm(messages) {
      calls.push(messages);
      const next = script[Math.min(i++, script.length - 1)];
      if (next instanceof Error) throw next;
      return {
        source: 'gemma',
        text: next,
        toolCalls: [],
        model: 'google/gemma-4-26b-a4b-it',
        provider: 'FakeProvider',
        latencyMs: 1,
        usage: null,
        requestId: 'req_fake',
      };
    },
  };
  return deps;
}

// The golden-path founder, from the handover's AgriSmart walkthrough.
export const agriSmart: StartupProfile = {
  startup_name: 'AgriSmart',
  description: 'AI leaf disease detection on phones for smallholder farms.',
  industry: 'AgriTech',
  home_country: 'Malaysia',
  target_country: 'Indonesia',
  stage: 'Seed',
  product: 'Phone-based leaf disease detection',
  primary_goal: 'Pilot Partnership',
  needs: ['Field pilot'],
  capability_tags: ['crop disease detection', 'mobile workflow'],
};

let ipCounter = 0;
// Unique IP per request so the in-memory AI rate limiter never affects unrelated tests.
export function jsonRequest(url: string, body?: unknown): Request {
  return new Request(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': `10.0.0.${++ipCounter}`,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}
