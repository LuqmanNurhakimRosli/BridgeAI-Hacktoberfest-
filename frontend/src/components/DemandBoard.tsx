'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, CircleAlert, Plus, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
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
import {
  Button,
  Chip,
  EmptyState,
  Field,
  FilterChip,
  FitMeter,
  Sheet,
  countryCode,
  formatMoneyRange,
  inputClass,
} from './ui';

export interface DemandBoardProps {
  profile: StartupProfile;
  matches: ReverseMatch[];
  onSelectMatch: (match: ReverseMatch) => void;
  onOpenPocBuilder: (match: ReverseMatch) => void;
  onRefreshMatches?: () => void;
  isLoading?: boolean;
  onAddCustomDemand?: (demand: DemandBrief, scoredMatch: ReverseMatch) => void;
}

const COUNTRIES = ['Indonesia', 'Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Philippines'] as const;
const SECTORS = ['AgriTech', 'Fintech', 'Smart City', 'Sustainability', 'Clean Energy', 'AI'] as const;
const KINDS: Array<{ id: DemandKind; label: string }> = [
  { id: 'corporate_challenge', label: 'Corporate pilots' },
  { id: 'vc_thesis', label: 'Investor theses' },
];

export const DEMAND_KIND_LABEL: Record<DemandKind, string> = {
  corporate_challenge: 'Corporate pilot',
  vc_thesis: 'Investor thesis',
};

/** Budget text stored on pilot plans. Always flagged as illustrative. */
export function formatBudgetPill(demand: DemandBrief): string {
  const range = formatMoneyRange(demand.budget_range);
  const noun = demand.demand_kind === 'vc_thesis' ? 'Typical ticket' : 'Estimated pilot budget';
  return range ? `${noun}: ${range} (illustrative)` : `${noun}: not stated`;
}

function buildProfileCorpus(profile: StartupProfile): string {
  return [profile.startup_name, profile.description, profile.industry, profile.product, ...(profile.needs || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function isRequirementCoveredByProfile(req: string, match: ReverseMatch, corpus: string): boolean {
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
  return tokens.length > 0 && tokens.every((t) => corpus.includes(t));
}

export function eligibilityCopy(match: ReverseMatch): { label: string; tone: 'jade' | 'amber' | 'risk' } {
  if (match.hard_eligibility === 'passed') return { label: 'Meets entry rules', tone: 'jade' };
  if (match.hard_eligibility === 'ineligible') return { label: 'Not eligible yet', tone: 'risk' };
  return { label: 'Needs checking', tone: 'amber' };
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
  const [query, setQuery] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [kind, setKind] = useState<DemandKind | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [customMatches, setCustomMatches] = useState<ReverseMatch[]>([]);

  const combined = useMemo(() => {
    const ids = new Set(matches.map((m) => m.demand_id));
    return [...customMatches.filter((m) => !ids.has(m.demand_id)), ...matches].sort(
      (a, b) => b.score - a.score || a.demand_id.localeCompare(b.demand_id)
    );
  }, [matches, customMatches]);

  const corpus = useMemo(() => buildProfileCorpus(profile), [profile]);

  const filterFn = (m: ReverseMatch, opts = { countries, sectors, kind }) => {
    const d = m.demand;
    if (opts.countries.length && !opts.countries.includes(d.country)) return false;
    if (opts.sectors.length && !opts.sectors.includes(d.industry)) return false;
    if (opts.kind && d.demand_kind !== opts.kind) return false;
    if (query.trim()) {
      const hay = [d.title, d.buyer_name, d.problem, d.country, d.industry, ...d.must_have, ...d.nice_to_have]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  };

  const filtered = combined.filter((m) => filterFn(m));
  const activeFilterCount = countries.length + sectors.length + (kind ? 1 : 0);
  const liveAiSource = combined.some((m) => m.ai_source === 'gemma_live') ? 'gemma_live' : 'demo_fixture';

  const toggle = (list: string[], value: string, set: (v: string[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const clearAll = () => {
    setCountries([]);
    setSectors([]);
    setKind(null);
    setQuery('');
  };

  return (
    <section aria-label="Discover challenges" className="space-y-5">
      {/* Intro + secondary actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] text-ink">
            <span className="font-bold">{combined.length} challenges</span> ranked for{' '}
            {profile.startup_name || 'your startup'}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <AiSourceBadge source={liveAiSource} />
            <span className="text-xs text-muted">Fit score is rule-based, not a funding probability</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onRefreshMatches ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshMatches}
              disabled={isLoading}
              icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />}
            >
              {isLoading ? 'Checking' : 'Re-check fit'}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPostOpen(true)}
            data-testid="open-post-demand-modal-btn"
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Post a challenge
          </Button>
        </div>
      </div>

      {/* Search + filter trigger */}
      <div className="sticky top-[57px] z-20 -mx-4 space-y-2 bg-paper/90 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by problem, company or skill"
              aria-label="Search challenges"
              className={`${inputClass} pl-9`}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="relative inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-surface px-3.5 text-sm font-semibold text-ink shadow-card hover:bg-paper cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 ? (
              <span className="tabular inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-jade px-1.5 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        {activeFilterCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {[...countries, ...sectors, ...(kind ? [KINDS.find((k) => k.id === kind)!.label] : [])].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (countries.includes(label)) toggle(countries, label, setCountries);
                  else if (sectors.includes(label)) toggle(sectors, label, setSectors);
                  else setKind(null);
                }}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-ink px-3 text-xs font-semibold text-white cursor-pointer"
                aria-label={`Remove filter ${label}`}
              >
                {label}
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            ))}
            <button type="button" onClick={clearAll} className="min-h-[32px] px-2 text-xs font-semibold text-muted underline hover:text-ink cursor-pointer">
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No challenges match these filters"
          body="Remove a filter or try a broader search term."
          action={<Button variant="secondary" onClick={clearAll}>Clear filters</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((match) => (
            <li key={match.demand_id}>
              <ChallengeCard
                match={match}
                corpus={corpus}
                onOpen={() => onSelectMatch(match)}
                onDraft={() => onOpenPocBuilder(match)}
              />
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter challenges"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={clearAll} disabled={activeFilterCount === 0}>
              Clear
            </Button>
            <Button block onClick={() => setFiltersOpen(false)}>
              Show {filtered.length} result{filtered.length === 1 ? '' : 's'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-semibold text-ink">Type</legend>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <FilterChip key={k.id} active={kind === k.id} onClick={() => setKind(kind === k.id ? null : k.id)}>
                  {k.label}
                </FilterChip>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-semibold text-ink">Country</legend>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <FilterChip key={c} active={countries.includes(c)} onClick={() => toggle(countries, c, setCountries)}>
                  {c}
                </FilterChip>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-semibold text-ink">Sector</legend>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => (
                <FilterChip key={s} active={sectors.includes(s)} onClick={() => toggle(sectors, s, setSectors)}>
                  {s}
                </FilterChip>
              ))}
            </div>
          </fieldset>
        </div>
      </Sheet>

      <PostChallengeSheet
        open={postOpen}
        onClose={() => setPostOpen(false)}
        onCreate={(brief) => {
          const scored = scoreDemandMatch(profile, brief);
          setCustomMatches((prev) => [scored, ...prev]);
          onAddCustomDemand?.(brief, scored);
          setPostOpen(false);
        }}
      />
    </section>
  );
}

function ChallengeCard({
  match,
  corpus,
  onOpen,
  onDraft,
}: {
  match: ReverseMatch;
  corpus: string;
  onOpen: () => void;
  onDraft: () => void;
}) {
  const d = match.demand;
  const covered = d.must_have.filter((req) => isRequirementCoveredByProfile(req, match, corpus)).length;
  const eligibility = eligibilityCopy(match);
  const money = formatMoneyRange(d.budget_range);

  return (
    <article
      data-testid={`demand-card-${match.demand_id}`}
      className="overflow-hidden rounded-2xl bg-surface shadow-card"
    >
      <button
        type="button"
        onClick={onOpen}
        data-testid={`view-match-intelligence-${match.demand_id}`}
        aria-label={`${d.title}, ${d.buyer_name}. Fit score ${match.score} out of 100. View details`}
        className="block w-full p-4 text-left transition-colors hover:bg-paper/60 sm:p-5 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper text-xs font-extrabold text-ink">
            {countryCode(d.country)}
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-muted">{d.buyer_name}</p>
          <FitMeter score={match.score} compact />
        </div>
        <h2 className="mt-3 text-[17px] font-bold leading-snug text-ink">{d.title}</h2>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{d.problem}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Chip
            tone={eligibility.tone}
            icon={
              eligibility.tone === 'jade' ? (
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              ) : (
                <CircleAlert className="h-3 w-3" aria-hidden="true" />
              )
            }
          >
            {eligibility.label}
          </Chip>
          <Chip tone="neutral">
            Covers {covered} of {d.must_have.length} must-haves
          </Chip>
          <ProvenanceBadge status={d.data_status} sourceUrl={d.source_url} lastVerifiedAt={d.last_verified_at} />
        </div>
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2 sm:px-5">
        <span className="min-w-0 truncate text-xs text-muted">
          {DEMAND_KIND_LABEL[d.demand_kind]}
          {money ? `, ${money}` : ''}
          {d.deadline_label ? `, ${d.deadline_label}` : ''}
        </span>
        <button
          type="button"
          onClick={onDraft}
          data-testid={`create-poc-plan-${match.demand_id}`}
          className="inline-flex min-h-[40px] shrink-0 items-center gap-0.5 rounded-lg px-2 text-sm font-semibold text-jade hover:bg-jade-wash cursor-pointer"
        >
          Draft pilot plan
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function PostChallengeSheet({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (brief: DemandBrief) => void;
}) {
  const [kind, setKind] = useState<DemandKind>('corporate_challenge');
  const [buyer, setBuyer] = useState('');
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('Indonesia');
  const [industry, setIndustry] = useState('AgriTech');
  const [problem, setProblem] = useState('');
  const [mustHaves, setMustHaves] = useState('');
  const [niceToHaves, setNiceToHaves] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyer.trim() || !title.trim() || !problem.trim()) return;
    const stages: StartupStage[] = ['Pre-seed', 'Seed', 'Series A'];
    const goals: PrimaryGoal[] =
      kind === 'vc_thesis' ? ['Investment', 'Market Expansion'] : ['Pilot Partnership', 'Market Expansion'];
    onCreate({
      id: `SELF-CH-${Date.now().toString().slice(-4)}`,
      demand_kind: kind,
      buyer_name: buyer.trim(),
      title: title.trim(),
      country,
      industry,
      problem: problem.trim(),
      must_have: split(mustHaves),
      nice_to_have: split(niceToHaves),
      stages,
      goals,
      budget_range:
        minBudget || maxBudget
          ? { min: Number(minBudget) || undefined, max: Number(maxBudget) || undefined, currency: 'USD' }
          : null,
      deadline_label: 'Open, self-reported',
      data_status: 'self_reported',
      source_url: null,
      last_verified_at: null,
      eligibility_notes: ['Posted in this browser. Not checked by BridgeAI.'],
    });
    setBuyer('');
    setTitle('');
    setProblem('');
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Post a challenge"
      description="For corporates and investors. It is saved in this browser and scored against the current startup profile."
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button block type="submit" form="post-challenge-form">Post challenge</Button>
        </div>
      }
    >
      <form id="post-challenge-form" onSubmit={submit} className="space-y-4">
        <div className="flex gap-2">
          {KINDS.map((k) => (
            <FilterChip key={k.id} active={kind === k.id} onClick={() => setKind(k.id)}>
              {k.label}
            </FilterChip>
          ))}
        </div>
        <Field label="Organisation">
          <input className={inputClass} required value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="Java Agro Cooperative" />
        </Field>
        <Field label="Challenge title">
          <input className={inputClass} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Smartphone leaf-blight screening pilot" />
        </Field>
        <Field label="What problem needs solving?">
          <textarea
            className={`${inputClass} min-h-[96px] py-2.5`}
            required
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Who is affected, how big the pilot is, and what a good result looks like."
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country">
            <select className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Sector">
            <select className={inputClass} value={industry} onChange={(e) => setIndustry(e.target.value)}>
              {SECTORS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Must-have skills" hint="Separate with commas">
          <input className={inputClass} value={mustHaves} onChange={(e) => setMustHaves(e.target.value)} placeholder="crop disease detection, mobile workflow" />
        </Field>
        <Field label="Nice-to-have skills" hint="Separate with commas">
          <input className={inputClass} value={niceToHaves} onChange={(e) => setNiceToHaves(e.target.value)} placeholder="offline-first, Bahasa interface" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget from (USD)">
            <input className={inputClass} type="number" inputMode="numeric" min={0} value={minBudget} onChange={(e) => setMinBudget(e.target.value)} />
          </Field>
          <Field label="Budget to (USD)">
            <input className={inputClass} type="number" inputMode="numeric" min={0} value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />
          </Field>
        </div>
      </form>
    </Sheet>
  );
}

export default DemandBoard;
