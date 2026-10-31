'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Square, Loader2, Sparkles } from 'lucide-react';

export type KokoroVoiceOption = {
  id: 'af_heart' | 'af_bella' | 'am_adam' | 'bf_emma';
  label: string;
  accent: string;
};

export const KOKORO_VOICES: KokoroVoiceOption[] = [
  { id: 'af_heart', label: 'Heart (F)', accent: 'Natural Warm' },
  { id: 'af_bella', label: 'Bella (F)', accent: 'Executive Clear' },
  { id: 'am_adam', label: 'Adam (M)', accent: 'Founder Pitch' },
  { id: 'bf_emma', label: 'Emma (F)', accent: 'British Advisory' },
];

export interface KokoroTtsButtonProps {
  text: string;
  label?: string;
  lang?: 'en-US' | 'ms-MY' | 'id-ID';
  defaultVoice?: 'af_heart' | 'af_bella' | 'am_adam' | 'bf_emma';
  showVoiceSelector?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function KokoroTtsButton({
  text,
  label = 'Listen (Kokoro TTS)',
  lang = 'en-US',
  defaultVoice = 'af_heart',
  showVoiceSelector = false,
  size = 'sm',
  className = '',
}: KokoroTtsButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [voice, setVoice] = useState<'af_heart' | 'af_bella' | 'am_adam' | 'bf_emma'>(
    defaultVoice
  );
  const [providerBadge, setProviderBadge] = useState<
    'kokoro_openrouter' | 'kokoro_backend' | 'kokoro_web_speech_fallback' | null
  >(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  function stopPlayback() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
  }

  function speakWithBrowserFallback(cleanText: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatus('idle');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 1.02;
    utterance.pitch = voice.startsWith('am_') ? 0.92 : 1.05;

    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang.split('-')[0].toLowerCase();
    const preferred =
      voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(langPrefix) &&
          (v.name.includes('Natural') ||
            v.name.includes('Neural') ||
            v.name.includes('Google'))
      ) || voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));

    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => setStatus('idle');

    setProviderBadge('kokoro_web_speech_fallback');
    setStatus('playing');
    window.speechSynthesis.speak(utterance);
  }

  async function handleTogglePlay() {
    if (status === 'playing' || status === 'loading') {
      stopPlayback();
      return;
    }

    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voice,
          speed: 1.0,
          lang,
        }),
      });

      if (!response.ok) {
        speakWithBrowserFallback(cleanText);
        return;
      }

      const data = await response.json();

      if (!data.fallback && (data.audio_base64 || data.audio_url)) {
        const src = data.audio_url
          ? data.audio_url
          : `data:${data.content_type || 'audio/wav'};base64,${data.audio_base64}`;
        const audio = new Audio(src);
        audioRef.current = audio;
        setProviderBadge(
          data.provider === 'kokoro_openrouter' ? 'kokoro_openrouter' : 'kokoro_backend'
        );
        setStatus('playing');
        audio.onended = () => setStatus('idle');
        audio.onerror = () => speakWithBrowserFallback(cleanText);
        await audio.play();
        return;
      }

      speakWithBrowserFallback(cleanText);
    } catch {
      speakWithBrowserFallback(cleanText);
    }
  }

  const paddingClass =
    size === 'md' ? 'px-3.5 py-2 text-xs min-h-[40px]' : 'px-2.5 py-1.5 text-[11px] min-h-[34px]';

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {showVoiceSelector && (
        <select
          aria-label="Select Kokoro TTS Voice"
          value={voice}
          onChange={(e) =>
            setVoice(e.target.value as 'af_heart' | 'af_bella' | 'am_adam' | 'bf_emma')
          }
          className="rounded-lg border border-violet-200 bg-violet-50/80 px-2 py-1 text-[11px] font-medium text-[#0F2D5B] focus:border-violet-500 focus:outline-none"
        >
          {KOKORO_VOICES.map((v) => (
            <option key={v.id} value={v.id}>
              🎙️ Kokoro: {v.label}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={handleTogglePlay}
        title="Synthesize AI speech via Kokoro TTS API (with automatic browser voice fallback)"
        className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${paddingClass} ${
          status === 'playing'
            ? 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100'
            : 'border-violet-200 bg-violet-50/90 text-violet-900 hover:bg-violet-100'
        }`}
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600" />
            <span>Kokoro TTS...</span>
          </>
        ) : status === 'playing' ? (
          <>
            <Square className="h-3 w-3 fill-rose-600 text-rose-600" />
            <span>Stop Audio</span>
            <span className="ml-0.5 inline-flex items-end gap-0.5 h-3">
              <span className="w-0.5 h-2 bg-rose-500 animate-pulse rounded-full" />
              <span className="w-0.5 h-3 bg-rose-600 animate-bounce rounded-full" />
              <span className="w-0.5 h-1.5 bg-rose-500 animate-pulse rounded-full" />
            </span>
          </>
        ) : (
          <>
            <Volume2 className="h-3.5 w-3.5 text-violet-600" />
            <span>{label}</span>
          </>
        )}
      </button>

      {status === 'playing' && providerBadge && (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-800">
          <Sparkles className="h-2.5 w-2.5" />
          {providerBadge === 'kokoro_openrouter'
            ? 'Kokoro OpenRouter Stream'
            : providerBadge === 'kokoro_backend'
            ? 'Kokoro Neural Stream'
            : 'Kokoro Voice Active'}
        </span>
      )}
    </div>
  );
}

export default KokoroTtsButton;

