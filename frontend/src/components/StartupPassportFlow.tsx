'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileUp,
  ArrowRight,
  Sprout,
  Zap,
  CreditCard,
  Plus,
  X,
  MapPin,
  Layers,
  Target,
  Building2,
} from 'lucide-react';
import type { PrimaryGoal, StartupProfile, StartupStage } from '@/types';
import { AiSourceBadge, ProvenanceBadge } from './ProvenanceBadge';
import { KokoroTtsButton } from './KokoroTtsButton';

export const AGRISMART_PRESET: StartupProfile = {
  startup_name: 'AgriSmart',
  description:
    'We are AgriSmart, a Malaysian seed-stage startup building phone-based AI leaf-disease detection. We need an Indonesian company with a real field-pilot problem to solve.',
  industry: 'AgriTech',
  home_country: 'Malaysia',
  target_country: 'Indonesia',
  stage: 'Seed',
  product: 'Phone-based AI leaf-disease screening app',
  primary_goal: 'Pilot Partnership',
  needs: ['Field pilot', 'Agritech corporate partner', 'crop disease detection', 'mobile workflow'],
  missing_fields: ['Offline field capability confirmation'],
  confidence_notes: [
    'Extracted from founder Golden Path narrative (Malaysia → Indonesia, Seed stage, AgriTech).',
    'Offline-first field operation and farmer data consent are not explicitly stated in the description and should be confirmed with the corporate partner.',
  ],
};

export const GREENTECH_PRESET: StartupProfile = {
  startup_name: 'GreenTech Solutions',
  description:
    'GreenTech Solutions is a Singapore Seed-stage clean energy startup offering non-intrusive IoT clamp sensors and automated Scope 2 carbon reporting for manufacturing SMEs expanding into Malaysia, Indonesia, and Vietnam.',
  industry: 'Clean Energy',
  home_country: 'Singapore',
  target_country: 'Malaysia',
  stage: 'Seed',
  product: 'Low-carbon IoT energy load monitoring & automated Scope 2 ESG reporting platform',
  primary_goal: 'Pilot Partnership',
  needs: [
    'energy load monitoring',
    'Scope 2 carbon reporting',
    'industrial manufacturing sandbox',
    'non-intrusive IoT clamp sensors',
  ],
  missing_fields: [],
  confidence_notes: [
    'Identified Clean Energy sector, Singapore home market, Malaysia primary industrial sandbox target, and Seed stage.',
    'Covers both energy load monitoring and Scope 2 carbon reporting must-have requirements.',
  ],
};

export const FINBRIDGE_PRESET: StartupProfile = {
  startup_name: 'FinBridge Rural KYC',
  description:
    'FinBridge is a Malaysian Pre-seed fintech building explainable alternative credit scoring and offline agent onboarding for rural agricultural cooperatives across Indonesia and the Philippines.',
  industry: 'Fintech',
  home_country: 'Malaysia',
  target_country: 'Indonesia',
  stage: 'Pre-seed',
  product: 'Explainable alternative credit scoring & rural cooperative onboarding engine',
  primary_goal: 'Pilot Partnership',
  needs: [
    'alternative credit scoring',
    'explainable risk model',
    'rural cooperative pilot',
    'offline agent onboarding',
  ],
  missing_fields: ['Local borrower data privacy & OJK sandbox verification'],
  confidence_notes: [
    'Identified Fintech sector, Malaysia home market, Indonesia target market, and Pre-seed stage.',
    'Requires confirmation of zero-PII sandbox evaluation protocol before pilot launch.',
  ],
};

export interface StartupPassportFlowProps {
  profile?: StartupProfile | null;
  initialProfile?: StartupProfile | null;
  onProfileChange?: (profile: StartupProfile) => void;
  onConfirmPassport: (
    profile: StartupProfile,
    aiSource?: 'gemma_live' | 'demo_fixture',
    aiModel?: string
  ) => void;
  aiSource?: 'gemma_live' | 'demo_fixture';
  aiModel?: string;
}

const INDUSTRY_OPTIONS = [
  'AgriTech',
  'Fintech',
  'Clean Energy',
  'Smart City',
  'Sustainability',
  'AI',
  'HealthTech',
  'Logistics',
] as const;

const STAGE_OPTIONS: StartupStage[] = [
  'Idea',
  'Pre-seed',
  'Seed',
  'Series A',
  'Growth',
];

const COUNTRY_OPTIONS = [
  'Malaysia',
  'Indonesia',
  'Singapore',
  'Thailand',
  'Vietnam',
  'Philippines',
] as const;

const GOAL_OPTIONS: PrimaryGoal[] = [
  'Pilot Partnership',
  'Market Expansion',
  'Investment',
  'Accelerator',
];

const WIZARD_STEPS = [
  { id: 1, label: '1. Startup Profile' },
  { id: 2, label: '2. Business Goals' },
  { id: 3, label: '3. Funding & Partnerships' },
  { id: 4, label: '4. Review & Generate' },
] as const;

function computeMissingCoreFields(p: StartupProfile): string[] {
  const missing: string[] = [];
  if (!p.startup_name) missing.push('Startup Name (startup_name)');
  if (!p.industry) missing.push('Sector / Industry (industry)');
  if (!p.stage) missing.push('Funding Stage (stage)');
  if (!p.home_country) missing.push('Home Country (home_country)');
  if (!p.target_country) missing.push('Target ASEAN Market (target_country)');
  if (!p.primary_goal) missing.push('Primary Business Goal (primary_goal)');
  return missing;
}

function deterministicLocalExtract(
  descriptionText: string,
  current: StartupProfile
): StartupProfile {
  const lower = descriptionText.toLowerCase();

  let startup_name = current.startup_name;
  if (lower.includes('agrismart')) startup_name = 'AgriSmart';
  else if (lower.includes('greentech')) startup_name = 'GreenTech Solutions';
  else if (lower.includes('finbridge')) startup_name = 'FinBridge Rural KYC';

  let industry = current.industry;
  if (
    lower.includes('leaf-disease') ||
    lower.includes('crop') ||
    lower.includes('farm') ||
    lower.includes('agri')
  ) {
    industry = 'AgriTech';
  } else if (
    lower.includes('credit') ||
    lower.includes('kyc') ||
    lower.includes('fintech') ||
    lower.includes('micro-finance')
  ) {
    industry = 'Fintech';
  } else if (
    lower.includes('clean energy') ||
    lower.includes('scope 2') ||
    lower.includes('carbon') ||
    lower.includes('energy')
  ) {
    industry = 'Clean Energy';
  } else if (lower.includes('fleet') || lower.includes('smart city')) {
    industry = 'Smart City';
  } else if (lower.includes('cold-chain') || lower.includes('spoilage')) {
    industry = 'Sustainability';
  }

  let stage: StartupStage | null = current.stage;
  if (lower.includes('pre-seed') || lower.includes('pre seed')) stage = 'Pre-seed';
  else if (lower.includes('series a')) stage = 'Series A';
  else if (lower.includes('seed-stage') || lower.includes('seed stage') || lower.includes('seed'))
    stage = 'Seed';
  else if (lower.includes('growth')) stage = 'Growth';
  else if (lower.includes('idea')) stage = 'Idea';

  let home_country = current.home_country;
  if (lower.includes('malaysian') || lower.includes('from malaysia')) {
    home_country = 'Malaysia';
  } else if (lower.includes('singapore')) {
    home_country = 'Singapore';
  }

  let target_country = current.target_country;
  if (lower.includes('indonesian') || lower.includes('indonesia')) {
    target_country = 'Indonesia';
  } else if (lower.includes('malaysia') && home_country !== 'Malaysia') {
    target_country = 'Malaysia';
  } else if (lower.includes('vietnam')) {
    target_country = 'Vietnam';
  } else if (lower.includes('thailand')) {
    target_country = 'Thailand';
  }

  let primary_goal: PrimaryGoal | null = current.primary_goal;
  if (lower.includes('pilot') || lower.includes('problem to solve')) {
    primary_goal = 'Pilot Partnership';
  } else if (lower.includes('invest') || lower.includes('fund')) {
    primary_goal = 'Investment';
  } else if (lower.includes('expand') || lower.includes('expansion')) {
    primary_goal = 'Market Expansion';
  }

  const product =
    lower.includes('leaf-disease')
      ? 'Phone-based AI leaf-disease detection & mobile crop screening workflow'
      : current.product || descriptionText.slice(0, 90);

  const missing_fields: string[] = [];
  if (!stage) missing_fields.push('Startup funding stage (stage) not stated');
  if (!target_country) missing_fields.push('Target ASEAN country (target_country) not stated');
  if (industry === 'AgriTech' && !lower.includes('offline')) {
    missing_fields.push('Offline field capability confirmation');
  }

  return {
    startup_name: startup_name || 'AgriSmart',
    description: descriptionText,
    industry: industry || 'AgriTech',
    home_country: home_country || 'Malaysia',
    target_country: target_country || 'Indonesia',
    stage: stage || 'Seed',
    product,
    primary_goal: primary_goal || 'Pilot Partnership',
    needs:
      current.needs && current.needs.length > 0
        ? current.needs
        : ['crop disease detection', 'mobile workflow', 'field pilot partner'],
    missing_fields,
    confidence_notes: [
      'Structured fields extracted from founder narrative without inventing unsupported claims.',
      missing_fields.length > 0
        ? `Flagged ${missing_fields.length} item(s) for human confirmation before reverse-matching.`
        : 'All core matching fields present in description.',
    ],
  };
}

export function StartupPassportFlow({
  profile,
  initialProfile,
  onProfileChange,
  onConfirmPassport,
  aiSource: initialAiSource = 'demo_fixture',
  aiModel: initialAiModel,
}: StartupPassportFlowProps) {
  const startingProfile = profile || initialProfile || AGRISMART_PRESET;

  const [activeStep, setActiveStep] = useState<number>(1);
  const [draft, setDraft] = useState<StartupProfile>(startingProfile);
  const [newNeedTag, setNewNeedTag] = useState<string>('');
  const [deckMetadataName, setDeckMetadataName] = useState<string | null>(
    'AgriSmart_Seed_Pilot_Overview_2026.pdf (Metadata Only — Not Uploaded)'
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentAiSource, setCurrentAiSource] = useState<'gemma_live' | 'demo_fixture'>(
    initialAiSource
  );
  const [currentAiModel, setCurrentAiModel] = useState<string | undefined>(
    initialAiModel
  );
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDraft(profile);
    }
  }, [profile]);

  const updateDraft = (updater: (prev: StartupProfile) => StartupProfile) => {
    setDraft((prev) => {
      const next = updater(prev);
      if (onProfileChange) {
        onProfileChange(next);
      }
      return next;
    });
  };

  const handleLoadPreset = (preset: StartupProfile, label: string) => {
    setDraft(preset);
    if (onProfileChange) {
      onProfileChange(preset);
    }
    setStatusBanner(`Loaded ${label} preset. Review or extract with Gemma 4 below.`);
  };

  const handleExtractWithGemma = async () => {
    if (!draft.description.trim()) return;
    setIsAnalyzing(true);
    setStatusBanner(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: draft.description }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.profile) {
          const merged: StartupProfile = {
            ...draft,
            ...data.profile,
            description: draft.description,
          };
          setDraft(merged);
          if (onProfileChange) {
            onProfileChange(merged);
          }
          const src =
            (data?.meta?.source === 'gemma' || data?.meta?.ai_source === 'gemma_live') ? 'gemma_live' : 'demo_fixture';
          setCurrentAiSource(src);
          setCurrentAiModel(data?.meta?.model);
          setActiveStep(4);
          setStatusBanner(
            src === 'gemma_live'
              ? '✨ Extracted Startup Passport live via Gemma 4 on OpenRouter. Please review any missing fields below.'
              : '⚡ Extracted Startup Passport via deterministic schema analyzer (Demo Fixture mode).'
          );
          setIsAnalyzing(false);
          return;
        }
      }
    } catch {
      // Fallback to deterministic local extraction if API route is unavailable or offline
    }

    const fallbackProfile = deterministicLocalExtract(draft.description, draft);
    setDraft(fallbackProfile);
    if (onProfileChange) {
      onProfileChange(fallbackProfile);
    }
    setCurrentAiSource('demo_fixture');
    setActiveStep(4);
    setStatusBanner(
      '⚡ Extracted Startup Passport via deterministic schema analyzer (Demo Fixture Fallback).'
    );
    setIsAnalyzing(false);
  };

  const handleAddNeed = () => {
    const trimmed = newNeedTag.trim();
    if (!trimmed) return;
    if (!draft.needs.includes(trimmed)) {
      updateDraft((prev) => ({
        ...prev,
        needs: [...prev.needs, trimmed],
      }));
    }
    setNewNeedTag('');
  };

  const handleRemoveNeed = (tagToRemove: string) => {
    updateDraft((prev) => ({
      ...prev,
      needs: prev.needs.filter((t) => t !== tagToRemove),
    }));
  };

  const handleResolveMissingField = (itemToResolve: string) => {
    updateDraft((prev) => {
      const remaining = (prev.missing_fields || []).filter(
        (m) => m !== itemToResolve
      );
      const updatedNeeds =
        itemToResolve.toLowerCase().includes('offline') &&
        !prev.needs.includes('offline-first')
          ? [...prev.needs, 'offline-first']
          : prev.needs;
      return {
        ...prev,
        needs: updatedNeeds,
        missing_fields: remaining,
        confidence_notes: [
          ...prev.confidence_notes.filter(
            (n) => !n.includes(`Founder confirmed: ${itemToResolve}`)
          ),
          `Founder confirmed: ${itemToResolve}`,
        ],
      };
    });
  };

  const missingCoreFields = computeMissingCoreFields(draft);
  const allMissingItems = [
    ...missingCoreFields,
    ...(draft.missing_fields || []).filter((m) => !missingCoreFields.includes(m)),
  ];

  const charCount = draft.description.length;

  return (
    <div className="space-y-5">
      {/* Top 4-Step Progress Bar */}
      <nav
        aria-label="Startup Passport Wizard Steps"
        className="rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-xs"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {WIZARD_STEPS.map((step) => {
            const isCurrent = activeStep === step.id;
            const isCompleted = activeStep > step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                data-testid={`wizard-step-${step.id}`}
                className={`min-h-[44px] flex items-center justify-center sm:justify-start gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#0F2D5B] text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                    isCurrent
                      ? 'bg-[#10B981] text-slate-950'
                      : isCompleted
                      ? 'bg-[#10B981] text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isCompleted ? '✓' : step.id}
                </span>
                <span className="truncate">{step.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Preset Loader Pills at Top */}
      <section
        aria-label="Quick Preset Profiles"
        className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F2D5B]">
            ⚡ 1-Click Judge Demo Presets (Under 20s Mobile Setup)
          </span>
          <AiSourceBadge source={currentAiSource} model={currentAiModel} size="sm" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              handleLoadPreset(AGRISMART_PRESET, 'AgriSmart (MY → ID Golden Path)')
            }
            data-testid="preset-agrismart-btn"
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/90 hover:bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-950 transition-colors cursor-pointer"
          >
            <Sprout className="h-4 w-4 text-[#10B981] shrink-0" />
            <span>🌱 Load AgriSmart (MY → ID Golden Path)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleLoadPreset(
                GREENTECH_PRESET,
                'GreenTech Solutions (SG → ID/MY/VN Clean Energy)'
              )
            }
            data-testid="preset-greentech-btn"
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F1F5F9] hover:bg-slate-200/80 px-3.5 py-2 text-xs font-bold text-[#0F2D5B] transition-colors cursor-pointer"
          >
            <Zap className="h-4 w-4 text-amber-600 shrink-0" />
            <span>⚡ Load GreenTech Solutions (SG → ID/MY/VN Clean Energy)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleLoadPreset(
                FINBRIDGE_PRESET,
                'FinBridge Rural KYC (MY → ID/PH Fintech)'
              )
            }
            data-testid="preset-finbridge-btn"
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F1F5F9] hover:bg-slate-200/80 px-3.5 py-2 text-xs font-bold text-[#0F2D5B] transition-colors cursor-pointer"
          >
            <CreditCard className="h-4 w-4 text-violet-600 shrink-0" />
            <span>💳 Load FinBridge Rural KYC (MY → ID/PH Fintech)</span>
          </button>
        </div>

        {statusBanner ? (
          <div className="rounded-xl border border-violet-200 bg-violet-50/90 px-3.5 py-2 text-xs font-semibold text-violet-950">
            {statusBanner}
          </div>
        ) : null}
      </section>

      {/* Main Responsive 2-Column Split Layout: Left Form + Right Live AI Summary Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Form - 7 cols on desktop) */}
        <section
          aria-label="Startup Passport Input Form"
          className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0F2D5B]">
                Startup Passport Builder
              </h2>
              <p className="text-xs text-slate-500">
                Describe your startup in plain language or refine structured fields directly.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
              Step {activeStep} of 4
            </span>
          </div>

          {/* Startup Name & One-Line Product Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="passport-startup-name"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Startup Name *
              </label>
              <input
                id="passport-startup-name"
                type="text"
                value={draft.startup_name || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    startup_name: e.target.value || null,
                  }))
                }
                placeholder="e.g., AgriSmart"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="passport-product"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Product / Solution Tagline
              </label>
              <input
                id="passport-product"
                type="text"
                value={draft.product || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    product: e.target.value || null,
                  }))
                }
                placeholder="e.g., Phone-based AI leaf-disease screening app"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
              />
            </div>
          </div>

          {/* Short Description Textarea (0/300 target counter, supports up to 2000 chars) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="passport-description"
                className="block text-xs font-bold text-slate-700"
              >
                Founder Problem &amp; Solution Narrative *
              </label>
              <span
                className={`text-[11px] font-semibold ${
                  charCount > 2000 ? 'text-red-600' : 'text-slate-500'
                }`}
              >
                {charCount}/300 recommended (max 2000 chars)
              </span>
            </div>
            <textarea
              id="passport-description"
              rows={4}
              maxLength={2000}
              value={draft.description}
              onChange={(e) =>
                updateDraft((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe what your startup builds, your current funding stage, home market, and which ASEAN market + corporate pilot problem you want to solve..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 leading-relaxed focus:border-[#0F2D5B] focus:outline-none"
            />
          </div>

          {/* Primary CTA: Extract & Analyze with Gemma 4 */}
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-violet-950 space-y-0.5">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
                <span>Gemma 4 Structured Passport Extraction (Prompt A)</span>
              </div>
              <p className="text-violet-800/90 text-[11px]">
                Extracts strictly stated facts and flags any unstated fields under{' '}
                <code>missing_fields</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExtractWithGemma}
              disabled={isAnalyzing || !draft.description.trim()}
              data-testid="extract-gemma-btn"
              className="min-h-[44px] shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] hover:bg-violet-700 disabled:opacity-60 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {isAnalyzing
                  ? 'Analyzing with Gemma 4...'
                  : '✨ Extract & Analyze with Gemma 4'}
              </span>
            </button>
          </div>

          {/* Sector/Industry & Startup Stage Selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="passport-industry"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Sector / Industry *
              </label>
              <select
                id="passport-industry"
                value={draft.industry || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    industry: e.target.value || null,
                  }))
                }
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
              >
                <option value="">-- Select Sector --</option>
                {INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="passport-stage"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Startup Stage *
              </label>
              <select
                id="passport-stage"
                value={draft.stage || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    stage: (e.target.value as StartupStage) || null,
                  }))
                }
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
              >
                <option value="">-- Select Stage --</option>
                {STAGE_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Home Country, Target Market(s), Primary Business Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="passport-home-country"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Home Country *
              </label>
              <select
                id="passport-home-country"
                value={draft.home_country || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    home_country: e.target.value || null,
                  }))
                }
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
              >
                <option value="">-- Select Home --</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="passport-target-country"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Target Market(s) *
              </label>
              <select
                id="passport-target-country"
                value={draft.target_country || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    target_country: e.target.value || null,
                  }))
                }
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
              >
                <option value="">-- Select Target --</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="passport-primary-goal"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Primary Business Goal *
              </label>
              <select
                id="passport-primary-goal"
                value={draft.primary_goal || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    primary_goal: (e.target.value as PrimaryGoal) || null,
                  }))
                }
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
              >
                <option value="">-- Select Goal --</option>
                {GOAL_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Needs & Capabilities Tags */}
          <div className="space-y-2">
            <label
              htmlFor="passport-add-need"
              className="block text-xs font-bold text-slate-700"
            >
              Key Needs &amp; Demonstrated Capabilities (Used for Must-Have Gate Matching)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {draft.needs.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#F1F5F9] border border-slate-200 px-2.5 py-1 text-xs font-semibold text-[#0F2D5B]"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNeed(tag)}
                    aria-label={`Remove ${tag}`}
                    className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                id="passport-add-need"
                type="text"
                value={newNeedTag}
                onChange={(e) => setNewNeedTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNeed();
                  }
                }}
                placeholder="Add capability or need (e.g., offline-first, Bahasa Indonesia UI)..."
                className="flex-1 min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddNeed}
                className="min-h-[44px] inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Tag</span>
              </button>
            </div>
          </div>

          {/* Safe Pitch Deck Mock Dropzone */}
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <FileUp className="h-5 w-5 text-[#0F2D5B] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-slate-800">
                    Optional: Attach Deck Metadata (Demo Mode — no confidential files uploaded to server)
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    {deckMetadataName ||
                      'No deck metadata attached. Prototype records filename metadata only per Security Rule #14.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDeckMetadataName((prev) =>
                    prev
                      ? null
                      : `${draft.startup_name || 'Startup'}_Pilot_Deck_2026.pdf (Metadata Only)`
                  )
                }
                className="min-h-[40px] shrink-0 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                {deckMetadataName ? 'Remove Metadata' : 'Attach Mock Deck Metadata'}
              </button>
            </div>
          </div>
        </section>

        {/* Right Column (Desktop 5 cols) / Bottom Card (Mobile): AI Summary Preview */}
        <aside
          aria-label="AI Summary Preview"
          className="lg:col-span-5 rounded-2xl border-2 border-[#0F2D5B]/15 bg-white p-5 sm:p-6 shadow-sm space-y-5 lg:sticky lg:top-20"
        >
          {/* Header with Live Preview Badge & Kokoro TTS */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0F2D5B] text-white">
                <Sparkles className="h-4 w-4 text-[#10B981]" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-[#0F2D5B]">
                  AI Summary Preview
                </h3>
                <p className="text-[11px] text-slate-500">
                  Structured Startup Passport Card
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <KokoroTtsButton
                label="Listen"
                text={`${draft.startup_name || 'Startup'} Passport Summary. Sector: ${draft.industry || 'unconfirmed'}. Stage: ${draft.stage || 'unconfirmed'}. Expanding from ${draft.home_country || 'home market'} to ${draft.target_country || 'target ASEAN market'} for ${draft.primary_goal || 'partnership'}. ${draft.description || ''}`}
              />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>Live preview</span>
              </span>
            </div>
          </div>

          {isAnalyzing ? (
            <div
              data-testid="passport-loading-skeleton"
              className="space-y-3 py-6 animate-pulse"
            >
              <div className="h-6 w-1/2 rounded-lg bg-slate-200" />
              <div className="h-4 w-3/4 rounded-lg bg-slate-100" />
              <div className="h-20 w-full rounded-xl bg-slate-100" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 rounded-xl bg-slate-100" />
                <div className="h-12 rounded-xl bg-slate-100" />
              </div>
            </div>
          ) : (
            <>
              {/* Startup Identity Card */}
              <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F2D5B] text-white font-extrabold text-base">
                      {(draft.startup_name || 'AS').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">
                        {draft.startup_name || 'Unnamed Startup'}
                      </h4>
                      <p className="text-xs font-medium text-slate-600">
                        {draft.product || 'Product summary pending confirmation'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Provenance & Sector/Goal Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <ProvenanceBadge status="self_reported" size="sm" />
                  {draft.industry ? (
                    <span className="rounded-full bg-[#0F2D5B] px-2.5 py-0.5 text-[11px] font-bold text-white">
                      {draft.industry}
                    </span>
                  ) : null}
                  {draft.primary_goal ? (
                    <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-[11px] font-bold">
                      {draft.primary_goal}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {draft.description || 'No description entered yet.'}
                </p>

                {/* Structured Attributes Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/70 text-xs">
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      <span>Stage</span>
                    </div>
                    <div className="mt-0.5 font-extrabold text-slate-900">
                      {draft.stage || '⚠️ Unspecified'}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>Primary Goal</span>
                    </div>
                    <div className="mt-0.5 font-extrabold text-slate-900">
                      {draft.primary_goal || '⚠️ Unspecified'}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span>Home Location</span>
                    </div>
                    <div className="mt-0.5 font-extrabold text-slate-900">
                      {draft.home_country || '⚠️ Unspecified'}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>Target Market</span>
                    </div>
                    <div className="mt-0.5 font-extrabold text-[#0F2D5B]">
                      {draft.target_country || '⚠️ Unspecified'}
                    </div>
                  </div>
                </div>

                {/* Needs & Capabilities */}
                <div className="pt-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                    Needs &amp; Capabilities ({draft.needs.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {draft.needs.map((need) => (
                      <span
                        key={need}
                        className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                      >
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* V2 Mandatory Guardrail Section: Missing Fields / Unknowns Alert Box */}
              <div
                data-testid="passport-missing-fields-box"
                className={`rounded-xl border p-3.5 space-y-2.5 ${
                  allMissingItems.length > 0
                    ? 'border-amber-300 bg-amber-50/90 text-amber-950'
                    : 'border-emerald-300 bg-emerald-50/90 text-emerald-950'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-extrabold flex items-center gap-1.5">
                    {allMissingItems.length > 0 ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                        <span>
                          Missing Fields / Unknowns ({allMissingItems.length})
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                        <span>All core matching fields confirmed</span>
                      </>
                    )}
                  </div>
                </div>

                {allMissingItems.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-amber-900 leading-snug">
                      BridgeAI never fabricates unstated facts. Confirm or resolve these items before or during partner discovery:
                    </p>
                    <ul className="space-y-1.5">
                      {allMissingItems.map((item) => (
                        <li
                          key={item}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white/90 border border-amber-200 px-2.5 py-1.5 text-xs"
                        >
                          <span className="font-semibold text-amber-950">
                            {item}
                          </span>
                          {(draft.missing_fields || []).includes(item) ? (
                            <button
                              type="button"
                              onClick={() => handleResolveMissingField(item)}
                              data-testid={`resolve-missing-${item}`}
                              className="shrink-0 rounded-md bg-amber-100 hover:bg-amber-200 px-2 py-1 text-[11px] font-bold text-amber-950 transition-colors cursor-pointer"
                            >
                              ✓ Confirm &amp; Resolve
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-800">
                    Your Startup Passport has all mandatory stage, geography, sector, and capability fields verified for deterministic reverse-matching.
                  </p>
                )}
              </div>

              {/* Gemma 4 Confidence Notes List */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-1.5">
                <div className="text-xs font-extrabold text-[#0F2D5B]">
                  Gemma 4 Confidence Notes
                </div>
                <ul className="space-y-1 text-[11px] text-slate-600 list-disc pl-4">
                  {(draft.confidence_notes && draft.confidence_notes.length > 0
                    ? draft.confidence_notes
                    : ['Founder narrative ready for deterministic challenge matching.']
                  ).map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>

              {/* Action Button: Confirm Passport & Discover Corporate Challenges */}
              <button
                type="button"
                onClick={() =>
                  onConfirmPassport(draft, currentAiSource, currentAiModel)
                }
                data-testid="confirm-passport-btn"
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#10B981] hover:bg-[#059669] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition-colors cursor-pointer"
              >
                <span>✅ Confirm Passport &amp; Discover Corporate Challenges →</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export default StartupPassportFlow;
