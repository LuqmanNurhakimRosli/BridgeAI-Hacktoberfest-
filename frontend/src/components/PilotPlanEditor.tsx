'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Target,
  Globe2,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  Copy,
  Check,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  ShieldAlert,
  Mail,
  Users,
} from 'lucide-react';
import { toRequestProfile } from '@/lib/contract';
import type {
  POCMilestone,
  POCPlan,
  POCSuccessCriterion,
  ReverseMatch,
  StartupProfile,
} from '@/types';
import { AiSourceBadge, ProvenanceBadge } from './ProvenanceBadge';
import { KokoroTtsButton } from './KokoroTtsButton';
import { formatBudgetPill, getCountryFlag } from './DemandBoard';

export interface PilotPlanEditorProps {
  profile: StartupProfile;
  match: ReverseMatch;
  initialPlan?: POCPlan | null;
  onBack: () => void;
  onSaveDealWithPoc: (
    match: ReverseMatch,
    plan: POCPlan,
    nextActionTitle: string,
    cadenceDays: 30 | 90 | 180
  ) => void;
}

type OutreachLanguage = 'English' | 'Bahasa Melayu' | 'Bahasa Indonesia';

export function buildOutreachEmailDraft(
  language: OutreachLanguage,
  profile: StartupProfile,
  match: ReverseMatch
): { language: OutreachLanguage; subject: string; body: string } {
  const startupName = profile.startup_name || 'our startup team';
  const homeCountry = profile.home_country || 'ASEAN';
  const product =
    profile.product ||
    profile.description ||
    'our applied AI workflow solution';
  const buyerName = match.demand.buyer_name;
  const challengeTitle = match.demand.title;
  const targetCountry = match.demand.country;
  const mustHaves = match.demand.must_have.join(' & ') || challengeTitle;

  if (language === 'Bahasa Melayu') {
    return {
      language: 'Bahasa Melayu',
      subject: `[Cadangan Perbincangan Awal] ${startupName} × ${buyerName} — Rangka Kerja Rintis 75 Hari`,
      body: `Kepada Pasukan Inovasi & Kerjasama di ${buyerName},\n\nKami daripada ${startupName} (${homeCountry}) ingin memohon sesi perbincangan penerokaan awal berhubung cabaran "${challengeTitle}" di ${targetCountry}.\n\nPasukan kami membangunkan ${product} yang selaras dengan keperluan ${mustHaves}. Sebagai bahan perbincangan awal (bukan komitmen mengikat), kami telah menyediakan draf pelan ujian rintis (POC) selama 75 hari untuk mengesahkan ketepatan operasi lapangan, protokol persetujuan data, serta kriteria kejayaan bersama.\n\nKami amat menghargai peluang panggilan singkat selama 20 minit untuk mengesahkan keperluan teknikal dan tadbir urus data pihak tuan.\n\nTerima kasih,\nPasukan Pengasas ${startupName}`,
    };
  }

  if (language === 'Bahasa Indonesia') {
    return {
      language: 'Bahasa Indonesia',
      subject: `[Usulan Diskusi Eksplorasi] ${startupName} × ${buyerName} — Konsep Uji Coba POC 75 Hari`,
      body: `Kepada Tim Inovasi & Kemitraan ${buyerName},\n\nPerkenalkan, kami dari ${startupName} (${homeCountry}) ingin mengajukan diskusi eksplorasi awal terkait kebutuhan "${challengeTitle}" di ${targetCountry}.\n\nKami mengembangkan ${product} dengan fokus pada ${mustHaves}. Sebagai bahan diskusi awal yang bersifat tidak mengikat, kami menyusun draf rencana uji coba lapangan (POC) 75 hari guna memvalidasi kesiapan operasional, persetujuan data pengguna lokal, serta metrik evaluasi bersama.\n\nApabila berkenan, kami mengusulkan panggilan singkat 20 menit untuk memverifikasi protokol teknis dan kebutuhan lapangan tim Anda.\n\nHormat kami,\nTim Pendiri ${startupName}`,
    };
  }

  return {
    language: 'English',
    subject: `[Exploratory Pilot Inquiry] ${startupName} × ${buyerName} — Proposed 75-Day Validation Scope`,
    body: `Dear Innovation & Partnerships Team at ${buyerName},\n\nWe are reaching out from ${startupName} (${homeCountry}) to request an initial exploratory conversation regarding your "${challengeTitle}" brief in ${targetCountry}.\n\nOur team builds ${product}, addressing ${mustHaves}. To make an initial discussion concrete, we prepared a non-binding 75-day proposed pilot plan outlining baseline validation metrics, offline/field readiness checks, and data consent questions to resolve together.\n\nWould your team be open to a 20-minute scoping call to verify technical preconditions and pilot evaluation criteria?\n\nWarm regards,\nFounding Team, ${startupName}`,
  };
}

export function buildDefaultPocPlan(
  profile: StartupProfile,
  match: ReverseMatch
): POCPlan {
  const { demand } = match;
  const startupName = profile.startup_name || 'Your Startup';
  const mustHaveList = demand.must_have.join(' and ') || demand.title;

  const milestones: POCMilestone[] = [
    {
      phase: 'Phase 1: Discovery & Scoping (Days 1–10)',
      window_label: 'Days 1–10',
      day: 10,
      action:
        'Align baseline problem metrics, confirm pilot test sites, and review cross-border data consent & IP boundaries.',
      owner: 'joint',
      deliverables: [
        'Mutually reviewed 75-day pilot test protocol',
        'Confirmed field data-consent & zero-PII sandbox checklist',
      ],
    },
    {
      phase: 'Phase 2: Readiness & Protocol (Days 11–25)',
      window_label: 'Days 11–25',
      day: 25,
      action: `Configure ${
        profile.product || 'startup workflow'
      } for ${demand.country} operating conditions, including offline/low-connectivity and local language checks.`,
      owner: 'startup',
      deliverables: [
        'Pre-flight sandbox build & localized operator guide',
        'Partner test site onboarding & baseline telemetry benchmark',
      ],
    },
    {
      phase: 'Phase 3: Field Pilot Execution (Days 26–60)',
      window_label: 'Days 26–60',
      day: 60,
      action: `Execute bounded field validation across target ${demand.industry} test cohort and log weekly accuracy & usability telemetry.`,
      owner: 'startup',
      deliverables: [
        'Bi-weekly field performance & anomaly logs',
        'Operator usability feedback across pilot cohort',
      ],
    },
    {
      phase: 'Phase 4: Joint Evaluation & Pay/No-Pay Decision (Days 61–75)',
      window_label: 'Days 61–75',
      day: 75,
      action:
        'Audit final pilot metrics against agreed success thresholds and determine commercial conversion or next procurement step.',
      owner: 'joint',
      deliverables: [
        'Joint 75-day POC validation scorecard',
        'Commercial conversion decision memo (Pay / Extend / Close)',
      ],
    },
  ];

  const successCriteria: POCSuccessCriterion[] = [
    {
      metric: 'Field screening precision/recall >= 85%',
      target: '>= 85% validated accuracy on consented field samples',
      validation_method:
        'Ground-truth audit against partner specialist benchmark dataset',
    },
    {
      metric: 'Offline sync reliability across 10 test farms',
      target: '>= 98% successful queue sync within 15s of connectivity',
      validation_method:
        'Automated mobile telemetry logs across low-connectivity test sites',
    },
    {
      metric: 'Farmer/agronomist usability score >= 4.0/5',
      target: '>= 4.0 / 5.0 post-task operator satisfaction',
      validation_method:
        'Structured end-of-pilot survey with field extension officers',
    },
  ];

  return {
    deal_id: `DEAL-${demand.id}`,
    demand_id: demand.id,
    title: `75-Day Proposed Cross-Border Pilot: ${demand.title}`,
    partner_name: demand.buyer_name,
    startup_name: startupName,
    country: demand.country,
    sector: demand.industry,
    status: 'proposed',
    proposed_duration_days: 75,
    objective: `Validate ${startupName}'s ${
      profile.product || 'solution'
    } against ${demand.buyer_name}'s requirement for ${mustHaveList} in ${
      demand.country
    } within a bounded 75-day trial window.`,
    proposed_scope: `Bounded field pilot across 3–10 designated test sites in ${demand.country}, testing ${mustHaveList} under real operational constraints before any commercial contract commitment.`,
    target_users_label:
      demand.industry === 'AgriTech'
        ? '10 Cooperative Test Farms & Extension Officers'
        : `Designated ${demand.industry} Sandbox Cohort (${demand.country})`,
    estimated_budget_note: formatBudgetPill(demand),
    milestones,
    success_criteria: successCriteria,
    preconditions: [
      'Confirm cross-border data sharing & farm/user consent protocol',
      'Confirm local sector regulatory / import checks in target country',
    ],
    ip_questions: [
      'Confirm foreground vs background IP ownership of model weights & field data',
    ],
    data_sharing_questions: [
      'Confirm cross-border data sharing & farm/user consent protocol',
    ],
    liability_questions: [
      'Confirm field-trial liability boundaries & operational safety owner',
      'Confirm post-POC commercial conversion criteria & procurement path',
    ],
    possible_conversion_to_paid:
      'Subject to Phase 4 joint review (Days 61–75): if all 3 validation metrics meet target thresholds, transition to commercial procurement discussion.',
    outreach_email: buildOutreachEmailDraft('English', profile, match),
    ai_source: match.ai_source || 'demo_fixture',
  };
}

const SUB_NAV_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline (Days 1–75)' },
  { id: 'milestones', label: 'Milestones & Owners' },
  { id: 'checklist', label: 'IP, Data & Liability Checklist' },
  { id: 'outreach', label: 'Multilingual Outreach Draft' },
] as const;

type SubNavTabId = (typeof SUB_NAV_TABS)[number]['id'];

const DISCUSSION_CHECKLIST_ITEMS = [
  'Confirm cross-border data sharing & farm/user consent protocol',
  'Confirm foreground vs background IP ownership of model weights & field data',
  'Confirm field-trial liability boundaries & operational safety owner',
  'Confirm local sector regulatory / import checks in target country',
  'Confirm post-POC commercial conversion criteria & procurement path',
] as const;

export function PilotPlanEditor({
  profile,
  match,
  initialPlan,
  onBack,
  onSaveDealWithPoc,
}: PilotPlanEditorProps) {
  const [plan, setPlan] = useState<POCPlan>(() =>
    initialPlan ? { ...initialPlan } : buildDefaultPocPlan(profile, match)
  );
  const [activeTab, setActiveTab] = useState<SubNavTabId>('overview');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    [DISCUSSION_CHECKLIST_ITEMS[0]]: false,
    [DISCUSSION_CHECKLIST_ITEMS[1]]: false,
    [DISCUSSION_CHECKLIST_ITEMS[2]]: false,
    [DISCUSSION_CHECKLIST_ITEMS[3]]: false,
    [DISCUSSION_CHECKLIST_ITEMS[4]]: false,
  });

  const [selectedLang, setSelectedLang] = useState<OutreachLanguage>(
    plan.outreach_email?.language || 'English'
  );
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Bottom action bar state
  const [nextActionTitle, setNextActionTitle] = useState(
    'Schedule exploratory discovery call & confirm pilot data consent'
  );
  const [cadenceDays, setCadenceDays] = useState<30 | 90 | 180>(30);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const handleLanguageSwitch = (lang: OutreachLanguage) => {
    setSelectedLang(lang);
    const draft = buildOutreachEmailDraft(lang, profile, match);
    setPlan((prev) => ({
      ...prev,
      outreach_email: draft,
    }));
  };

  const handleCopyOutreach = async () => {
    const fullText = `Subject: ${plan.outreach_email.subject}\n\n${plan.outreach_email.body}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText);
      }
    } catch {
      // Fallback if clipboard permission is denied in headless test environments
    }
    setCopyToast(
      'Draft copied to clipboard! Note: Copying a draft does NOT mark the deal as Contacted.'
    );
  };

  const handleRefreshFromApi = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/poc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          demand: match.demand,
          language: selectedLang,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.plan) {
          setPlan(data.plan);
        }
      }
    } catch {
      // Keep current editable plan if offline
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleUpdateCriterion = (
    idx: number,
    field: keyof POCSuccessCriterion,
    value: string
  ) => {
    setPlan((prev) => {
      const updated = [...prev.success_criteria];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, success_criteria: updated };
    });
  };

  const handleAddCriterion = () => {
    setPlan((prev) => ({
      ...prev,
      success_criteria: [
        ...prev.success_criteria,
        {
          metric: 'Custom pilot validation metric',
          target: 'Define target threshold',
          validation_method: 'Joint partner review',
        },
      ],
    }));
  };

  const handleRemoveCriterion = (idx: number) => {
    setPlan((prev) => ({
      ...prev,
      success_criteria: prev.success_criteria.filter((_, i) => i !== idx),
    }));
  };

  const handleUpdateMilestoneAction = (idx: number, value: string) => {
    setPlan((prev) => {
      const updated = [...prev.milestones];
      updated[idx] = { ...updated[idx], action: value };
      return { ...prev, milestones: updated };
    });
  };

  const toggleChecklistItem = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSave = () => {
    onSaveDealWithPoc(
      match,
      plan,
      nextActionTitle.trim() ||
        'Schedule exploratory discovery call & confirm pilot data consent',
      cadenceDays
    );
    setSaveFeedback(
      'Saved Qualified Deal & 75-Day Proposed POC Draft to Deal Tracker!'
    );
  };

  return (
    <section
      aria-label="75-Day Cross-Border POC Plan Builder"
      className="mx-auto max-w-6xl space-y-6 pb-24"
    >
      {/* Top Mandatory V2 Banner */}
      <div
        data-testid="poc-mandatory-disclaimer-banner"
        className="rounded-2xl border-2 border-amber-300 bg-amber-50/95 px-5 py-3.5 text-amber-950 shadow-xs"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />
            <p className="text-xs font-bold tracking-tight sm:text-sm">
              ✨ PROPOSED 75-Day Cross-Border Pilot Plan — Draft for Discussion Only (Not Signed, Funded, or Legally Binding)
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-950">
            Status: {plan.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={onBack}
            data-testid="poc-back-btn"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>← Back</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <ProvenanceBadge status={match.demand.data_status} />
            <AiSourceBadge source={plan.ai_source} />
            <button
              type="button"
              onClick={handleRefreshFromApi}
              disabled={isGeneratingAi}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`}
              />
              <span>
                {isGeneratingAi
                  ? 'Synthesizing...'
                  : 'Re-generate via /api/poc'}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
              <span>{plan.startup_name}</span>
              <span>×</span>
              <span className="text-slate-900">{plan.partner_name}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                {getCountryFlag(plan.country)} {plan.country}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {plan.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-950">
              🎯 {match.score}/100 Match Fit
            </span>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Pilot Plan Sections"
          className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4"
        >
          {SUB_NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[38px] rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 At-a-Glance Cards + Grant / Co-Funding Honesty Card */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Tile 1 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <Calendar className="h-4 w-4" />
              <span>75 Days (Proposed Window)</span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-slate-900">
              4 Bounded Phases
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Days 1–10 Scoping → Days 61–75 Pay/No-Pay Review
            </p>
          </div>

          {/* Tile 2 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
              <Target className="h-4 w-4" />
              <span>Target Trial Scope</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-900">
              {plan.target_users_label}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {plan.estimated_budget_note}
            </p>
          </div>

          {/* Tile 3 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
              <Globe2 className="h-4 w-4" />
              <span>{`Primary Market (${match.demand.country})`}</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-900">
              {profile.home_country || 'ASEAN'} → {match.demand.country}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Sector: {match.demand.industry}
            </p>
          </div>

          {/* Tile 4 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-700">
              <TrendingUp className="h-4 w-4" />
              <span>Conversion Hypothesis (Post-Pilot Review)</span>
            </div>
            <p className="mt-1.5 text-xs font-medium leading-snug text-slate-800">
              {plan.possible_conversion_to_paid}
            </p>
          </div>
        </div>

        {/* Grant / Co-Funding Honesty Card (V2-Compliant Replacement) */}
        <div
          data-testid="grant-cofunding-honesty-card"
          className="rounded-2xl border border-amber-300/90 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-950 shadow-2xs"
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p className="font-semibold">
              Grant &amp; Co-Funding Notice: External grants or corporate co-funding are NOT guaranteed by BridgeAI. Verify official programme windows before budgeting.
            </p>
          </div>
        </div>
      </div>

      {/* Editable Objective & Proposed Scope Card */}
      <div
        className={`rounded-2xl border bg-white p-5 shadow-xs sm:p-6 ${
          activeTab === 'overview'
            ? 'border-emerald-300 ring-2 ring-emerald-500/10'
            : 'border-slate-200/90'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">
            Pilot Objective &amp; Proposed Scope (Editable)
          </h2>
          <span className="text-xs text-slate-500">
            Inline edits persist when saved to Deal Tracker
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label
              htmlFor="poc-objective-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Pilot Objective
            </label>
            <textarea
              id="poc-objective-input"
              rows={3}
              value={plan.objective}
              onChange={(e) =>
                setPlan((prev) => ({ ...prev, objective: e.target.value }))
              }
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="poc-scope-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Proposed Scope &amp; Cohort Boundaries
            </label>
            <textarea
              id="poc-scope-input"
              rows={3}
              value={plan.proposed_scope}
              onChange={(e) =>
                setPlan((prev) => ({ ...prev, proposed_scope: e.target.value }))
              }
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4-Phase Timeline (Days 1–75) */}
      <div
        className={`rounded-2xl border bg-white p-5 shadow-xs sm:p-6 ${
          activeTab === 'timeline' || activeTab === 'milestones'
            ? 'border-emerald-300 ring-2 ring-emerald-500/10'
            : 'border-slate-200/90'
        }`}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              4-Phase Cross-Border Pilot Timeline (Days 1–75)
            </h2>
            <p className="text-xs text-slate-500">
              Structured 75-day validation cadence with explicit startup, partner, and joint ownership.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700">
            Section 26.1 Standard Cadence
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {plan.milestones.map((ms, idx) => {
            const ownerDisplay =
              idx === 1
                ? 'startup / partner'
                : ms.owner;

            return (
              <div
                key={ms.phase}
                data-testid={`poc-phase-card-${idx + 1}`}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                      {ms.phase}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
                      <Users className="h-3 w-3 text-emerald-700" />
                      Owner: {ownerDisplay}
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    value={ms.action}
                    aria-label={`Action for ${ms.phase}`}
                    onChange={(e) =>
                      handleUpdateMilestoneAction(idx, e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs leading-relaxed text-slate-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                {ms.deliverables.length > 0 && (
                  <div className="mt-3 border-t border-slate-200/80 pt-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Deliverables:
                    </span>
                    <ul className="mt-1 space-y-1 text-xs text-slate-700">
                      {ms.deliverables.map((deliv, dIdx) => (
                        <li key={dIdx} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          <span>{deliv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle / Bottom Grid: Success Criteria Table + Data, IP & Liability Discussion Checklist */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Success Criteria Table (7 cols) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Success Criteria &amp; Validation Thresholds
              </h2>
              <p className="text-xs text-slate-500">
                Editable quantitative gates used in Phase 4 (Days 61–75) Pay/No-Pay review.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCriterion}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Metric</span>
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 pr-3">Metric</th>
                  <th className="py-2.5 px-3">Proposed Target</th>
                  <th className="py-2.5 px-3">Validation Method</th>
                  <th className="py-2.5 pl-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plan.success_criteria.map((crit, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="py-2.5 pr-2">
                      <input
                        type="text"
                        value={crit.metric}
                        aria-label={`Metric ${idx + 1}`}
                        onChange={(e) =>
                          handleUpdateCriterion(idx, 'metric', e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={crit.target}
                        aria-label={`Proposed Target ${idx + 1}`}
                        onChange={(e) =>
                          handleUpdateCriterion(idx, 'target', e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={crit.validation_method}
                        aria-label={`Validation Method ${idx + 1}`}
                        onChange={(e) =>
                          handleUpdateCriterion(
                            idx,
                            'validation_method',
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-600 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(idx)}
                        aria-label={`Remove metric ${idx + 1}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data, IP & Liability Discussion Checklist (5 cols) */}
        <div
          className={`rounded-2xl border bg-white p-5 shadow-xs sm:p-6 lg:col-span-5 ${
            activeTab === 'checklist'
              ? 'border-emerald-300 ring-2 ring-emerald-500/10'
              : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Questions to Resolve Before Starting Pilot
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Rule #13 Governance: Cross-border IP, data consent, and field liability items framed as discussion checkpoints (never pre-signed legal claims).
          </p>

          <div className="mt-4 space-y-2.5">
            {DISCUSSION_CHECKLIST_ITEMS.map((item) => {
              const isChecked = Boolean(checkedItems[item]);
              return (
                <label
                  key={item}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs transition ${
                    isChecked
                      ? 'border-emerald-300 bg-emerald-50/60 text-emerald-950'
                      : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:bg-slate-100/70'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleChecklistItem(item)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium leading-snug">{item}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multilingual Outreach Email Drafter (English | Bahasa Melayu | Bahasa Indonesia) */}
      <div
        className={`rounded-2xl border bg-white p-5 shadow-xs sm:p-6 ${
          activeTab === 'outreach'
            ? 'border-emerald-300 ring-2 ring-emerald-500/10'
            : 'border-slate-200/90'
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Multilingual First-Contact Outreach Email Drafter
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Respectful &le;180-word exploratory inquiry — zero fabricated personal recipient names/emails and zero implied prior agreement.
            </p>
          </div>

          {/* Language Switcher Pills & Kokoro Multilingual TTS */}
          <div className="flex flex-wrap items-center gap-2">
            <KokoroTtsButton
              label={`🔊 Read ${selectedLang} Draft (Kokoro TTS)`}
              lang={
                selectedLang === 'Bahasa Melayu'
                  ? 'ms-MY'
                  : selectedLang === 'Bahasa Indonesia'
                  ? 'id-ID'
                  : 'en-US'
              }
              showVoiceSelector
              text={`${plan.outreach_email.subject}. ${plan.outreach_email.body}`}
            />
            {(
              ['English', 'Bahasa Melayu', 'Bahasa Indonesia'] as OutreachLanguage[]
            ).map((lang) => {
              const active = selectedLang === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageSwitch(lang)}
                  data-testid={`outreach-lang-${lang}`}
                  className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="outreach-subject-input"
              className="block text-xs font-semibold text-slate-600"
            >
              Subject Line ({selectedLang})
            </label>
            <input
              id="outreach-subject-input"
              type="text"
              value={plan.outreach_email.subject}
              onChange={(e) =>
                setPlan((prev) => ({
                  ...prev,
                  outreach_email: {
                    ...prev.outreach_email,
                    subject: e.target.value,
                  },
                }))
              }
              className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="outreach-body-input"
              className="block text-xs font-semibold text-slate-600"
            >
              Email Body (&le;180 words)
            </label>
            <textarea
              id="outreach-body-input"
              rows={6}
              value={plan.outreach_email.body}
              onChange={(e) =>
                setPlan((prev) => ({
                  ...prev,
                  outreach_email: {
                    ...prev.outreach_email,
                    body: e.target.value,
                  },
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3.5 text-sm leading-relaxed text-slate-800 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleCopyOutreach}
              data-testid="copy-outreach-draft-btn"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50"
            >
              {copyToast ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 text-slate-600" />
              )}
              <span>📋 Copy Outreach Draft</span>
            </button>

            {copyToast && (
              <div
                role="status"
                data-testid="copy-outreach-toast"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900"
              >
                {copyToast}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-4 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-md sm:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          {/* Next-Action Task Input */}
          <div className="lg:col-span-5">
            <label
              htmlFor="next-action-task-input"
              className="block text-xs font-semibold text-slate-700"
            >
              Next-Action Follow-Up Task
            </label>
            <input
              id="next-action-task-input"
              type="text"
              value={nextActionTitle}
              onChange={(e) => setNextActionTitle(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Check-in Cadence Selector (30 Days | 90 Days | 180 Days) */}
          <div className="lg:col-span-3">
            <span className="block text-xs font-semibold text-slate-700">
              Follow-Up Check-In Cadence
            </span>
            <div className="mt-1 flex gap-1.5">
              {([30, 90, 180] as const).map((days) => {
                const active = cadenceDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setCadenceDays(days)}
                    className={`min-h-[44px] flex-1 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                      active
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {`${days} Days`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Save CTA */}
          <div className="lg:col-span-4">
            <button
              type="button"
              onClick={handleSave}
              data-testid="save-deal-with-poc-btn"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Save className="h-4 w-4 shrink-0" />
              <span>💾 Save Qualified Deal &amp; 75-Day POC Draft to Deal Tracker →</span>
            </button>
          </div>
        </div>

        {saveFeedback && (
          <div
            role="status"
            className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900"
          >
            {saveFeedback}
          </div>
        )}
      </div>
    </section>
  );
}

export default PilotPlanEditor;
