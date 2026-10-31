import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson, route } from '@/lib/api';

const KOKORO_VOICES = ['af_heart', 'af_bella', 'am_adam', 'bf_emma'] as const;

const TtsRequestSchema = z.object({
  text: z.string().min(1).max(3000),
  voice: z.enum(KOKORO_VOICES).optional().default('af_heart'),
  speed: z.number().min(0.5).max(2.0).optional().default(1.0),
  lang: z.string().max(16).optional().default('en-US'),
});

export type KokoroVoiceId = (typeof KOKORO_VOICES)[number];

function hasRealApiKey(key?: string): boolean {
  return Boolean(
    key &&
      key.trim().length > 10 &&
      !key.includes('REPLACE_WITH_REAL_KEY') &&
      !key.includes('YOUR_KEY')
  );
}

async function handleTts(request: Request) {
  // Validation errors (ZodError / AppError) propagate to route() for the standard envelope.
  const { text, voice, speed, lang } = TtsRequestSchema.parse(await readJson(request));

  try {
    const configuredVoice = voice || process.env.KOKORO_DEFAULT_VOICE || 'af_heart';
    const configuredModel = process.env.KOKORO_MODEL || 'hexgrad/kokoro-82m';

    // Support OpenRouter API key directly as well as optional dedicated KOKORO_API_KEY
    const apiKey = hasRealApiKey(process.env.KOKORO_API_KEY)
      ? process.env.KOKORO_API_KEY!.trim()
      : hasRealApiKey(process.env.OPENROUTER_API_KEY)
      ? process.env.OPENROUTER_API_KEY!.trim()
      : null;

    // Candidate endpoints in priority order:
    // 1. Explicit KOKORO_TTS_URL (local backend or OpenRouter/hosted Kokoro endpoint)
    // 2. Teammate's merged local backend server (BACKEND_API_URL)
    // 3. OpenRouter audio speech endpoint when OPENROUTER_API_KEY is present
    const candidateUrls: string[] = [];
    if (process.env.KOKORO_TTS_URL) {
      candidateUrls.push(process.env.KOKORO_TTS_URL.trim());
    }
    if (process.env.BACKEND_API_URL) {
      const base = process.env.BACKEND_API_URL.replace(/\/+$/, '');
      candidateUrls.push(`${base}/api/tts`);
      candidateUrls.push(`${base}/tts`);
      candidateUrls.push(`${base}/v1/audio/speech`);
    }
    if (apiKey) {
      const openRouterBase = (
        process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
      ).replace(/\/+$/, '');
      candidateUrls.push(`${openRouterBase}/audio/speech`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': 'ASEAN BridgeAI',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    for (const endpoint of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        const isOpenAiSpeechStyle =
          endpoint.endsWith('/audio/speech') || endpoint.includes('openrouter.ai');

        const payload = isOpenAiSpeechStyle
          ? {
              model: configuredModel,
              input: text,
              voice: configuredVoice,
              speed,
              response_format: 'mp3',
            }
          : {
              model: configuredModel,
              text,
              input: text,
              voice: configuredVoice,
              speed,
              lang,
            };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          continue;
        }

        const contentType = response.headers.get('content-type') || '';

        // 1. Binary audio stream (audio/wav, audio/mpeg, audio/ogg)
        if (contentType.startsWith('audio/') || contentType.includes('octet-stream')) {
          const arrayBuffer = await response.arrayBuffer();
          const base64Audio = Buffer.from(arrayBuffer).toString('base64');
          return NextResponse.json({
            ok: true,
            fallback: false,
            provider: endpoint.includes('openrouter.ai')
              ? 'kokoro_openrouter'
              : 'kokoro_backend',
            voice: configuredVoice,
            content_type: contentType.startsWith('audio/') ? contentType : 'audio/mpeg',
            audio_base64: base64Audio,
          });
        }

        // 2. JSON response from backend / OpenRouter Kokoro wrapper
        if (contentType.includes('application/json')) {
          const data = await response.json();
          const audioBase64 =
            data.audio_base64 ||
            data.audio ||
            data.data ||
            data.choices?.[0]?.message?.audio?.data ||
            null;
          const audioUrl = data.audio_url || data.url || null;

          if (audioBase64 || audioUrl) {
            return NextResponse.json({
              ok: true,
              fallback: false,
              provider: endpoint.includes('openrouter.ai')
                ? 'kokoro_openrouter'
                : 'kokoro_backend',
              voice: configuredVoice,
              content_type: data.content_type || 'audio/wav',
              audio_base64: audioBase64,
              audio_url: audioUrl,
            });
          }
        }
      } catch {
        // Try next candidate URL or fall back cleanly
      }
    }

    // Graceful fallback when local backend isn't merged yet or key is not set
    return NextResponse.json({
      ok: true,
      fallback: true,
      provider: 'kokoro_web_speech_fallback',
      voice: configuredVoice,
      speed,
      lang,
      text,
      notice:
        'Using Web Speech synthesis fallback until OPENROUTER_API_KEY / KOKORO_TTS_URL / BACKEND_API_URL returns an audio stream.',
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'TTS_ERROR',
          message: 'Unable to process Kokoro TTS request.',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = route(handleTts, { ai: true });
