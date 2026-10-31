'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { SourceStatus } from '@/types';

export interface ProvenanceBadgeProps {
  status: SourceStatus | 'fictional_demo';
  sourceUrl?: string | null;
  lastVerifiedAt?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const PROVENANCE_CONFIG: Record<
  SourceStatus | 'fictional_demo',
  {
    label: string;
    shortLabel: string;
    classes: string;
    title: string;
  }
> = {
  synthetic_demo: {
    label: '🧪 Synthetic Demo Record — Illustrative Only',
    shortLabel: '🧪 Synthetic Demo Record — Illustrative Only',
    classes:
      'bg-amber-50 text-amber-900 border-amber-300/90 shadow-xs',
    title:
      'Synthetic demo record created for hackathon evaluation — not an active commercial tender or live partner endorsement.',
  },
  fictional_demo: {
    label: '🧪 Synthetic Demo Record — Illustrative Only',
    shortLabel: '🧪 Synthetic Demo Record — Illustrative Only',
    classes:
      'bg-amber-50 text-amber-900 border-amber-300/90 shadow-xs',
    title:
      'Illustrative demo record — not a live commercial commitment.',
  },
  self_reported: {
    label: '📝 Self-Reported (Saved on this device)',
    shortLabel: '📝 Self-Reported (Saved on this device)',
    classes:
      'bg-sky-50 text-sky-900 border-sky-300/90 shadow-xs',
    title:
      'User-recorded record persisted locally in this browser (localStorage). Not third-party audited.',
  },
  verified_public: {
    label: '✅ Verified Public Source',
    shortLabel: '✅ Verified Public Source',
    classes:
      'bg-emerald-50 text-emerald-900 border-emerald-300/90 shadow-xs',
    title:
      'Backed by a cited public ecosystem source URL.',
  },
  verified_private: {
    label: '🔒 Verified Partner Record',
    shortLabel: '🔒 Verified Partner Record',
    classes:
      'bg-violet-50 text-violet-900 border-violet-300/90 shadow-xs',
    title:
      'Verified bilateral partner record.',
  },
};

export function ProvenanceBadge({
  status,
  sourceUrl,
  lastVerifiedAt,
  size = 'sm',
  className = '',
}: ProvenanceBadgeProps) {
  const cfg = PROVENANCE_CONFIG[status] ?? PROVENANCE_CONFIG.synthetic_demo;
  const sizeClasses =
    size === 'md'
      ? 'px-3 py-1 text-xs font-semibold'
      : 'px-2.5 py-0.5 text-[11px] font-medium';

  const tooltip = lastVerifiedAt
    ? `${cfg.title} (Verified: ${lastVerifiedAt})`
    : cfg.title;

  return (
    <span
      title={tooltip}
      data-testid={`provenance-badge-${status}`}
      className={`inline-flex items-center gap-1.5 rounded-full border leading-snug tracking-tight ${sizeClasses} ${cfg.classes} ${className}`}
    >
      <span>{cfg.label}</span>
      {status === 'verified_public' && sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 underline decoration-emerald-600/60 hover:text-emerald-950"
          aria-label="Open verified public source URL"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : null}
    </span>
  );
}

export interface AiSourceBadgeProps {
  source?: 'gemma_live' | 'demo_fixture';
  model?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function AiSourceBadge({
  source = 'demo_fixture',
  model,
  size = 'sm',
  className = '',
}: AiSourceBadgeProps) {
  const isLive = source === 'gemma_live';
  const sizeClasses =
    size === 'md'
      ? 'px-3 py-1 text-xs font-semibold'
      : 'px-2.5 py-0.5 text-[11px] font-medium';

  if (isLive) {
    return (
      <span
        data-testid="ai-source-badge-gemma_live"
        title={
          model
            ? `Powered by Gemma 4 (${model}) live via OpenRouter`
            : 'Powered by Gemma 4 (Live via OpenRouter)'
        }
        className={`inline-flex items-center gap-1.5 rounded-full border border-violet-300 bg-violet-50 text-violet-900 shadow-xs ${sizeClasses} ${className}`}
      >
        <span>✨ Gemma 4 26B A4B (Live OpenRouter)</span>
      </span>
    );
  }

  return (
    <span
      data-testid="ai-source-badge-demo_fixture"
      title="Safe Demo Fixture (Fallback) — deterministic local schema output when live API key is absent or offline"
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 text-slate-800 shadow-xs ${sizeClasses} ${className}`}
    >
      <span>⚡ Demo Fixture (Offline Fallback)</span>
    </span>
  );
}

export default ProvenanceBadge;
