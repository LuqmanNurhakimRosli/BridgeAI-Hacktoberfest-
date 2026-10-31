// Generates one narration clip per scene with Kokoro TTS via OpenRouter,
// then writes public/audio/manifest.json with measured durations.
// Usage: node scripts/narrate.mjs [path/to/.env]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = process.argv[2] || path.join(root, '..', '.env');
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')])
);
const isReal = (k) => Boolean(k) && k.length > 10 && !k.includes('REPLACE');
const apiKey = isReal(env.KOKORO_API_KEY) ? env.KOKORO_API_KEY : env.OPENROUTER_API_KEY;
if (!isReal(apiKey)) throw new Error('No OpenRouter/Kokoro API key found in ' + envPath);

const base = (env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
const model = env.KOKORO_MODEL || 'hexgrad/kokoro-82m';
const { voice, speed, scenes } = JSON.parse(fs.readFileSync(path.join(root, 'narration.json'), 'utf8'));
const outDir = path.join(root, 'public', 'audio');
fs.mkdirSync(outDir, { recursive: true });

const manifest = [];
for (const scene of scenes) {
  const file = path.join(outDir, `${scene.id}.mp3`);
  const res = await fetch(`${base}/audio/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: scene.text, voice, speed, response_format: 'mp3' }),
  });
  if (!res.ok || !res.headers.get('content-type')?.startsWith('audio')) {
    throw new Error(`Kokoro failed for "${scene.id}": ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  const seconds = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim()
  );
  manifest.push({ id: scene.id, text: scene.text, file: `audio/${scene.id}.mp3`, seconds });
  console.log(`${scene.id.padEnd(10)} ${seconds.toFixed(2)}s`);
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ model, voice, scenes: manifest }, null, 2));
console.log('total', manifest.reduce((s, m) => s + m.seconds, 0).toFixed(2) + 's');
