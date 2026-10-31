// Live smoke test for the OpenRouter key and Gemma model. Reads OPENROUTER_API_KEY from the environment only.
//   npx tsx scripts/smoke-openrouter.ts
// Prints model, provider, latency and usage. Never prints the key.

import { callGemma } from '../src/lib/ai/call-gemma';
import { readAiConfig } from '../src/lib/ai/config';

async function main() {
  const cfg = readAiConfig();

  const plain = await callGemma({
    config: cfg,
    messages: [{ role: 'user', content: 'Reply with one word: READY' }],
    maxTokens: 40,
  });
  console.log('plain:', { text: plain.text, model: plain.model, provider: plain.provider, latency_ms: plain.latencyMs, usage: plain.usage });

  const tool = await callGemma({
    config: cfg,
    messages: [{ role: 'user', content: 'Search for agritech startups in Indonesia.' }],
    maxTokens: 200,
    tools: [{ type: 'function', function: { name: 'search_opportunities', description: 'Search catalog', parameters: { type: 'object', properties: { country: { type: ['string', 'null'] } }, required: ['country'], additionalProperties: false } } }],
  });
  console.log('tools:', { toolCalls: tool.toolCalls.map((t) => t.function), provider: tool.provider, latency_ms: tool.latencyMs });
}

main().catch((err) => {
  console.error('Smoke test failed:', (err as { code?: string }).code ?? 'UNKNOWN');
  process.exitCode = 1;
});
