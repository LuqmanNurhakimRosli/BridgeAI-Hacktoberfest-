'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Clock,
  Globe2,
  Activity,
  Handshake,
  FileCheck2,
  Filter,
  ShieldAlert,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import type { Deal, SourceStatus } from '@/types';
import { computeFunnelMetrics, percent, reached } from '@/lib/kpi-metrics';
import { ProvenanceBadge } from './ProvenanceBadge';
import { getCountryFlag } from './DemandBoard';

export interface OutcomeAnalyticsViewProps {
  localDeals: Deal[];
  demoDeals: Deal[];
  defaultCohort?: 'local' | 'demo' | 'combined';
}

type CohortMode = 'local' | 'demo' | 'combined';

const COUNTRY_OPTIONS = [
  'All Countries',
  'Indonesia',
  'Singapore',
  'Malaysia',
  'Thailand',
  'Vietnam',
] as const;

const SECTOR_OPTIONS = [
  'All Sectors',
  'AgriTech',
  'Fintech',
  'Smart City',
  'Sustainability',
  'Clean Energy',
  'AI',
] as const;

const SECTOR_COLORS: Record<string, string> = {
  AgriTech: '#10B981',
  Fintech: '#8B5CF6',
  'Smart City': '#0F2D5B',
  Sustainability: '#0EA5E9',
  'Clean Energy': '#F59E0B',
  AI: '#EC4899',
};

export function OutcomeAnalyticsView({
  localDeals,
  demoDeals,
  defaultCohort,
}: OutcomeAnalyticsViewProps) {
  const initialCohort: CohortMode =
    defaultCohort || (localDeals.length > 0 && demoDeals.length === 0 ? 'local' : 'demo');

  const [cohort, setCohort] = useState<CohortMode>(initialCohort);
  const [selectedCountry, setSelectedCountry] = useState<string>('All Countries');
  const [selectedSector, setSelectedSector] = useState<string>('All Sectors');

  const rawCohortDeals = useMemo(() => {
    if (cohort === 'local') return localDeals;
    if (cohort === 'demo') return demoDeals;
    return [...localDeals, ...demoDeals];
  }, [cohort, localDeals, demoDeals]);

  const filteredDeals = useMemo(() => {
    return rawCohortDeals.filter((d) => {
      if (
        selectedCountry !== 'All Countries' &&
        d.country.toLowerCase() !== selectedCountry.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedSector !== 'All Sectors' &&
        d.sector.toLowerCase() !== selectedSector.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [rawCohortDeals, selectedCountry, selectedSector]);

  const metrics = useMemo(
    () => computeFunnelMetrics(filteredDeals),
    [filteredDeals]
  );

  const localOnlyMetrics = useMemo(
    () => computeFunnelMetrics(localDeals),
    [localDeals]
  );
  const demoOnlyMetrics = useMemo(
    () => computeFunnelMetrics(demoDeals),
    [demoDeals]
  );

  // KPI 1: POC -> Paid Conversion Rate
  const pocPaidNum = metrics.pocToPaidConversion.numerator;
  const pocPaidDen = metrics.pocToPaidConversion.denominator;
  const pocPaidRate = metrics.pocToPaidConversion.rate_percent;
  const pocPaidHeadline = pocPaidRate !== null ? `${pocPaidRate}%` : '—';
  const pocPaidSubtitle = `${pocPaidNum} paid / ${pocPaidDen} completed POCs`;

  // KPI 2: Median Time to Close
  const medianCloseHeadline =
    metrics.medianDaysToClose !== null
      ? `${metrics.medianDaysToClose} days`
      : '— (In progress — no closed deals yet)';

  // KPI 3: Markets Entered (unique destination countries with signed/paid or operational POC outcomes)
  const signedOrPaidCountriesCount = useMemo(() => {
    const set = new Set<string>();
    for (const d of filteredDeals) {
      if (
        d.state === 'contract_signed' ||
        d.state === 'paid' ||
        reached(d.events || [], 'contract_signed') ||
        reached(d.events || [], 'paid')
      ) {
        set.add(d.country.toLowerCase());
      }
    }
    return set.size;
  }, [filteredDeals]);

  // KPI 4: Active POCs & Proposals
  const activePocsAndProposalsCount = useMemo(() => {
    return filteredDeals.filter((d) =>
      ['proposal_shared', 'agreement_signed', 'poc_running'].includes(d.state)
    ).length;
  }, [filteredDeals]);

  // KPI 5: Qualified -> Meeting Rate
  const firstMeetingCount = metrics.first_meeting.numerator;
  const qualifiedCount = metrics.qualified.numerator;
  const qualifiedToMeetingRate = percent(firstMeetingCount, qualifiedCount);
  const qualifiedToMeetingHeadline =
    qualifiedToMeetingRate !== null ? `${qualifiedToMeetingRate}%` : '—';

  // KPI 6: Confirmed Contracts
  const signedOrPaidCount = metrics.signed_contract.numerator;
  const totalDealsCount = metrics.totalDeals;

  const activeProvenanceStatus: SourceStatus =
    cohort === 'local' ? 'self_reported' : 'synthetic_demo';

  // Stage-by-Stage Conversion Funnel rows
  const funnelRows = useMemo(() => {
    const proposalOrPocDealsCount = filteredDeals.filter(
      (d) =>
        [
          'proposal_shared',
          'agreement_signed',
          'poc_running',
          'poc_completed',
          'contract_signed',
          'paid',
        ].includes(d.state) ||
        (d.events || []).some((e) =>
          [
            'proposal_shared',
            'agreement_signed',
            'poc_running',
            'poc_completed',
            'contract_signed',
            'paid',
          ].includes(e.to_state)
        )
    ).length;

    return [
      {
        stage: 'Qualified Matches',
        count: metrics.qualified.numerator,
        denominator: metrics.totalDeals,
        pctOfQualified:
          metrics.qualified.numerator > 0 ? '100%' : '—',
        barPercent: metrics.qualified.numerator > 0 ? 100 : 0,
      },
      {
        stage: 'Introductions Requested',
        count: metrics.introduction_requested.numerator,
        denominator: qualifiedCount,
        pctOfQualified:
          metrics.introduction_requested.rate_percent !== null
            ? `${metrics.introduction_requested.rate_percent}%`
            : '—',
        barPercent: metrics.introduction_requested.rate_percent ?? 0,
      },
      {
        stage: 'First Meetings',
        count: metrics.first_meeting.numerator,
        denominator: qualifiedCount,
        pctOfQualified:
          metrics.first_meeting.rate_percent !== null
            ? `${metrics.first_meeting.rate_percent}%`
            : '—',
        barPercent: metrics.first_meeting.rate_percent ?? 0,
      },
      {
        stage: 'POC Agreements / Proposals',
        count: proposalOrPocDealsCount,
        denominator: qualifiedCount,
        pctOfQualified:
          percent(proposalOrPocDealsCount, qualifiedCount) !== null
            ? `${percent(proposalOrPocDealsCount, qualifiedCount)}%`
            : '—',
        barPercent: percent(proposalOrPocDealsCount, qualifiedCount) ?? 0,
      },
      {
        stage: 'Signed Contracts',
        count: metrics.signed_contract.numerator,
        denominator: qualifiedCount,
        pctOfQualified:
          metrics.signed_contract.rate_percent !== null
            ? `${metrics.signed_contract.rate_percent}%`
            : '—',
        barPercent: metrics.signed_contract.rate_percent ?? 0,
      },
      {
        stage: 'Paid Outcomes',
        count: metrics.paid.numerator,
        denominator: qualifiedCount,
        pctOfQualified:
          metrics.paid.rate_percent !== null
            ? `${metrics.paid.rate_percent}%`
            : '—',
        barPercent: metrics.paid.rate_percent ?? 0,
      },
    ];
  }, [filteredDeals, metrics, qualifiedCount]);

  // Outcomes Over Time monthly buckets (Jun -> Oct 2026)
  const monthlySeries = useMemo(() => {
    const months = [
      { key: '2026-06', label: 'Jun 2026', pocsStarted: 0, contractsSigned: 0 },
      { key: '2026-07', label: 'Jul 2026', pocsStarted: 0, contractsSigned: 0 },
      { key: '2026-08', label: 'Aug 2026', pocsStarted: 0, contractsSigned: 0 },
      { key: '2026-09', label: 'Sep 2026', pocsStarted: 0, contractsSigned: 0 },
      { key: '2026-10', label: 'Oct 2026', pocsStarted: 0, contractsSigned: 0 },
    ];
    for (const deal of filteredDeals) {
      for (const evt of deal.events || []) {
        const monthKey = (evt.happened_at || '').slice(0, 7);
        const bucket = months.find((m) => m.key === monthKey);
        if (bucket) {
          if (
            evt.to_state === 'poc_running' ||
            evt.to_state === 'agreement_signed'
          ) {
            bucket.pocsStarted += 1;
          }
          if (evt.to_state === 'contract_signed' || evt.to_state === 'paid') {
            bucket.contractsSigned += 1;
          }
        }
      }
    }
    return months;
  }, [filteredDeals]);

  // Sector breakdown ensuring the 5 core sectors are represented in legend
  const sectorLegendItems = useMemo(() => {
    const coreSectors = [
      'AgriTech',
      'Fintech',
      'Smart City',
      'Sustainability',
      'Clean Energy',
    ];
    const countsMap = new Map<string, number>();
    for (const s of coreSectors) countsMap.set(s, 0);
    for (const d of filteredDeals) {
      countsMap.set(d.sector, (countsMap.get(d.sector) || 0) + 1);
    }
    return Array.from(countsMap.entries()).map(([sector, count]) => ({
      sector,
      count,
      color: SECTOR_COLORS[sector] || '#64748B',
    }));
  }, [filteredDeals]);

  return (
    <section
      aria-label="Outcome Analytics Dashboard"
      className="mx-auto max-w-6xl space-y-6 pb-20"
    >
      {/* Top Data Cohort Switcher (V2 Mandatory Rule #12 & Section 25.3) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-900">
              <BarChart3 className="h-3.5 w-3.5 text-[#10B981]" />
              <span>Section 25.3 Honest Funnel &amp; Denominator Discipline</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[#0F2D5B] sm:text-2xl">
              ASEAN Commercialization &amp; Pilot Outcome Analytics
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-600">
              Every conversion percentage displays its exact numerator and denominator. Zero-denominator metrics render <code>—</code> (never fake <code>0%</code>).
            </p>
          </div>

          <ProvenanceBadge status={activeProvenanceStatus} size="md" />
        </div>

        {/* Prominent Segmented Control */}
        <div
          role="group"
          aria-label="Data Cohort Switcher"
          className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1.5 border border-slate-200"
        >
          <button
            type="button"
            onClick={() => setCohort('local')}
            data-testid="cohort-switch-local"
            className={`min-h-[44px] rounded-lg px-3.5 py-2 text-xs font-extrabold transition cursor-pointer ${
              cohort === 'local'
                ? 'bg-[#10B981] text-slate-950 shadow-xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            {`🌱 My Local Recorded Deals (${localDeals.length}) — Actual Browser Events`}
          </button>

          <button
            type="button"
            onClick={() => setCohort('demo')}
            data-testid="cohort-switch-demo"
            className={`min-h-[44px] rounded-lg px-3.5 py-2 text-xs font-extrabold transition cursor-pointer ${
              cohort === 'demo'
                ? 'bg-[#0F2D5B] text-white shadow-xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            {`📊 Synthetic Demo Cohort (${demoDeals.length}) — Illustrative Funnel`}
          </button>

          <button
            type="button"
            onClick={() => setCohort('combined')}
            data-testid="cohort-switch-combined"
            className={`min-h-[44px] rounded-lg px-3.5 py-2 text-xs font-extrabold transition cursor-pointer ${
              cohort === 'combined'
                ? 'bg-[#8B5CF6] text-white shadow-xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            🔀 Combined View (Local + Demo Labelled)
          </button>
        </div>

        {/* Filter Dropdowns: All Countries & All Sectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <label
                htmlFor="analytics-country-filter"
                className="text-xs font-bold text-slate-700"
              >
                Country:
              </label>
              <select
                id="analytics-country-filter"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="analytics-sector-filter"
                className="text-xs font-bold text-slate-700"
              >
                Sector:
              </label>
              <select
                id="analytics-sector-filter"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
              >
                {SECTOR_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Local Status:{' '}
            <strong className="text-slate-800">
              {localOnlyMetrics.pocToPaidConversion.rate_percent !== null
                ? `${localOnlyMetrics.pocToPaidConversion.rate_percent}%`
                : '—'}{' '}
              ({localOnlyMetrics.pocToPaidConversion.numerator} paid /{' '}
              {localOnlyMetrics.pocToPaidConversion.denominator} completed POCs)
            </strong>{' '}
            ·{' '}
            <span>
              {localOnlyMetrics.medianDaysToClose !== null
                ? `${localOnlyMetrics.medianDaysToClose} days`
                : '— (In progress — no closed deals yet)'}
            </span>
          </div>
        </div>
      </div>

      {/* 6 Honest KPI Cards with Explicit numerator / denominator */}
      <div
        aria-label="Honest Outcome KPI Cards"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* 1. POC -> Paid Conversion Rate */}
        <div
          data-testid="kpi-card-poc-to-paid"
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              POC → Paid Conversion Rate
            </span>
            <TrendingUp className="h-4 w-4 text-[#10B981]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F2D5B]">
              {pocPaidHeadline}
            </div>
            <p className="mt-1 text-xs font-bold text-emerald-800">
              {pocPaidSubtitle}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Strictly over completed POCs (never open proposals). Demo Cohort:{' '}
            {demoOnlyMetrics.pocToPaidConversion.rate_percent ?? '—'}% (
            {demoOnlyMetrics.pocToPaidConversion.numerator} paid /{' '}
            {demoOnlyMetrics.pocToPaidConversion.denominator} completed POCs)
          </p>
        </div>

        {/* 2. Median Time to Close */}
        <div
          data-testid="kpi-card-median-close"
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Median Time to Close
            </span>
            <Clock className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {medianCloseHeadline}
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              {metrics.closedDealsCount} closed / {metrics.totalDeals} tracked deals
            </p>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Calculated over signed/paid outcomes only — never mixes open deals.
          </p>
        </div>

        {/* 3. Markets Entered */}
        <div
          data-testid="kpi-card-markets-entered"
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Markets Entered
            </span>
            <Globe2 className="h-4 w-4 text-sky-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F2D5B]">
              {`${signedOrPaidCountriesCount} ASEAN markets`}
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              {metrics.marketsEnteredCount} operational POC / signed corridor(s)
            </p>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Unique destination countries with signed/paid commercial outcomes.
          </p>
        </div>

        {/* 4. Active POCs & Proposals */}
        <div
          data-testid="kpi-card-active-pocs"
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Active POCs &amp; Proposals
            </span>
            <Activity className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {activePocsAndProposalsCount}
            </div>
            <p className="mt-1 text-xs font-bold text-amber-800">
              Proposals are activity, not closed revenue
            </p>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Includes deals in <code>proposal_shared</code>, <code>agreement_signed</code>, and <code>poc_running</code>.
          </p>
        </div>

        {/* 5. Qualified -> Meeting Rate */}
        <div
          data-testid="kpi-card-qualified-to-meeting"
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Qualified → Meeting Rate
            </span>
            <Handshake className="h-4 w-4 text-[#8B5CF6]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F2D5B]">
              {qualifiedToMeetingHeadline}
            </div>
            <p className="mt-1 text-xs font-bold text-violet-800">
              {`${firstMeetingCount} / ${qualifiedCount} qualified deals`}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Share of qualified matches that progressed to a confirmed first meeting.
          </p>
        </div>

        {/* 6. Confirmed Contracts */}
        <div
          data-testid="kpi-card-confirmed-contracts"
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Confirmed Contracts
            </span>
            <FileCheck2 className="h-4 w-4 text-[#10B981]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#10B981]">
              {`${signedOrPaidCount} / ${totalDealsCount} tracked deals`}
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              {metrics.paid.numerator} Paid ·{' '}
              {Math.max(0, signedOrPaidCount - metrics.paid.numerator)} Signed awaiting invoice
            </p>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Requires explicit <code>contract_signed</code> or <code>paid</code> event.
          </p>
        </div>
      </div>

      {/* Stage-by-Stage Conversion Funnel Table & Bars */}
      <div
        aria-label="Stage-by-Stage Conversion Funnel"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0F2D5B]">
              Stage-by-Stage Conversion Funnel Table &amp; Bars
            </h3>
            <p className="text-xs text-slate-600">
              Cumulative progression from Qualified Matches to Paid Outcomes with explicit denominators and provenance.
            </p>
          </div>
          <ProvenanceBadge status={activeProvenanceStatus} size="sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-4">Funnel Stage</th>
                <th className="py-2.5 px-3">Exact Count</th>
                <th className="py-2.5 px-3">% of Qualified</th>
                <th className="py-2.5 px-3 w-48">Conversion Bar</th>
                <th className="py-2.5 pl-3 text-right">Cohort Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {funnelRows.map((row) => (
                <tr key={row.stage}>
                  <td className="py-3 pr-4 font-bold text-slate-900">
                    {row.stage}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {row.count} / {row.denominator}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-[#0F2D5B]">
                    {row.pctOfQualified}
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0F2D5B] to-[#10B981]"
                        style={{
                          width: `${Math.min(100, Math.max(0, row.barPercent))}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <ProvenanceBadge status={activeProvenanceStatus} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Charts Row: Outcomes Over Time + Deals by Sector SVG Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Outcomes Over Time (POCs Started vs Contracts Signed) (7 cols) */}
        <div
          aria-label="Outcomes Over Time Chart"
          className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-[#0F2D5B]">
                Outcomes Over Time (POCs Started vs Contracts Signed)
              </h3>
              <p className="text-xs text-slate-500">
                Cohort source:{' '}
                {cohort === 'local'
                  ? 'My Local Recorded Deals (Self-Reported)'
                  : cohort === 'demo'
                  ? 'Synthetic Demo Cohort (Illustrative)'
                  : 'Combined Local + Synthetic Demo'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-[#0F2D5B]">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#0F2D5B]" />
                POCs Started
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" />
                Contracts Signed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 pt-4 items-end h-44 border-b border-slate-200 pb-2 px-2">
            {monthlySeries.map((m) => {
              const pocHeight = Math.min(100, Math.max(12, m.pocsStarted * 35));
              const signedHeight = Math.min(
                100,
                Math.max(12, m.contractsSigned * 35)
              );
              return (
                <div
                  key={m.key}
                  className="flex flex-col items-center justify-end h-full gap-2"
                >
                  <div className="flex items-end justify-center gap-1.5 w-full h-32">
                    <div
                      title={`${m.label}: ${m.pocsStarted} POCs Started`}
                      className="w-5 rounded-t-md bg-[#0F2D5B] transition-all flex items-start justify-center text-[10px] font-bold text-white pt-0.5"
                      style={{
                        height: m.pocsStarted > 0 ? `${pocHeight}%` : '10%',
                        opacity: m.pocsStarted > 0 ? 1 : 0.25,
                      }}
                    >
                      {m.pocsStarted}
                    </div>
                    <div
                      title={`${m.label}: ${m.contractsSigned} Contracts Signed`}
                      className="w-5 rounded-t-md bg-[#10B981] transition-all flex items-start justify-center text-[10px] font-bold text-slate-950 pt-0.5"
                      style={{
                        height:
                          m.contractsSigned > 0 ? `${signedHeight}%` : '10%',
                        opacity: m.contractsSigned > 0 ? 1 : 0.25,
                      }}
                    >
                      {m.contractsSigned}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deals by Sector SVG Donut Chart + Legend (5 cols) */}
        <div
          aria-label="Deals by Sector Chart"
          className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-extrabold text-[#0F2D5B]">
                <PieChart className="h-4 w-4 text-[#8B5CF6]" />
                <span>Deals by Sector</span>
              </h3>
              <p className="text-xs text-slate-500">
                Distribution across core ASEAN innovation verticals
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* SVG Donut Chart */}
            <div className="relative h-36 w-36 shrink-0 flex items-center justify-center">
              <svg
                viewBox="0 0 120 120"
                className="h-36 w-36 -rotate-90"
                role="img"
                aria-label="Deals by Sector Donut Chart"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="transparent"
                  stroke="#E2E8F0"
                  strokeWidth="16"
                />
                {(() => {
                  const total = Math.max(
                    1,
                    sectorLegendItems.reduce((acc, s) => acc + s.count, 0)
                  );
                  const circumference = 2 * Math.PI * 44;
                  let accumulatedRatio = 0;
                  return sectorLegendItems.map((item) => {
                    const ratio = item.count / total;
                    const dash = ratio * circumference;
                    const offset = -accumulatedRatio * circumference;
                    accumulatedRatio += ratio;
                    if (item.count === 0) return null;
                    return (
                      <circle
                        key={item.sector}
                        cx="60"
                        cy="60"
                        r="44"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="16"
                        strokeDasharray={`${dash} ${circumference}`}
                        strokeDashoffset={offset}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-[#0F2D5B]">
                  {filteredDeals.length}
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  Total Deals
                </span>
              </div>
            </div>

            {/* Sector Legend */}
            <ul className="flex-1 w-full space-y-2 text-xs">
              {sectorLegendItems.map((item) => (
                <li
                  key={item.sector}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-100"
                >
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.sector}</span>
                  </span>
                  <span className="font-bold text-[#0F2D5B]">
                    {item.count} deal{item.count === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Top ASEAN Countries by Outcomes Breakdown Table */}
      <div
        aria-label="Top ASEAN Countries by Outcomes"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0F2D5B]">
              Top ASEAN Countries by Outcomes
            </h3>
            <p className="text-xs text-slate-600">
              Destination market breakdown showing Qualified deals, Active POCs, and Signed/Paid outcomes.
            </p>
          </div>
          <ProvenanceBadge status={activeProvenanceStatus} size="sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-4">ASEAN Market</th>
                <th className="py-2.5 px-3">Qualified</th>
                <th className="py-2.5 px-3">Active POCs</th>
                <th className="py-2.5 px-3">Signed/Paid</th>
                <th className="py-2.5 pl-3 text-right">Data Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(metrics.byCountry.length > 0
                ? metrics.byCountry
                : [
                    {
                      country: 'Indonesia',
                      total: 0,
                      activePocs: 0,
                      signedOrPaid: 0,
                    },
                  ]
              ).map((row) => (
                <tr key={row.country}>
                  <td className="py-3 pr-4 font-bold text-slate-900">
                    <span className="mr-1.5">{getCountryFlag(row.country)}</span>
                    <span>{row.country}</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {row.total}
                  </td>
                  <td className="py-3 px-3 font-semibold text-teal-800">
                    {row.activePocs}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-[#10B981]">
                    {row.signedOrPaid}
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <ProvenanceBadge status={activeProvenanceStatus} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
          <span>
            <strong>Rule #12 Cohort Separation Notice:</strong> Synthetic demo cohort records illustrate multi-stage funnel mechanics across 6 ASEAN countries and are never silently mixed into your local self-reported browser conversion rate.
          </span>
        </div>
      </div>
    </section>
  );
}

export default OutcomeAnalyticsView;
