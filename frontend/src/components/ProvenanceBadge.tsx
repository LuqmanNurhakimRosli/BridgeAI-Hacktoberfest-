'use client';

import React from 'react';
import { BadgeCheck, ExternalLink, FlaskConical, HardDrive, Lock, Sparkles, WifiOff } from 'lucide-react';
import type { SourceStatus } from '@/types';
import { Chip, type ChipTone } from './ui';

export interface ProvenanceBadgeProps {
  status: SourceStatus | 'fictional_demo';
  sourceUrl?: string | null;
  lastVerifiedAt?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const PROVENANCE_CONFIG: Record<
  SourceStatus | 'fictional_demo',
  { label: string; tone: ChipTone; icon: React.ReactNode; title: string }
> = {
  synthetic_demo: {
    label: 'Demo data',
    tone: 'amber',
    icon: <FlaskConical className="h-3 w-3" aria-hidden="true" />,
    title: 'Sample record made for this demo. Not a live tender or partner endorsement.',
  },
  fictional_demo: {
    label: 'Demo data',
    tone: 'amber',
    icon: <FlaskConical className="h-3 w-3" aria-hidden="true" />,
    title: 'Illustrative demo record. Not a live commercial commitment.',
  },
  self_reported: {
    label: 'Saved on this device',
    tone: 'neutral',
    icon: <HardDrive className="h-3 w-3" aria-hidden="true" />,
    title: 'Recorded by you and stored in this browser only. Not checked by a third party.',
  },
  verified_public: {
    label: 'Verified source',
    tone: 'jade',
    icon: <BadgeCheck className="h-3 w-3" aria-hidden="true" />,
    title: 'Backed by a cited public source.',
  },
  verified_private: {
    label: 'Verified partner',
    tone: 'ai',
    icon: <Lock className="h-3 w-3" aria-hidden="true" />,
    title: 'Confirmed directly with the partner.',
  },
};

export function ProvenanceBadge({
  status,
  sourceUrl,
  lastVerifiedAt,
  className = '',
}: ProvenanceBadgeProps) {
  const cfg = PROVENANCE_CONFIG[status] ?? PROVENANCE_CONFIG.synthetic_demo;
  const title = lastVerifiedAt ? `${cfg.title} Last checked ${lastVerifiedAt}.` : cfg.title;

  return (
    <span data-testid={`provenance-badge-${status}`} className={`inline-flex items-center gap-1 ${className}`}>
      <Chip tone={cfg.tone} icon={cfg.icon} title={title}>
        {cfg.label}
      </Chip>
      {status === 'verified_public' && sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-jade hover:bg-jade-wash"
          aria-label="Open source"
        >
          <ExternalLink className="h-3.5 w-3.5" />
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

export function AiSourceBadge({ source = 'demo_fixture', model, className = '' }: AiSourceBadgeProps) {
  if (source === 'gemma_live') {
    return (
      <span data-testid="ai-source-badge-gemma_live" className={className}>
        <Chip
          tone="ai"
          icon={<Sparkles className="h-3 w-3" aria-hidden="true" />}
          title={model ? `Generated live by ${model} via OpenRouter` : 'Generated live by Gemma 4 via OpenRouter'}
        >
          Live AI
        </Chip>
      </span>
    );
  }

  return (
    <span data-testid="ai-source-badge-demo_fixture" className={className}>
      <Chip
        tone="neutral"
        icon={<WifiOff className="h-3 w-3" aria-hidden="true" />}
        title="No live AI key detected, so results come from a built-in sample. Add OPENROUTER_API_KEY to use Gemma 4."
      >
        Sample AI
      </Chip>
    </span>
  );
}

export default ProvenanceBadge;
