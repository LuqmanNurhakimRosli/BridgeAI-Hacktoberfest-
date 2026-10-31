'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Building2,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  X,
  Calendar,
  Coins,
  Layers,
} from 'lucide-react';
import type {
  DemandBrief,
  DemandKind,
  PrimaryGoal,
  ReverseMatch,
  StartupProfile,
  StartupStage,
} from '@/types';
import { scoreDemandMatch } from '@/lib/demand-matcher';
import { AiSourceBadge, ProvenanceBadge } from './ProvenanceBadge';

export interface DemandBoardProps {
  profile: StartupProfile;
  matches: ReverseMatch[];
  onSelectMatch: (match: ReverseMatch) => void;
  onOpenPocBuilder: (match: ReverseMatch) => void;
  onRefreshMatches?: () => void;
  isLoading?: boolean;
  onAddCustomDemand?: (demand: DemandBrief, scoredMatch: ReverseMatch) => void;
}

const COUNTRY_FILTERS = [
  'All Countries',
  'Indonesia',
  'Singapore',
  'Malaysia',
  'Thailand',
  'Vietnam',
] as const;

const DEMAND_KIND_FILTERS = [
  { label: 'All Types', value: 'all' },
  { label: 'Corporate Challenges (POC)', value: 'corporate_challenge' },
  { label: 'VC Investment Theses', value: 'vc_thesis' },
] as const;

const SECTOR_FILTERS = [
  'All Sectors',
  'AgriTech',
  'Fintech',
  'Smart City',
  'Sustainability',
  'Clean Energy',
  'AI',
] as const;

const POPULAR_SECTORS = [
  {
    name: 'Smart City',
    subtitle: 'Urban mobility, EV routing & municipal telemetry sandboxes',
    badge: 'Singapore • Malaysia',
  },
  {
    name: 'AgriTech',
    subtitle: 'Crop diagnostics, smallholder resilience & aquaculture warnings',
    badge: 'Indonesia • Vietnam',
  },
  {
    name: 'Fintech',
    subtitle: 'Alternative cooperative credit scoring & rural micro-finance',
    badge: 'Indonesia • Philippines',
  },
  {
    name: 'Sustainability',
    subtitle: 'Cold-chain spoilage reduction & circular supply chains',
    badge: 'Thailand • ASEAN',
  },
  {
    name: 'Clean Energy',
    subtitle: 'Industrial IoT sub-metering & Scope 2 decarbonisation',
    badge: 'Malaysia • Singapore',
  },
] as const;

const COUNTRY_FLAGS: Record<string, string> = {
  Indonesia: '🇮🇩',
  Singapore: '🇸🇬',
  Malaysia: '🇲🇾',
  Thailand: '🇹🇭',
  Vietnam: '🇻🇳',
  Philippines: '🇵🇭',
};

export function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🌏';
}

export function formatBudgetPill(demand: DemandBrief): string {
  const range = demand.budget_range;
  if (!range || (!range.min && !range.max)) {
    return demand.demand_kind === 'vc_thesis'
      ? 'Illustrative VC Ticket'
      : 'POC Opportunity';
  }
  const fmt = (val: number) => {
    if (val >= 1_000_000) {
      const m = val / 1_000_000;
      return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
    }
    if (val >= 1_000) {
      return `${Math.round(val / 1_000)}K`;
    }
    return `${val}`;
  };
  const prefix =
    demand.demand_kind === 'vc_thesis'
      ? 'Est. Ticket'
      : 'Est. POC Scope';
  if (range.min && range.max) {
    return `${prefix}: ${range.currency} ${fmt(range.min)}–${fmt(range.max)} (Illustrative)`;
  }
  if (range.max) {
    return `${prefix}: Up to ${range.currency} ${fmt(range.max)} (Illustrative)`;
  }
  return `${prefix}: From ${range.currency} ${fmt(range.min!)} (Illustrative)`;
}

function buildProfileCorpus(profile: StartupProfile): string {
  return [
    profile.startup_name,
    profile.description,
    profile.industry,
    profile.product,
    ...(profile.needs || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isRequirementCoveredByProfile(
  req: string,
  match: ReverseMatch,
  corpus: string
): boolean {
  const r = req.toLowerCase().trim();
  if (!r) return false;
  if (corpus.includes(r)) return true;
  if (
    match.reasons.some((reason) => reason.toLowerCase().includes(r)) &&
    !match.unknowns.some((u) => u.toLowerCase().includes(r))
  ) {
    return true;
  }
  const tokens = r.split(/[\s/-]+/).filter((t) => t.length > 3);
  if (tokens.length > 0 && tokens.every((t) => corpus.includes(t))) {
    return true;
  }
  return false;
}

export function DemandBoard({
  profile,
  matches,
  onSelectMatch,
  onOpenPocBuilder,
  onRefreshMatches,
  isLoading = false,
  onAddCustomDemand,
}: DemandBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('All Countries');
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('All Sectors');
  const [customMatches, setCustomMatches] = useState<ReverseMatch[]>([]);

  // P1 Demo Modal state for posting a new Corporate Challenge / VC Thesis
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newKind, setNewKind] = useState<DemandKind>('corporate_challenge');
  const [newBuyerName, setNewBuyerName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCountry, setNewCountry] = useState('Indonesia');
  const [newIndustry, setNewIndustry] = useState('AgriTech');
  const [newProblem, setNewProblem] = useState('');
  const [newMustHaves, setNewMustHaves] = useState('crop disease detection, mobile workflow');
  const [newNiceToHaves, setNewNiceToHaves] = useState('offline-first, multi-language UI');
  const [newMinBudget, setNewMinBudget] = useState('35000');
  const [newMaxBudget, setNewMaxBudget] = useState('65000');
  const [newDeadline, setNewDeadline] = useState('Rolling Pilot Cohort — Self-Reported Demo');

  const combinedMatches = useMemo(() => {
    const existingIds = new Set(matches.map((m) => m.demand_id));
    const uniqueCustom = customMatches.filter((m) => !existingIds.has(m.demand_id));
    return [...uniqueCustom, ...matches].sort(
      (a, b) => b.score - a.score || a.demand_id.localeCompare(b.demand_id)
    );
  }, [matches, customMatches]);

  const corpus = useMemo(() => buildProfileCorpus(profile), [profile]);

  const filteredMatches = useMemo(() => {
    return combinedMatches.filter((match) => {
      const { demand } = match;
      if (
        selectedCountry !== 'All Countries' &&
        demand.country.toLowerCase() !== selectedCountry.toLowerCase()
      ) {
        return false;
      }
      if (selectedKind !== 'all' && demand.demand_kind !== selectedKind) {
        return false;
      }
      if (
        selectedSector !== 'All Sectors' &&
        demand.industry.toLowerCase() !== selectedSector.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = [
          demand.title,
          demand.buyer_name,
          demand.problem,
          demand.country,
          demand.industry,
          ...demand.must_have,
          ...demand.nice_to_have,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [combinedMatches, selectedCountry, selectedKind, selectedSector, searchQuery]);

  const liveAiSource = useMemo(() => {
    return combinedMatches.some((m) => m.ai_source === 'gemma_live')
      ? 'gemma_live'
      : 'demo_fixture';
  }, [combinedMatches]);

  const handleCreateDemandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuyerName.trim() || !newTitle.trim() || !newProblem.trim()) return;

    const stages: StartupStage[] = ['Pre-seed', 'Seed', 'Series A'];
    const goals: PrimaryGoal[] =
      newKind === 'vc_thesis'
        ? ['Investment', 'Market Expansion']
        : ['Pilot Partnership', 'Market Expansion'];

    const createdBrief: DemandBrief = {
      id: `SELF-CH-${Date.now().toString().slice(-4)}`,
      demand_kind: newKind,
      buyer_name: newBuyerName.trim(),
      title: newTitle.trim(),
      country: newCountry,
      industry: newIndustry,
      problem: newProblem.trim(),
      must_have: newMustHaves
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      nice_to_have: newNiceToHaves
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      stages,
      goals,
      budget_range: {
        min: Number(newMinBudget) || 25000,
        max: Number(newMaxBudget) || 60000,
        currency: 'USD',
      },
      deadline_label: newDeadline.trim() || 'Open Sandbox — Self-Reported',
      data_status: 'self_reported',
      source_url: null,
      last_verified_at: null,
      eligibility_notes: [
        'Self-reported demand brief created in this browser session — not third-party verified.',
      ],
    };

    const scored = scoreDemandMatch(profile, createdBrief);
    setCustomMatches((prev) => [scored, ...prev]);
    if (onAddCustomDemand) {
      onAddCustomDemand(createdBrief, scored);
    }
    setIsPostModalOpen(false);
    setNewBuyerName('');
    setNewTitle('');
    setNewProblem('');
  };

  return (
    <section
      aria-label="Challenges and Reverse-Match Demand Board"
      className="mx-auto max-w-6xl space-y-6 pb-16"
    >
      {/* Top Header & P1 Demand Submission Trigger */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Reverse Demand-Driven Matching Engine
            </span>
            <AiSourceBadge source={liveAiSource} />
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            ASEAN Corporate Challenges &amp; VC Theses
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real problem statements and investment theses scored against your confirmed Startup Passport.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onRefreshMatches && (
            <button
              type="button"
              onClick={onRefreshMatches}
              disabled={isLoading}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isLoading ? 'Scoring...' : 'Re-run AI Fit'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPostModalOpen(true)}
            data-testid="open-post-demand-modal-btn"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2.5 text-xs font-semibold text-indigo-900 shadow-2xs transition hover:bg-indigo-100"
          >
            <Plus className="h-4 w-4 text-indigo-700" />
            <span>+ Post Corporate Challenge / VC Thesis (P1 Demo Modal)</span>
          </button>
        </div>
      </div>

      {/* Top AI Banner (Verbatim per Task 5 Brief) */}
      <div
        data-testid="demand-board-ai-banner"
        className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-5 text-white shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Deterministic Rubric (30/30/15/15/10) + Grounded AI Explanation
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-100 sm:text-base">
                {`Based on your confirmed Startup Passport (${profile.startup_name || 'Your Startup'}), BridgeAI evaluated ${combinedMatches.length} ASEAN corporate challenges and investor theses using deterministic hard-eligibility gates + Gemma 4 grounded fit analysis.`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-200 border border-white/15">
              Target: {profile.target_country || 'ASEAN'} • {profile.stage || 'Seed'}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:p-5">
        {/* Search Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search challenges, keywords, must-haves, or organisations..."
            aria-label="Search challenges, keywords, must-haves, or organisations"
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Country Filter Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Market / Country</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_FILTERS.map((country) => {
              const active = selectedCountry === country;
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => setSelectedCountry(country)}
                  className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {country !== 'All Countries' && (
                    <span className="mr-1.5">{getCountryFlag(country)}</span>
                  )}
                  {country}
                </button>
              );
            })}
          </div>
        </div>

        {/* Demand Kind & Sector Filter Row */}
        <div className="grid grid-cols-1 gap-4 pt-1 lg:grid-cols-2">
          {/* Demand Kind Filter Pills */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Opportunity Type
            </span>
            <div className="flex flex-wrap gap-2">
              {DEMAND_KIND_FILTERS.map((kind) => {
                const active = selectedKind === kind.value;
                return (
                  <button
                    key={kind.label}
                    type="button"
                    onClick={() => setSelectedKind(kind.value)}
                    className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {kind.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sector Filter Pills */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Industry Sector
            </span>
            <div className="flex flex-wrap gap-2">
              {SECTOR_FILTERS.map((sector) => {
                const active = selectedSector === sector;
                return (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => setSelectedSector(sector)}
                    className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {sector}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Results Count & Provenance Transparency Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-600">
        <span>
          Showing <strong className="font-semibold text-slate-900">{filteredMatches.length}</strong>{' '}
          ranked opportunities (sorted by deterministic compatibility score)
        </span>
        <span className="text-slate-500">
          Rule #7: Unverified blue checkmarks are replaced with explicit provenance badges.
        </span>
      </div>

      {/* Challenge / Reverse-Match Cards List */}
      {filteredMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-base font-semibold text-slate-800">
            No challenges or investor theses match the current filter combination.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing your search query or switching back to All Countries and All Sectors.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCountry('All Countries');
              setSelectedKind('all');
              setSelectedSector('All Sectors');
            }}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match, idx) => {
            const { demand } = match;
            const rankNumber = idx + 1;
            const budgetLabel = formatBudgetPill(demand);
            const isPassed = match.hard_eligibility === 'passed';
            const isIneligible = match.hard_eligibility === 'ineligible';

            const defaultVerificationText =
              match.unknowns.length > 0
                ? match.unknowns.join(' • ')
                : 'Confirm offline-first capability & field data consent';

            return (
              <article
                key={match.demand_id}
                data-testid={`demand-card-${match.demand_id}`}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-emerald-300 hover:shadow-md sm:p-6"
              >
                {/* Top Row: Rank Badge, Buyer Org Name, Country Flag, ProvenanceBadge, Budget & Timeline */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-7 items-center justify-center rounded-lg bg-slate-900 px-2.5 text-xs font-bold text-white">
                        #{rankNumber}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        {demand.buyer_name}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        <span>{getCountryFlag(demand.country)}</span>
                        <span>{demand.country}</span>
                      </span>
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 border border-indigo-200/70">
                        {demand.industry}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                        {demand.demand_kind === 'vc_thesis'
                          ? 'VC Investment Thesis'
                          : 'Corporate Challenge (POC)'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <ProvenanceBadge
                        status={demand.data_status}
                        sourceUrl={demand.source_url}
                        lastVerifiedAt={demand.last_verified_at}
                      />
                    </div>
                  </div>

                  {/* Budget / Ticket pill + Timeline label */}
                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-xs font-semibold text-emerald-900">
                      <Coins className="h-3.5 w-3.5 text-emerald-700" />
                      {budgetLabel}
                    </span>
                    {demand.deadline_label && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {demand.deadline_label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Challenge Title & Problem Statement */}
                <div className="mt-4">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    {demand.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {demand.problem}
                  </p>
                </div>

                {/* Must-Have Requirements vs Confirmed Profile Pills */}
                <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Must-Have Requirements vs Confirmed Profile
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      Accepted Stages: {demand.stages.join(', ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {demand.must_have.map((req) => {
                      const covered = isRequirementCoveredByProfile(req, match, corpus);
                      return (
                        <span
                          key={`must-${req}`}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                            covered
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : 'border-amber-300 bg-amber-50 text-amber-900'
                          }`}
                        >
                          {covered ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          )}
                          <span>Must-have: {req}</span>
                        </span>
                      );
                    })}

                    {(demand.nice_to_have || []).map((opt) => {
                      const covered = isRequirementCoveredByProfile(opt, match, corpus);
                      return (
                        <span
                          key={`nice-${opt}`}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                            covered
                              ? 'border-sky-300 bg-sky-50 text-sky-900'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span>Nice-to-have: {opt}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Hard Eligibility & Unknowns Alert Strip */}
                <div
                  className={`mt-3.5 flex flex-col gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between ${
                    isPassed
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                      : isIneligible
                      ? 'border-rose-200 bg-rose-50/80 text-rose-900'
                      : 'border-amber-200 bg-amber-50/80 text-amber-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isPassed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    ) : isIneligible ? (
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    )}
                    <div>
                      <span className="font-bold">
                        {isPassed
                          ? 'Hard Gate: Passed'
                          : isIneligible
                          ? 'Hard Gate: Stage / Mandatory Gate Mismatch'
                          : 'Needs Verification: Confirm offline-first capability & field data consent'}
                      </span>
                      {match.unknowns.length > 0 && (
                        <p className="mt-0.5 text-[11px] opacity-90">
                          Unknowns to verify: {defaultVerificationText}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Compatibility Pill */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      title="Rule-based fit, not funding probability"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-sm font-bold text-emerald-950 shadow-2xs"
                    >
                      <span>{`🎯 ${match.score}/100 Compatibility`}</span>
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Rule-based fit, not funding probability
                    </span>
                  </div>

                  {/* Action CTAs */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onSelectMatch(match)}
                      data-testid={`view-match-intelligence-${match.demand_id}`}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      <span>View Match Intelligence →</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenPocBuilder(match)}
                      data-testid={`create-poc-plan-${match.demand_id}`}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
                    >
                      <span>✨ Create 75-Day POC Plan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Bottom Popular Sectors Strip */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>Popular Sectors</span>
            </h2>
            <p className="text-xs text-slate-500">
              Filter bilateral ASEAN corporate pilot challenges and venture theses by priority industry vertical.
            </p>
          </div>
          {selectedSector !== 'All Sectors' && (
            <button
              type="button"
              onClick={() => setSelectedSector('All Sectors')}
              className="self-start text-xs font-semibold text-emerald-700 underline hover:text-emerald-800 sm:self-center"
            >
              Show All Sectors
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {POPULAR_SECTORS.map((sec) => {
            const isSelected = selectedSector === sec.name;
            return (
              <button
                key={sec.name}
                type="button"
                onClick={() =>
                  setSelectedSector(isSelected ? 'All Sectors' : sec.name)
                }
                className={`flex min-h-[96px] flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-slate-50/60 hover:border-emerald-300 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {sec.name}
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                      {sec.badge}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-snug text-slate-600">
                    {sec.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* P1 Demo Modal: Post Corporate Challenge / VC Thesis */}
      {isPostModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-demand-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                  P1 Demand Owner Submission Flow
                </span>
                <h2
                  id="post-demand-modal-title"
                  className="mt-1 text-lg font-bold text-slate-900"
                >
                  Post Corporate Challenge / VC Thesis
                </h2>
                <p className="text-xs text-slate-500">
                  Submit a structured demand brief to immediately score against the active Startup Passport. Tagged as{' '}
                  <code className="rounded bg-slate-100 px-1 py-0.5">self_reported</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDemandSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Demand Type
                  </label>
                  <select
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value as DemandKind)}
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="corporate_challenge">Corporate Challenge (POC)</option>
                    <option value="vc_thesis">VC Investment Thesis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Target Country
                  </label>
                  <select
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="Indonesia">Indonesia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Vietnam">Vietnam</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Buyer / Partner Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newBuyerName}
                    onChange={(e) => setNewBuyerName(e.target.value)}
                    placeholder="e.g., Java Agro Cooperative Lab"
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Primary Sector
                  </label>
                  <select
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="AgriTech">AgriTech</option>
                    <option value="Fintech">Fintech</option>
                    <option value="Smart City">Smart City</option>
                    <option value="Sustainability">Sustainability</option>
                    <option value="Clean Energy">Clean Energy</option>
                    <option value="AI">AI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Challenge / Thesis Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Cooperative leaf-blight smartphone screening pilot"
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Problem Statement &amp; Operational Context
                </label>
                <textarea
                  rows={3}
                  required
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  placeholder="Describe the concrete problem, pilot scale, and expected outcomes..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Must-Have Capabilities (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newMustHaves}
                    onChange={(e) => setNewMustHaves(e.target.value)}
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Nice-to-Have Capabilities (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newNiceToHaves}
                    onChange={(e) => setNewNiceToHaves(e.target.value)}
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Min Budget (USD)
                  </label>
                  <input
                    type="number"
                    value={newMinBudget}
                    onChange={(e) => setNewMinBudget(e.target.value)}
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Max Budget (USD)
                  </label>
                  <input
                    type="number"
                    value={newMaxBudget}
                    onChange={(e) => setNewMaxBudget(e.target.value)}
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Cohort Window Label
                  </label>
                  <input
                    type="text"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="min-h-[42px] rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                >
                  Publish &amp; Score Demand Brief
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default DemandBoard;
