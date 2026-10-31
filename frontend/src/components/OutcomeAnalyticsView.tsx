'use client';

import React, { useMemo, useState } from 'react';
import type { Deal } from '@/types';
import { computeFunnelMetrics, percent, reached } from '@/lib/kpi-metrics';
import { EmptyState, FilterChip, Panel } from './ui';

export interface OutcomeAnalyticsViewProps {
  localDeals: Deal[];
  demoDeals: Deal[];
  defaultCohort?: 'local' | 'demo';
}

type Cohort = 'local' | 'demo';

const LATE_STATES = ['proposal_shared', 'agreement_signed', 'poc_running', 'poc_completed', 'contract_signed', 'paid'] as const;

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Panel as="div" className="space-y-1">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="tabular text-3xl font-extrabold text-ink">{value}</p>
      <p className="text-xs text-muted">{detail}</p>
    </Panel>
  );
}

function BarRow({ label, count, of }: { label: string; count: number; of: number }) {
  const pct = percent(count, of);
  return (
    <li className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">{label}</span>
        <span className="tabular text-muted">
          <span className="font-bold text-ink">{count}</span>
          {pct !== null ? ` (${pct}%)` : ''}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink/[0.07]">
        <div className="h-full rounded-full bg-ink" style={{ width: `${pct ?? 0}%` }} />
      </div>
    </li>
  );
}

export function OutcomeAnalyticsView({ localDeals, demoDeals, defaultCohort }: OutcomeAnalyticsViewProps) {
  const [cohort, setCohort] = useState<Cohort>(defaultCohort ?? (localDeals.length > 0 ? 'local' : 'demo'));
  const deals = cohort === 'local' ? localDeals : demoDeals;
  const m = useMemo(() => computeFunnelMetrics(deals), [deals]);

  const qualified = m.qualified.numerator;
  const meetingRate = percent(m.first_meeting.numerator, qualified);
  const proposalOrPilot = deals.filter(
    (d) => (LATE_STATES as readonly string[]).includes(d.state) || d.events.some((e) => (LATE_STATES as readonly string[]).includes(e.to_state))
  ).length;
  const paidRate = m.pocToPaidConversion.rate_percent;

  const byCountry = m.byCountry.slice(0, 5);
  const signedCountries = new Set(
    deals
      .filter((d) => ['contract_signed', 'paid'].includes(d.state) || reached(d.events, 'contract_signed') || reached(d.events, 'paid'))
      .map((d) => d.country)
  );

  return (
    <section aria-label="Outcomes" className="space-y-6">
      <div className="space-y-2">
        <div role="group" aria-label="Whose numbers" className="flex flex-wrap gap-2">
          <FilterChip active={cohort === 'local'} onClick={() => setCohort('local')}>
            My deals ({localDeals.length})
          </FilterChip>
          <FilterChip active={cohort === 'demo'} onClick={() => setCohort('demo')}>
            Demo examples ({demoDeals.length})
          </FilterChip>
        </div>
        <p className="text-sm text-muted">
          {cohort === 'local'
            ? 'Worked out from the stage updates you recorded in this browser.'
            : 'Sample data to show what this page looks like with more deals. Not real results.'}
        </p>
      </div>

      {deals.length === 0 ? (
        <EmptyState
          title="No outcomes yet"
          body="Save a deal and record its stages. Your numbers will appear here as things move."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Matches that led to a meeting"
              value={meetingRate !== null ? `${meetingRate}%` : '—'}
              detail={`${m.first_meeting.numerator} of ${qualified} qualified matches`}
            />
            <Stat
              label="Pilots running"
              value={String(m.activePocsCount)}
              detail={`${m.completedPocsCount} finished so far`}
            />
            <Stat
              label="Pilots that turned into paid work"
              value={paidRate !== null ? `${paidRate}%` : '—'}
              detail={
                m.pocToPaidConversion.denominator > 0
                  ? `${m.pocToPaidConversion.numerator} of ${m.pocToPaidConversion.denominator} finished pilots`
                  : 'No finished pilots yet'
              }
            />
          </div>

          <Panel className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-ink">How far deals get</h2>
              <p className="text-sm text-muted">Each step counts deals that reached it, out of {qualified} qualified.</p>
            </div>
            <ol className="space-y-3.5">
              <BarRow label="Qualified" count={qualified} of={qualified} />
              <BarRow label="Intro requested" count={m.introduction_requested.numerator} of={qualified} />
              <BarRow label="First meeting" count={m.first_meeting.numerator} of={qualified} />
              <BarRow label="Proposal or pilot" count={proposalOrPilot} of={qualified} />
              <BarRow label="Contract signed" count={m.signed_contract.numerator} of={qualified} />
              <BarRow label="Paid" count={m.paid.numerator} of={qualified} />
            </ol>
            <p className="text-xs text-muted">
              Proposals and pilots are progress, not revenue. Only signed and paid steps count as outcomes.
            </p>
          </Panel>

          <Panel className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-ink">Where your deals are</h2>
              <p className="text-sm text-muted">
                {signedCountries.size > 0
                  ? `Signed work in ${signedCountries.size} ${signedCountries.size === 1 ? 'country' : 'countries'}.`
                  : 'No signed work yet.'}
              </p>
            </div>
            <ul className="divide-y divide-line">
              {byCountry.map((row) => (
                <li key={row.country} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-semibold text-ink">{row.country}</span>
                  <span className="tabular text-muted">
                    {row.total} deal{row.total === 1 ? '' : 's'}
                    {row.activePocs ? `, ${row.activePocs} piloting` : ''}
                    {row.signedOrPaid ? `, ${row.signedOrPaid} signed` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}
    </section>
  );
}

export default OutcomeAnalyticsView;
