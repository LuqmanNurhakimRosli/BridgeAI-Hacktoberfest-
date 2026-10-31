'use client';

import React from 'react';
import { Bookmark, BookmarkCheck, CheckCircle2, ChevronDown, CircleAlert, FileText, Sparkles } from 'lucide-react';
import type { ReverseMatch, StartupProfile } from '@/types';
import { AiSourceBadge, ProvenanceBadge } from './ProvenanceBadge';
import { KokoroTtsButton } from './KokoroTtsButton';
import { DEMAND_KIND_LABEL, eligibilityCopy } from './DemandBoard';
import { BackLink, Button, Chip, FitMeter, Panel, countryCode, formatMoneyRange } from './ui';

export interface ReverseMatchDetailProps {
  profile: StartupProfile;
  match: ReverseMatch;
  onBack: () => void;
  onOpenPocBuilder: (match: ReverseMatch) => void;
  onSaveQualifiedDeal: (match: ReverseMatch) => void;
  isDealSaved: boolean;
}

function Disclosure({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-2xl bg-surface shadow-card">
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[15px] font-bold text-ink">{title}</span>
          {summary ? <span className="block text-sm text-muted">{summary}</span> : null}
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-line px-4 py-4 text-sm leading-relaxed text-ink sm:px-5">{children}</div>
    </details>
  );
}

export function ReverseMatchDetail({
  profile,
  match,
  onBack,
  onOpenPocBuilder,
  onSaveQualifiedDeal,
  isDealSaved,
}: ReverseMatchDetailProps) {
  const { demand } = match;
  const eligibility = eligibilityCopy(match);
  const money = formatMoneyRange(demand.budget_range);
  const startupName = profile.startup_name || 'Your startup';

  const whyText =
    match.ai_analysis?.why_match ||
    `${startupName} lines up with ${demand.buyer_name} on ${match.reasons.slice(0, 2).join(' and ') || 'sector and stage'}.`;
  const collaborationText =
    match.ai_analysis?.potential_collaboration ||
    `A short exploratory pilot in ${demand.country} to test ${demand.must_have.join(' and ')} before any purchase decision.`;
  const nextText =
    match.ai_analysis?.next_action ||
    `Book a scoping call with ${demand.buyer_name} to agree the test plan, data consent and what success looks like.`;
  const risks = Array.from(new Set([...(match.ai_analysis?.fit_gaps || []), ...(match.unknowns || [])]));

  const breakdown = [
    {
      label: 'Sector and problem',
      points: 30,
      detail: `${profile.industry || 'Your sector is not set'} compared with ${demand.industry}`,
      passed: Boolean(
        profile.industry &&
          (profile.industry.toLowerCase() === demand.industry.toLowerCase() ||
            match.reasons.some((r) => r.toLowerCase().includes('sector')))
      ),
    },
    {
      label: 'Must-have skills',
      points: 30,
      detail: demand.must_have.join(', '),
      passed: !match.unknowns.some((u) => u.toLowerCase().includes('must-have not yet evidenced')),
    },
    {
      label: 'Target country',
      points: 15,
      detail: `You target ${profile.target_country || 'no country yet'}, the challenge is in ${demand.country}`,
      passed:
        (profile.target_country || '').toLowerCase() === demand.country.toLowerCase() ||
        (profile.home_country || '').toLowerCase() === demand.country.toLowerCase(),
    },
    {
      label: 'Company stage',
      points: 15,
      detail: `You are ${profile.stage || 'not set'}, they accept ${demand.stages.join(', ')}`,
      passed: Boolean(profile.stage && demand.stages.includes(profile.stage)),
    },
    {
      label: 'Goal and pilot readiness',
      points: 10,
      detail: profile.primary_goal ? `Your goal: ${profile.primary_goal}` : 'Your main goal is not set',
      passed: Boolean(profile.primary_goal && demand.goals.includes(profile.primary_goal)),
    },
  ];

  const briefing = `${demand.title}, posted by ${demand.buyer_name} in ${demand.country}. Fit score ${match.score} out of 100. This is a rule-based score, not a funding probability. Why it fits: ${whyText} Suggested next step: ${nextText}`;

  return (
    <section aria-label="Challenge details" className="space-y-5 pb-28 md:pb-24">
      <BackLink onClick={onBack}>All challenges</BackLink>

      {/* What it is */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface text-xs font-extrabold text-ink shadow-card">
            {countryCode(demand.country)}
          </span>
          <span className="truncate">{demand.buyer_name}</span>
        </div>
        <h2 className="text-2xl font-bold leading-tight text-ink sm:text-3xl">{demand.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={eligibility.tone}>{eligibility.label}</Chip>
          <ProvenanceBadge status={demand.data_status} sourceUrl={demand.source_url} lastVerifiedAt={demand.last_verified_at} />
          <Chip>{DEMAND_KIND_LABEL[demand.demand_kind]}</Chip>
          {money ? <Chip>{money} (illustrative)</Chip> : null}
          {demand.deadline_label ? <Chip>{demand.deadline_label}</Chip> : null}
        </div>
        <p className="max-w-prose text-[15px] leading-relaxed text-muted">{demand.problem}</p>
      </header>

      {/* Fit at a glance */}
      <Panel data-testid="compatibility-gauge-card" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="w-40">
            <FitMeter score={match.score} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AiSourceBadge source={match.ai_source || 'demo_fixture'} />
            <KokoroTtsButton label="Listen" text={briefing} showVoiceSelector />
          </div>
        </div>
        <p className="text-xs text-muted">
          Rule-based fit with your profile. It is not a funding probability or a promise of selection.
        </p>

        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <Sparkles className="h-4 w-4 text-ai" aria-hidden="true" />
            Why it fits
          </h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink">{whyText}</p>
          {match.reasons.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {match.reasons.slice(0, 3).map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-jade" aria-hidden="true" />
                  {r}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="rounded-xl bg-jade-wash p-3.5">
          <h3 className="text-sm font-bold text-jade">Suggested next step</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink">{nextText}</p>
        </div>
      </Panel>

      {/* Detail on demand */}
      <div className="space-y-3">
        <Disclosure
          title="What is still unknown"
          summary={risks.length ? `${risks.length} thing${risks.length === 1 ? '' : 's'} to check before you pitch` : 'Nothing flagged'}
          defaultOpen={risks.length > 0}
        >
          {risks.length > 0 ? (
            <ul className="space-y-2">
              {risks.map((gap) => (
                <li key={gap} className="flex items-start gap-2">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" aria-hidden="true" />
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Still confirm data consent and local rules with the partner before a pilot starts.</p>
          )}
        </Disclosure>

        <Disclosure title="How the score is worked out" summary="Five checks, 100 points in total">
          <ul className="divide-y divide-line">
            {breakdown.map((b) => (
              <li key={b.label} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                {b.passed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-jade" aria-label="Met" />
                ) : (
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" aria-label="Not yet met" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{b.label}</span>
                    <span className="tabular text-xs text-muted">up to {b.points} pts</span>
                  </div>
                  <p className="text-sm text-muted">{b.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Disclosure>

        <Disclosure title="What a pilot could look like" summary="A starting idea to discuss, not an offer">
          <p>{collaborationText}</p>
        </Disclosure>

        <Disclosure title="Challenge requirements">
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-semibold text-muted">Must have</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {demand.must_have.map((m) => <Chip key={m}>{m}</Chip>)}
              </dd>
            </div>
            {demand.nice_to_have.length > 0 ? (
              <div>
                <dt className="text-xs font-semibold text-muted">Nice to have</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {demand.nice_to_have.map((m) => <Chip key={m}>{m}</Chip>)}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-semibold text-muted">Accepted stages</dt>
              <dd className="mt-0.5">{demand.stages.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">About this record</dt>
              <dd className="mt-0.5 space-y-1 text-muted">
                {(demand.eligibility_notes?.length
                  ? demand.eligibility_notes
                  : ['Sample record made for this demo. Not a live tender.']
                ).map((note) => (
                  <p key={note} className="flex items-start gap-1.5">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {note}
                  </p>
                ))}
              </dd>
            </div>
          </dl>
        </Disclosure>
      </div>

      {/* Sticky actions: one primary */}
      <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-md md:bottom-0 md:left-60">
        <div className="mx-auto flex max-w-5xl items-center gap-2 sm:px-2">
          <Button
            variant="secondary"
            onClick={() => onSaveQualifiedDeal(match)}
            disabled={isDealSaved}
            data-testid="save-qualified-deal-btn"
            aria-label={isDealSaved ? 'Saved to deals' : 'Save to deals'}
            icon={
              isDealSaved ? (
                <BookmarkCheck className="h-4 w-4 text-jade" aria-hidden="true" />
              ) : (
                <Bookmark className="h-4 w-4" aria-hidden="true" />
              )
            }
          >
            <span className="hidden sm:inline">{isDealSaved ? 'Saved' : 'Save to deals'}</span>
          </Button>
          <Button block size="lg" variant="jade" onClick={() => onOpenPocBuilder(match)} data-testid="detail-create-poc-plan-btn">
            Draft pilot plan
          </Button>
        </div>
      </div>
    </section>
  );
}

export default ReverseMatchDetail;
