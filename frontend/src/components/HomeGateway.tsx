'use client';

import React from 'react';
import { ArrowRight, Check, ChevronRight, PlayCircle } from 'lucide-react';
import type { Deal, DemandBrief, ReverseMatch, StartupProfile } from '@/types';
import type { NavTab } from './AppShell';
import { ProvenanceBadge } from './ProvenanceBadge';
import { KokoroTtsButton } from './KokoroTtsButton';
import { Button, FitMeter, Panel, RouteRibbon, SectionHeading, countryCode } from './ui';
import { rankDemandMatches } from '@/lib/demand-matcher';
import demandBriefsData from '@/data/demand-briefs.json';

export interface HomeGatewayProps {
  profile?: StartupProfile | null;
  isPassportConfirmed?: boolean;
  demands?: DemandBrief[];
  matches?: ReverseMatch[];
  localDeals?: Deal[];
  demoDeals?: Deal[];
  onNavigate: (tab: NavTab) => void;
  onRunGoldenPath: () => void;
  onSelectMatch?: (match: ReverseMatch) => void;
}

interface NextStep {
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}

function formatDue(iso: string): string {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`;
  if (days === 0) return 'due today';
  return `due in ${days} day${days === 1 ? '' : 's'}`;
}

export function HomeGateway({
  profile,
  isPassportConfirmed = false,
  demands,
  matches,
  localDeals = [],
  onNavigate,
  onRunGoldenPath,
  onSelectMatch,
}: HomeGatewayProps) {
  const demandsList = demands && demands.length > 0 ? demands : (demandBriefsData as DemandBrief[]);
  const effectiveProfile = profile ?? null;
  const ranked =
    matches && matches.length > 0
      ? matches
      : effectiveProfile
      ? rankDemandMatches(effectiveProfile, demandsList)
      : [];
  const topMatches = ranked.slice(0, 3);
  const best = topMatches[0];
  const startupName = effectiveProfile?.startup_name || 'your startup';

  const openMatch = (m: ReverseMatch) => (onSelectMatch ? onSelectMatch(m) : onNavigate('discover'));

  const hasPlan = localDeals.some((d) => Boolean(d.poc_plan));
  const pendingTask = localDeals
    .flatMap((d) => d.tasks.filter((t) => t.status === 'pending').map((t) => ({ deal: d, task: t })))
    .sort((a, b) => a.task.due_at.localeCompare(b.task.due_at))[0];

  // One next step, chosen from where the founder actually is in the journey.
  const next: NextStep = !isPassportConfirmed
    ? {
        title: 'Confirm your startup profile',
        body: 'We match you to challenges using your sector, stage and target market. Check those details first.',
        cta: 'Review profile',
        onClick: () => onNavigate('profile'),
      }
    : pendingTask
    ? {
        title: `Follow up with ${pendingTask.deal.partner_name}`,
        body: `${pendingTask.task.title}, ${formatDue(pendingTask.task.due_at)}.`,
        cta: 'Open deal',
        onClick: () => onNavigate('deals'),
      }
    : best && localDeals.length === 0
    ? {
        title: `Look at your best match: ${best.demand.buyer_name}`,
        body: `${best.demand.title}. See why it fits and what is still unknown.`,
        cta: 'See the match',
        onClick: () => openMatch(best),
      }
    : {
        title: 'Find your next challenge',
        body: `${ranked.length} challenges are ranked against your profile.`,
        cta: 'Browse challenges',
        onClick: () => onNavigate('discover'),
      };

  const journey = [
    { label: 'Profile confirmed', done: isPassportConfirmed, go: () => onNavigate('profile') },
    { label: 'Challenge chosen', done: localDeals.length > 0, go: () => onNavigate('discover') },
    { label: 'Pilot plan drafted', done: hasPlan, go: () => onNavigate('discover') },
    { label: 'Follow-up scheduled', done: localDeals.some((d) => d.tasks.length > 0), go: () => onNavigate('deals') },
  ];
  const doneCount = journey.filter((j) => j.done).length;

  const briefing = best
    ? `Here is your BridgeAI briefing for ${startupName}. We ranked ${ranked.length} ASEAN challenges against your profile. Your strongest fit is ${best.demand.buyer_name} in ${best.demand.country}, with a fit score of ${best.score} out of 100, for ${best.demand.title}. This is a rule-based fit score, not a funding probability.`
    : `Welcome to BridgeAI. Confirm your startup profile to see ranked ASEAN challenges.`;

  return (
    <div className="space-y-8">
      {/* Boarding-pass hero: where you are going, and the one thing to do next */}
      <section aria-labelledby="home-next-step" className="overflow-hidden rounded-3xl bg-ink text-white shadow-float">
        <div className="space-y-4 p-5 sm:p-7">
          <p className="text-sm font-medium text-white/70">
            {isPassportConfirmed ? `Welcome back, ${startupName}` : 'Welcome to BridgeAI'}
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <RouteRibbon from={effectiveProfile?.home_country} to={effectiveProfile?.target_country} size="lg" tone="dark" />
            <div className="text-right text-sm text-white/70">
              <div className="font-semibold text-white">{effectiveProfile?.industry || 'Sector not set'}</div>
              <div>{effectiveProfile?.stage || 'Stage not set'}</div>
            </div>
          </div>
        </div>

        {/* Perforation */}
        <div aria-hidden="true" className="relative h-0">
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-paper" />
          <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-paper" />
          <span className="absolute left-5 right-5 top-0 border-t-2 border-dashed border-white/20" />
        </div>

        <div className="space-y-4 p-5 pt-6 sm:p-7 sm:pt-7">
          <div>
            <p className="text-xs font-semibold text-jade-bright">Next step</p>
            <h2 id="home-next-step" className="mt-1 text-xl font-bold leading-snug sm:text-2xl">
              {next.title}
            </h2>
            <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-white/75">{next.body}</p>
          </div>
          <button
            type="button"
            onClick={next.onClick}
            data-testid="home-next-step-cta"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-jade-bright px-5 text-[15px] font-bold text-ink transition-colors hover:bg-[#3fd3a4] cursor-pointer"
          >
            {next.cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Top matches */}
      <section aria-labelledby="home-matches" className="space-y-3">
        <div id="home-matches">
          <SectionHeading
            title="Best matches for you"
            description="Ranked by fit with your profile. A fit score is not a funding probability."
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('discover')}>
                See all {ranked.length}
              </Button>
            }
          />
        </div>

        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-card">
          {topMatches.map((m) => (
            <li key={m.demand_id}>
              <button
                type="button"
                onClick={() => openMatch(m)}
                data-testid={`featured-challenge-${m.demand_id}`}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-paper cursor-pointer"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paper text-sm font-extrabold text-ink">
                  {countryCode(m.demand.country)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[15px] font-bold leading-snug text-ink">{m.demand.title}</span>
                  <span className="mt-0.5 block truncate text-sm text-muted">{m.demand.buyer_name}</span>
                  <span className="mt-2 block">
                    <ProvenanceBadge status={m.demand.data_status} sourceUrl={m.demand.source_url} lastVerifiedAt={m.demand.last_verified_at} />
                  </span>
                </span>
                <FitMeter score={m.score} compact />
                <ChevronRight className="hidden h-5 w-5 shrink-0 text-muted sm:block" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Journey progress: a real sequence, so it is numbered */}
      <section aria-labelledby="home-progress" className="space-y-3">
        <SectionHeading
          title="Your progress"
          description={`${doneCount} of ${journey.length} steps done`}
        />
        <Panel as="div" className="p-2 sm:p-2">
          <ol className="grid gap-1 sm:grid-cols-4">
            {journey.map((step, i) => (
              <li key={step.label}>
                <button
                  type="button"
                  onClick={step.go}
                  className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-paper cursor-pointer"
                >
                  <span
                    className={`tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      step.done ? 'bg-jade text-white' : 'border-2 border-line text-muted'
                    }`}
                  >
                    {step.done ? <Check className="h-4 w-4" aria-label="Done" /> : i + 1}
                  </span>
                  <span className={`text-sm font-semibold ${step.done ? 'text-ink' : 'text-muted'}`}>{step.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </Panel>
      </section>

      {/* Guided demo for first-time visitors and judges */}
      <Panel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">New here? Try the guided demo</h2>
          <p className="mt-0.5 max-w-prose text-sm text-muted">
            Fills in a sample AgriTech startup, picks its best match and drafts a pilot plan, so you can see each step.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="jade" onClick={onRunGoldenPath} icon={<PlayCircle className="h-4 w-4" aria-hidden="true" />} data-testid="hero-golden-path-cta">
            Run guided demo
          </Button>
          <KokoroTtsButton label="Listen to briefing" text={briefing} size="md" />
        </div>
      </Panel>
    </div>
  );
}

export default HomeGateway;
