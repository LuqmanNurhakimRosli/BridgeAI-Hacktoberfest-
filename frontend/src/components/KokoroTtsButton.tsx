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
  label = 'Listen',
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

  const sizeClass = size === 'md' ? 'min-h-[44px] px-4 text-sm' : 'min-h-[36px] px-3 text-[13px]';

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      {showVoiceSelector && (
        <select
          aria-label="Voice"
          value={voice}
          onChange={(e) =>
            setVoice(e.target.value as 'af_heart' | 'af_bella' | 'am_adam' | 'bf_emma')
          }
          className="min-h-[36px] rounded-lg bg-surface px-2 text-[13px] font-medium text-ink shadow-card"
        >
          {KOKORO_VOICES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={handleTogglePlay}
        aria-pressed={status === 'playing'}
        title="Read this aloud with Kokoro text-to-speech (falls back to your browser's voice)"
        className={`inline-flex items-center gap-2 rounded-lg font-semibold transition-colors cursor-pointer ${sizeClass} ${
          status === 'playing' ? 'bg-ink text-white' : 'bg-ai-wash text-ai hover:bg-ai/15'
        }`}
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Preparing audio</span>
          </>
        ) : status === 'playing' ? (
          <>
            <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
          </>
        )}
      </button>

      {status === 'playing' && providerBadge && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          {providerBadge === 'kokoro_web_speech_fallback' ? 'Browser voice' : 'Kokoro voice'}
        </span>
      )}
    </div>
  );
}

export default KokoroTtsButton;

