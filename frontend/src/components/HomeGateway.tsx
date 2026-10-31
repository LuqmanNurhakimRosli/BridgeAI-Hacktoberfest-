'use client';

import React, { useState } from 'react';
import {
  Rocket,
  Sparkles,
  ArrowRight,
  Target,
  Briefcase,
  Handshake,
  BarChart3,
  CheckCircle2,
  Building2,
  Globe,
  FileCheck2,
  Info,
} from 'lucide-react';
import type { Deal, DemandBrief, ReverseMatch, StartupProfile } from '@/types';
import type { NavTab } from './AppShell';
import { ProvenanceBadge } from './ProvenanceBadge';
import { KokoroTtsButton } from './KokoroTtsButton';
import { rankDemandMatches } from '@/lib/demand-matcher';
import demandBriefsData from '@/data/demand-briefs.json';
import demoDealsData from '@/data/deals-demo.json';

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

const DEFAULT_PREVIEW_PROFILE: StartupProfile = {
  startup_name: 'AgriSmart',
  description:
    'We are AgriSmart, a Malaysian seed-stage startup building phone-based AI leaf-disease detection. We need an Indonesian company with a real field-pilot problem to solve.',
  industry: 'AgriTech',
  home_country: 'Malaysia',
  target_country: 'Indonesia',
  stage: 'Seed',
  product: 'Phone-based AI leaf-disease screening app',
  primary_goal: 'Pilot Partnership',
  needs: ['crop disease detection', 'mobile workflow'],
  missing_fields: ['Offline field capability confirmation'],
  confidence_notes: ['Extracted from founder Golden Path narrative'],
};

const COUNTRY_FLAG: Record<string, string> = {
  Indonesia: '🇮🇩',
  Singapore: '🇸🇬',
  Malaysia: '🇲🇾',
  Thailand: '🇹🇭',
  Vietnam: '🇻🇳',
  Philippines: '🇵🇭',
};

export function HomeGateway({
  profile,
  isPassportConfirmed = false,
  demands,
  matches,
  localDeals = [],
  demoDeals,
  onNavigate,
  onRunGoldenPath,
  onSelectMatch,
}: HomeGatewayProps) {
  const [activeRole, setActiveRole] = useState<'founder' | 'demand_owner'>('founder');

  const demandsList = (demands && demands.length > 0
    ? demands
    : (demandBriefsData as DemandBrief[]));

  const demoDealsList = (demoDeals && demoDeals.length > 0
    ? demoDeals
    : (demoDealsData as Deal[]));

  const effectiveProfile = profile || DEFAULT_PREVIEW_PROFILE;

  const computedMatches =
    matches && matches.length > 0
      ? matches
      : rankDemandMatches(effectiveProfile, demandsList);

  const featuredMatches = computedMatches.slice(0, 2);

  // Live Deal KPIs separated by Local vs Synthetic Demo
  const isPocActive = (d: Deal) =>
    d.state === 'poc_running' || d.state === 'agreement_signed';
  const isInNegotiationOrQualified = (d: Deal) =>
    [
      'qualified',
      'introduction_requested',
      'first_meeting',
      'proposal_shared',
      'negotiation',
    ].includes(d.state);
  const isConfirmedOutcome = (d: Deal) =>
    d.state === 'contract_signed' || d.state === 'paid';

  const localActivePocs = localDeals.filter(isPocActive).length;
  const demoActivePocs = demoDealsList.filter(isPocActive).length;
  const totalActivePocs = localActivePocs + demoActivePocs;

  const localNegotiation = localDeals.filter(isInNegotiationOrQualified).length;
  const demoNegotiation = demoDealsList.filter(isInNegotiationOrQualified).length;
  const totalNegotiation = localNegotiation + demoNegotiation;

  const localConfirmed = localDeals.filter(isConfirmedOutcome).length;
  const demoConfirmed = demoDealsList.filter(isConfirmedOutcome).length;

  // Profile completeness calculation (70% default unconfirmed / missing fields, 100% when confirmed & complete)
  const hasAllCoreFields = Boolean(
    effectiveProfile.startup_name &&
      effectiveProfile.industry &&
      effectiveProfile.home_country &&
      effectiveProfile.target_country &&
      effectiveProfile.stage &&
      effectiveProfile.primary_goal
  );
  const completenessPercent =
    isPassportConfirmed && hasAllCoreFields && (effectiveProfile.missing_fields || []).length === 0
      ? 100
      : 70;

  return (
    <div className="space-y-6">
      {/* Greeting Banner with ASEAN Skyline / Gradient Header Card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F2D5B] via-[#133870] to-[#0A1E3F] text-white p-5 sm:p-6 shadow-md border border-slate-800/40">
        {/* Decorative Subtle ASEAN Skyline SVG Pattern */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 h-32 w-80 opacity-10 text-emerald-300"
          viewBox="0 0 400 120"
          fill="currentColor"
        >
          <rect x="20" y="50" width="22" height="70" />
          <rect x="48" y="30" width="18" height="90" />
          <polygon points="57,10 48,30 66,30" />
          <rect x="75" y="45" width="28" height="75" />
          <rect x="115" y="20" width="16" height="100" />
          <rect x="135" y="20" width="16" height="100" />
          <rect x="128" y="48" width="10" height="6" />
          <rect x="165" y="40" width="36" height="80" />
          <rect x="215" y="25" width="55" height="95" rx="4" />
          <rect x="210" y="20" width="65" height="7" rx="3" />
          <rect x="285" y="55" width="30" height="65" />
          <rect x="325" y="35" width="25" height="85" />
          <rect x="358" y="60" width="24" height="60" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-xs">
              <Globe className="h-3.5 w-3.5" />
              <span>ASEAN Cross-Border Commercialization &amp; Pilot OS</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight leading-snug">
              Good morning, Founder ☀️ — Turn your innovation into real, measurable deals across ASEAN.
            </h2>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
              Reverse-match verified problem statements, structure 75-day cross-border POCs, and track deal progression with explicit provenance.
            </p>
          </div>

          {/* Role Switcher Pill */}
          <div
            role="group"
            aria-label="Workspace Role Switcher"
            className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-950/40 p-1.5 border border-white/15 self-start"
          >
            <button
              type="button"
              onClick={() => setActiveRole('founder')}
              data-testid="role-founder-btn"
              className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'founder'
                  ? 'bg-[#10B981] text-slate-950 shadow-xs'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Founder (Supply → Demand)
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('demand_owner')}
              data-testid="role-demand-owner-btn"
              className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'demand_owner'
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Corporate / VC Demand Owner (P1 Preview)
            </button>
          </div>
        </div>

        {/* Corporate / VC Demand Owner (P1 Preview) Banner when toggled */}
        {activeRole === 'demand_owner' ? (
          <div
            data-testid="demand-owner-preview-banner"
            className="relative z-10 mt-4 rounded-xl border border-violet-300/40 bg-violet-950/70 p-4 text-xs sm:text-sm text-violet-100 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-violet-300" />
                <span>Corporate &amp; VC Demand Owner Intake (P1 Architecture Preview)</span>
              </div>
              <span className="rounded-full bg-violet-400/20 border border-violet-300/40 px-2.5 py-0.5 text-[11px] font-semibold text-violet-200">
                Reverse-Matching Engine Active
              </span>
            </div>
            <p className="text-violet-100/90 leading-relaxed">
              In BridgeAI V2, corporate innovation labs and regional VCs publish structured{' '}
              <strong>Demand Briefs</strong> specifying exact <code>must_have</code> technical gates, target ASEAN country, accepted funding stages, and indicative pilot scope. Startups are deterministically screened before any warm intro is requested.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('challenges')}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-lg bg-white text-[#0F2D5B] px-3.5 py-2 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span>Inspect 8 Structured Demand Briefs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('founder')}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span>Return to Founder View</span>
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {/* 4 Quick Summary Cards (2x2 on mobile, 4-col on desktop) */}
      <section aria-label="Quick Summary Metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. 8 Demand Briefs */}
        <button
          type="button"
          onClick={() => onNavigate('challenges')}
          data-testid="summary-card-demands"
          className="group text-left rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-[#0F2D5B] hover:shadow-md transition-all flex flex-col justify-between min-h-[116px] cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Demand Catalog
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0F2D5B] group-hover:bg-[#0F2D5B] group-hover:text-white transition-colors">
              <Target className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold text-[#0F2D5B]">
              {demandsList.length} Demand Briefs
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-amber-800">
              Synthetic Demo Catalog · 6 Countries
            </p>
          </div>
        </button>

        {/* 2. Active POCs */}
        <button
          type="button"
          onClick={() => onNavigate('deals')}
          data-testid="summary-card-pocs"
          className="group text-left rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-[#10B981] hover:shadow-md transition-all flex flex-col justify-between min-h-[116px] cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active POCs
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-[#10B981] group-hover:bg-[#10B981] group-hover:text-white transition-colors">
              <Briefcase className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {totalActivePocs} Active POCs
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-slate-600">
              {localActivePocs} Local · {demoActivePocs} Synthetic Demo
            </p>
          </div>
        </button>

        {/* 3. In Negotiation / Qualified */}
        <button
          type="button"
          onClick={() => onNavigate('deals')}
          data-testid="summary-card-qualified"
          className="group text-left rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-[#8B5CF6] hover:shadow-md transition-all flex flex-col justify-between min-h-[116px] cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              In Negotiation / Qualified
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white transition-colors">
              <Handshake className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {totalNegotiation} Qualified
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-slate-600">
              {localNegotiation} Local Saved · {demoNegotiation} Demo Cohort
            </p>
          </div>
        </button>

        {/* 4. Confirmed Outcomes */}
        <button
          type="button"
          onClick={() => onNavigate('insights')}
          data-testid="summary-card-outcomes"
          className="group text-left rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-[#0F2D5B] hover:shadow-md transition-all flex flex-col justify-between min-h-[116px] cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Confirmed Outcomes
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700 group-hover:bg-[#0F2D5B] group-hover:text-white transition-colors">
              <BarChart3 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {localConfirmed} Local / {demoConfirmed} Demo
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-slate-600">
              Strict Cohort Separation (Signed / Paid)
            </p>
          </div>
        </button>
      </section>

      {/* Main Desktop Split Grid: Hero Card + Next Best Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Hero Card: BridgeAI Assistant (Gemma 4 Demand-to-Deal OS) */}
        <section className="lg:col-span-2 rounded-2xl border border-violet-200/90 bg-gradient-to-br from-white via-violet-50/30 to-emerald-50/30 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 border border-violet-200 px-3 py-1 text-xs font-bold text-violet-900">
                <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
                <span>BridgeAI Assistant (Gemma 4 Demand-to-Deal OS)</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <KokoroTtsButton
                  label="🔊 Voice Briefing (Kokoro TTS)"
                  text={`Welcome to ASEAN BridgeAI. Based on ${profile?.startup_name || 'AgriSmart'}, we evaluated ${demandsList.length} ASEAN corporate challenges and investor theses. Your top reverse-match is Nusantara Food and Farms Innovation Lab in Indonesia with an 85 percent deterministic compatibility score for an offline-ready crop disease detection pilot.`}
                />
                <span className="text-xs font-semibold text-slate-500">
                  ⏱️ 90-Second Judge Golden Path
                </span>
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-[#0F2D5B]">
              From Unstructured Founder Narrative to Scoped 75-Day Cross-Border Pilot
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Instead of passive startup directories, BridgeAI combines{' '}
              <strong className="text-slate-800">deterministic hard-eligibility gates</strong> with{' '}
              <strong className="text-slate-800">Gemma 4 structured extraction</strong> to turn corporate problem statements into actionable pilot proposals.
            </p>

            {/* 4-Step Golden Path Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 pt-1">
              {[
                {
                  step: '1. Describe AgriSmart',
                  desc: 'Extract Passport & surface missing fields honestly',
                },
                {
                  step: '2. Reverse-Match Corporate Demand',
                  desc: '30/30/15/15/10 rubric vs Nusantara Farms (ID)',
                },
                {
                  step: '3. Generate 75-Day Proposed POC',
                  desc: '4-phase milestones, IP/data checks & Bahasa draft',
                },
                {
                  step: '4. Track Qualified Deal & Honest Funnel',
                  desc: 'Human-confirmed FSM events & explicit denominators',
                },
              ].map((item, idx) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F2D5B]">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0F2D5B] text-[10px] font-extrabold text-white">
                      {idx + 1}
                    </span>
                    <span>{item.step.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Two Prominent CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onRunGoldenPath}
              data-testid="hero-golden-path-cta"
              className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#10B981] hover:bg-[#059669] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition-colors cursor-pointer"
            >
              <Rocket className="h-4 w-4 shrink-0" />
              <span>🚀 Run AgriSmart Golden Path (1-Click Demo)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('passport')}
              data-testid="hero-edit-passport-cta"
              className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#0F2D5B] bg-white hover:bg-slate-50 px-4 py-3 text-sm font-bold text-[#0F2D5B] transition-colors cursor-pointer"
            >
              <span>✏️ Create / Edit Startup Passport</span>
            </button>
          </div>
        </section>

        {/* Next Best Action Progress Card */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F2D5B]">
                <FileCheck2 className="h-4 w-4 text-[#10B981]" />
                <span>Next Best Action</span>
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
                {completenessPercent}% Profile Completeness
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Confirm your Startup Passport to unlock deterministic reverse-matching
            </h3>

            {/* Completeness Progress Bar (70% / 100%) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Passport Verification Readiness</span>
                <span>{completenessPercent}% (70% Draft → 100% Confirmed)</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0F2D5B] to-[#10B981] transition-all duration-300"
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>
                  <strong>Active Profile:</strong> {effectiveProfile.startup_name || 'AgriSmart'} (
                  {effectiveProfile.home_country || 'Malaysia'} →{' '}
                  {effectiveProfile.target_country || 'Indonesia'})
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {(effectiveProfile.missing_fields || []).length > 0
                    ? `Pending confirmation: ${effectiveProfile.missing_fields.join(', ')}`
                    : 'All core matching fields confirmed for hard-eligibility scoring.'}
                </span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('passport')}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0F2D5B] hover:bg-[#0A1E3F] px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <span>Review &amp; Confirm Startup Passport</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </div>

      {/* Recommended Corporate Challenges Preview (2 Featured Cards) */}
      <section aria-label="Recommended Corporate Challenges Preview" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0F2D5B]">
              Recommended Corporate Challenges Preview
            </h3>
            <p className="text-xs text-slate-600">
              Ranked by deterministic 30/30/15/15/10 compatibility rubric against your Startup Passport.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('challenges')}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-[#0F2D5B] transition-colors cursor-pointer"
          >
            <span>Explore All {demandsList.length} Demand Briefs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredMatches.map((match) => {
            const d = match.demand;
            const flag = COUNTRY_FLAG[d.country] || '🌏';
            return (
              <article
                key={d.id}
                data-testid={`featured-challenge-${d.id}`}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-[#0F2D5B]/50 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Row: Provenance Badge + Match Score Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <ProvenanceBadge
                      status={d.data_status}
                      sourceUrl={d.source_url}
                      lastVerifiedAt={d.last_verified_at}
                      size="sm"
                    />
                    <span
                      title="Rule-based fit score, not funding probability"
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-xs font-extrabold text-emerald-900"
                    >
                      🎯 {match.score}/100 Match
                    </span>
                  </div>

                  {/* Buyer & Title */}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <span>{flag}</span>
                      <span>{d.country}</span>
                      <span>·</span>
                      <span className="text-[#0F2D5B] font-bold">{d.buyer_name}</span>
                    </div>
                    <h4 className="mt-1 text-base font-extrabold text-slate-900 leading-snug">
                      {d.title}
                    </h4>
                    <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {d.problem}
                    </p>
                  </div>

                  {/* Must-Have Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">
                      Must-Haves:
                    </span>
                    {d.must_have.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-[#F1F5F9] border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-[#0F2D5B]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-500">
                    {d.budget_range
                      ? `Est. Scope: ${d.budget_range.currency} ${(
                          (d.budget_range.min || 0) / 1000
                        ).toFixed(0)}K–${((d.budget_range.max || 0) / 1000).toFixed(
                          0
                        )}K (Illustrative)`
                      : 'Illustrative Pilot Scope'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectMatch) {
                        onSelectMatch(match);
                      } else {
                        onNavigate('challenges');
                      }
                    }}
                    className="min-h-[44px] inline-flex items-center gap-1 rounded-xl bg-[#0F2D5B] hover:bg-[#0A1E3F] px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    <span>View Challenge →</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default HomeGateway;
