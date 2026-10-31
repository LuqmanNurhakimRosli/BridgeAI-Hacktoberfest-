'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  CheckSquare,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2,
  FileText,
  ShieldCheck,
  BookmarkCheck,
  Bookmark,
  Info,
  Lock,
} from 'lucide-react';
import type { ReverseMatch, StartupProfile } from '@/types';
import { AiSourceBadge, ProvenanceBadge } from './ProvenanceBadge';
import { KokoroTtsButton } from './KokoroTtsButton';
import { formatBudgetPill, getCountryFlag } from './DemandBoard';

export interface ReverseMatchDetailProps {
  profile: StartupProfile;
  match: ReverseMatch;
  onBack: () => void;
  onOpenPocBuilder: (match: ReverseMatch) => void;
  onSaveQualifiedDeal: (match: ReverseMatch) => void;
  isDealSaved: boolean;
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

  // All 4 intelligence cards open by default for immediate inspection + collapsible toggle
  const [openSections, setOpenSections] = useState<{
    why: boolean;
    collab: boolean;
    risks: boolean;
    next: boolean;
  }>({
    why: true,
    collab: true,
    risks: true,
    next: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // SVG circular gauge geometry
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, match.score));
  const strokeDashoffset =
    circumference - (clampedScore / 100) * circumference;

  const matchTierLabel =
    clampedScore >= 80
      ? 'Strong Match'
      : clampedScore >= 60
      ? 'Qualified Fit (With Unknowns)'
      : 'Exploratory Fit';

  const whyMatchText =
    match.ai_analysis?.why_match ||
    `${profile.startup_name || 'Your startup'} aligns with ${demand.buyer_name}'s "${demand.title}" brief across ${
      match.reasons.join('; ') || 'core sector and stage criteria'
    }.`;

  const potentialCollaborationText =
    match.ai_analysis?.potential_collaboration ||
    `Hypothetical exploratory 75-day pilot in ${demand.country} validating ${demand.must_have.join(
      ' and '
    )} prior to any commercial procurement commitment.`;

  const combinedRisksAndUnknowns = Array.from(
    new Set([
      ...(match.ai_analysis?.fit_gaps || []),
      ...(match.unknowns || []),
    ])
  );

  const nextActionText =
    match.ai_analysis?.next_action ||
    `Schedule an exploratory scoping call with ${demand.buyer_name} to verify pilot test protocol, offline readiness, and field data consent.`;

  const rubricChecklist = [
    {
      label: 'Sector/problem relevance',
      weight: '30 pts',
      detail:
        match.reasons.find((r) => r.toLowerCase().includes('sector')) ||
        `${profile.industry || 'Unconfirmed'} vs ${demand.industry}`,
      passed: Boolean(
        profile.industry &&
          (profile.industry.toLowerCase() === demand.industry.toLowerCase() ||
            match.reasons.some((r) => r.toLowerCase().includes('sector')))
      ),
    },
    {
      label: 'Must-have coverage',
      weight: '30 pts',
      detail:
        match.reasons.find((r) => r.toLowerCase().includes('must-have')) ||
        `Required: ${demand.must_have.join(', ')}`,
      passed: !match.unknowns.some((u) =>
        u.toLowerCase().includes('must-have not yet evidenced')
      ),
    },
    {
      label: 'Target country fit',
      weight: '15 pts',
      detail:
        match.reasons.find(
          (r) =>
            r.toLowerCase().includes('market') ||
            r.toLowerCase().includes('country')
        ) || `Target: ${profile.target_country || 'Unset'} → ${demand.country}`,
      passed:
        (profile.target_country || '').toLowerCase() ===
          demand.country.toLowerCase() ||
        (profile.home_country || '').toLowerCase() ===
          demand.country.toLowerCase(),
    },
    {
      label: 'Stage compatibility',
      weight: '15 pts',
      detail:
        match.reasons.find((r) => r.toLowerCase().includes('stage')) ||
        `Startup: ${profile.stage || 'Unset'} (Accepts: ${demand.stages.join(', ')})`,
      passed: Boolean(
        profile.stage && demand.stages.includes(profile.stage)
      ),
    },
  ];

  const sampleReferenceMaterials = [
    {
      id: 'REF-01',
      title: 'Challenge Problem Statement Brief (Synthetic)',
      meta: `${demand.id} • Metadata-Only Demo Document • Not an active tender`,
      status: demand.data_status,
    },
    {
      id: 'REF-02',
      title: 'Pilot Evaluation Protocol Template (Draft)',
      meta: '75-Day Cross-Border Validation Framework • Illustrative Reference',
      status: 'synthetic_demo' as const,
    },
    {
      id: 'REF-03',
      title: 'Cross-Border Data Consent & IP Discussion Guide',
      meta: 'Pre-Pilot Governance Checklist • Non-binding',
      status: 'synthetic_demo' as const,
    },
  ];

  return (
    <section
      aria-label="Opportunity Match Intelligence Detail"
      className="mx-auto max-w-6xl space-y-6 pb-20"
    >
      {/* Header Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={onBack}
            data-testid="back-to-challenges-btn"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>← Back to Challenges Board</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <KokoroTtsButton
              label="🔊 Read Match Intelligence (Kokoro TTS)"
              showVoiceSelector
              text={`Match Intelligence for ${demand.buyer_name} in ${demand.country}. Deterministic compatibility score is ${match.score} out of 100. Why it matches: ${match.ai_analysis?.why_match || ''}. Potential collaboration: ${match.ai_analysis?.potential_collaboration || ''}. Recommended next step: ${match.ai_analysis?.next_action || ''}`}
            />
            <ProvenanceBadge
              status={demand.data_status}
              sourceUrl={demand.source_url}
              lastVerifiedAt={demand.last_verified_at}
            />
            <AiSourceBadge source={match.ai_source || 'demo_fixture'} />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Building2 className="h-4 w-4 text-slate-500" />
                {demand.buyer_name}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                <span>{getCountryFlag(demand.country)}</span>
                <span>{demand.country}</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 border border-indigo-200/80">
                {demand.industry}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200/80">
                {demand.demand_kind === 'vc_thesis'
                  ? 'VC Investment Thesis'
                  : 'Corporate Challenge (POC)'}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {demand.title}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
              {demand.problem}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
            <span className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-3.5 py-1.5 text-xs font-semibold text-emerald-900">
              {formatBudgetPill(demand)}
            </span>
            {demand.deadline_label && (
              <span className="text-xs text-slate-500">
                {demand.deadline_label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Intelligence Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Compatibility Gauge + 4 Collapsible Intelligence Cards */}
        <div className="space-y-5 lg:col-span-8">
          {/* Compatibility Gauge & Summary Card */}
          <div
            data-testid="compatibility-gauge-card"
            className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6"
          >
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {/* SVG Circular Progress Ring */}
              <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
                <svg
                  className="h-32 w-32 -rotate-90 transform"
                  viewBox="0 0 120 120"
                  role="img"
                  aria-label={`${match.score}% Compatibility`}
                >
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    className="text-slate-100"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke="#10B981"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {`${match.score}%`}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                    Compatibility
                  </span>
                </div>
              </div>

              {/* Match Summary & Deterministic Rubric Checklist */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100/90 px-2.5 py-1 text-xs font-bold text-emerald-900">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                    {matchTierLabel}
                  </span>
                  <span className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                    Deterministic 30/30/15/15/10 Rubric Score — Not a guarantee of selection or funding
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-600">
                  Evaluated against confirmed Startup Passport for{' '}
                  <strong className="font-semibold text-slate-900">
                    {profile.startup_name || 'Your Startup'}
                  </strong>
                  . Scores reflect rule-based criteria alignment, not investment or grant approval probability.
                </p>

                {/* Rule-derived reasons checklist */}
                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                  {rubricChecklist.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-start gap-2 rounded-xl border p-2.5 text-xs ${
                        item.passed
                          ? 'border-emerald-200 bg-emerald-50/50 text-slate-800'
                          : 'border-amber-200 bg-amber-50/50 text-slate-800'
                      }`}
                    >
                      {item.passed ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <span>{item.label}</span>
                          <span className="text-[10px] font-medium text-slate-500">
                            ({item.weight})
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-600">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {match.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {match.reasons.map((reason) => (
                      <span
                        key={reason}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4 Collapsible Intelligence Cards */}
          <div className="space-y-3.5">
            {/* 1. Why it matches */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              <button
                type="button"
                onClick={() => toggleSection('why')}
                aria-expanded={openSections.why}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50/80"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      ✨ Why it matches
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Grounded strictly in supplied Startup Passport and demand brief facts
                    </p>
                  </div>
                </div>
                {openSections.why ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              {openSections.why && (
                <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-700">
                  <p>{whyMatchText}</p>
                </div>
              )}
            </div>

            {/* 2. Potential collaboration */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              <button
                type="button"
                onClick={() => toggleSection('collab')}
                aria-expanded={openSections.collab}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50/80"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Lightbulb className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      💡 Potential collaboration
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Hypothetical exploratory pilot scope — subject to mutual discovery
                    </p>
                  </div>
                </div>
                {openSections.collab ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              {openSections.collab && (
                <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-700">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800">
                    Hypothetical Exploratory Pilot Concept
                  </div>
                  <p>{potentialCollaborationText}</p>
                </div>
              )}
            </div>

            {/* 3. Risks and missing information */}
            <div className="overflow-hidden rounded-2xl border border-amber-200/90 bg-white shadow-xs">
              <button
                type="button"
                onClick={() => toggleSection('risks')}
                aria-expanded={openSections.risks}
                className="flex w-full items-center justify-between gap-3 bg-amber-50/40 px-5 py-4 text-left transition hover:bg-amber-50/70"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      ⚠️ Risks and missing information
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      Unverified capabilities, regulatory checks, and operational unknowns
                    </p>
                  </div>
                </div>
                {openSections.risks ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              {openSections.risks && (
                <div className="border-t border-amber-100 px-5 py-4 text-sm text-slate-700">
                  {combinedRisksAndUnknowns.length > 0 ? (
                    <ul className="space-y-2">
                      {combinedRisksAndUnknowns.map((gap, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-xs leading-relaxed text-amber-950"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-600">
                      Confirm offline operation, local data privacy compliance, and field trial consent before pilot kick-off.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 4. Recommended next step */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              <button
                type="button"
                onClick={() => toggleSection('next')}
                aria-expanded={openSections.next}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50/80"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckSquare className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      ☑️ Recommended next step
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Actionable milestone to advance from Identified to Qualified
                    </p>
                  </div>
                </div>
                {openSections.next ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              {openSections.next && (
                <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-700">
                  <p>{nextActionText}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Desktop) / Bottom Section (Mobile): Key Information & Reference Materials */}
        <div className="space-y-5 lg:col-span-4">
          {/* Key Information Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Info className="h-4 w-4 text-emerald-600" />
              <span>Key Information</span>
            </h2>

            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <dt className="font-medium text-slate-500">Industry</dt>
                <dd className="font-semibold text-slate-900">{demand.industry}</dd>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <dt className="font-medium text-slate-500">Demand Type</dt>
                <dd className="font-semibold text-slate-900">
                  {demand.demand_kind === 'vc_thesis'
                    ? 'VC Investment Thesis'
                    : 'Corporate Challenge (POC)'}
                </dd>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <dt className="font-medium text-slate-500">Country</dt>
                <dd className="font-semibold text-slate-900">
                  {getCountryFlag(demand.country)} {demand.country}
                </dd>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <dt className="font-medium text-slate-500">Accepted Stages</dt>
                <dd className="font-semibold text-slate-900">
                  {demand.stages.join(', ')}
                </dd>
              </div>

              <div className="border-b border-slate-100 pb-2.5">
                <dt className="font-medium text-slate-500">Must-Have Gates</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {demand.must_have.map((m) => (
                    <span
                      key={m}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800"
                    >
                      {m}
                    </span>
                  ))}
                </dd>
              </div>

              <div className="border-b border-slate-100 pb-2.5">
                <dt className="font-medium text-slate-500">Provenance Status</dt>
                <dd className="mt-1.5 flex flex-col gap-1">
                  <code className="w-fit rounded bg-amber-100/80 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900">
                    {demand.data_status}
                  </code>
                  <ProvenanceBadge
                    status={demand.data_status}
                    sourceUrl={demand.source_url}
                    lastVerifiedAt={demand.last_verified_at}
                  />
                </dd>
              </div>

              <div>
                <dt className="font-medium text-slate-500">Verification Note</dt>
                <dd className="mt-1 space-y-1 text-[11px] leading-relaxed text-slate-600">
                  {(demand.eligibility_notes && demand.eligibility_notes.length > 0
                    ? demand.eligibility_notes
                    : [
                        'Synthetic Demo record created for hackathon evaluation — not an active commercial tender.',
                      ]
                  ).map((note, idx) => (
                    <p key={idx}>{note}</p>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {/* Sample Reference Materials (Synthetic Demo Metadata) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>Sample Reference Materials (Synthetic Demo Metadata)</span>
              </h2>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Metadata-only reference artifacts for pilot scoping. No confidential partner documents are hosted in this public client bundle.
            </p>

            <ul className="mt-3.5 space-y-2.5">
              {sampleReferenceMaterials.map((doc) => (
                <li
                  key={doc.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-800">
                      {doc.title}
                    </span>
                    <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{doc.meta}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Primary Action Bar */}
      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Saving a match records state <code className="font-semibold text-slate-900">qualified</code> (event:{' '}
            <code className="font-semibold text-slate-900">match_qualified</code>) locally — never falsely marked as Contacted or Signed.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onSaveQualifiedDeal(match)}
            disabled={isDealSaved}
            data-testid="save-qualified-deal-btn"
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
              isDealSaved
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 cursor-default'
                : 'border-slate-300 bg-white text-slate-800 shadow-2xs hover:bg-slate-50'
            }`}
          >
            {isDealSaved ? (
              <>
                <BookmarkCheck className="h-4 w-4 text-emerald-600" />
                <span>🔖 Saved as Qualified Deal</span>
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4 text-slate-600" />
                <span>🔖 Save as Qualified Deal</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onOpenPocBuilder(match)}
            data-testid="detail-create-poc-plan-btn"
            style={{ backgroundColor: '#10B981' }}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition hover:brightness-95"
          >
            <span>✨ Create 75-Day POC Plan</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default ReverseMatchDetail;
