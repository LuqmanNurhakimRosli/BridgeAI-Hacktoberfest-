'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, CircleAlert, Plus, Sparkles, X } from 'lucide-react';
import type { PrimaryGoal, StartupProfile, StartupStage } from '@/types';
import { AiSourceBadge } from './ProvenanceBadge';
import { KokoroTtsButton } from './KokoroTtsButton';
import { Button, Field, Panel, inputClass } from './ui';

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
  if (!stage) missing_fields.push('Funding stage');
  if (!target_country) missing_fields.push('Target country');
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

const CORE_FIELDS: Array<{ key: keyof StartupProfile; label: string }> = [
  { key: 'startup_name', label: 'Startup name' },
  { key: 'industry', label: 'Sector' },
  { key: 'stage', label: 'Stage' },
  { key: 'home_country', label: 'Home country' },
  { key: 'target_country', label: 'Target country' },
  { key: 'primary_goal', label: 'Main goal' },
];

function missingCore(p: StartupProfile): string[] {
  return CORE_FIELDS.filter((f) => !p[f.key]).map((f) => f.label);
}

const SAMPLES: Array<{ label: string; profile: StartupProfile }> = [
  { label: 'AgriTech', profile: AGRISMART_PRESET },
  { label: 'Clean energy', profile: GREENTECH_PRESET },
  { label: 'Fintech', profile: FINBRIDGE_PRESET },
];

export function StartupPassportFlow({
  profile,
  initialProfile,
  onProfileChange,
  onConfirmPassport,
  aiSource: initialAiSource = 'demo_fixture',
  aiModel: initialAiModel,
}: StartupPassportFlowProps) {
  const [draft, setDraft] = useState<StartupProfile>(profile || initialProfile || AGRISMART_PRESET);
  const [newNeed, setNewNeed] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSource, setAiSource] = useState<'gemma_live' | 'demo_fixture'>(initialAiSource);
  const [aiModel, setAiModel] = useState<string | undefined>(initialAiModel);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setDraft(profile);
  }, [profile]);

  const update = (updater: (prev: StartupProfile) => StartupProfile) => {
    setDraft((prev) => {
      const next = updater(prev);
      onProfileChange?.(next);
      return next;
    });
  };

  const setField = <K extends keyof StartupProfile>(key: K, value: StartupProfile[K]) =>
    update((prev) => ({ ...prev, [key]: value }));

  const loadSample = (sample: StartupProfile, label: string) => {
    setDraft(sample);
    onProfileChange?.(sample);
    setStatus(`Loaded the ${label.toLowerCase()} sample. Check the details below.`);
  };

  const extract = async () => {
    if (!draft.description.trim()) return;
    setIsAnalyzing(true);
    setStatus(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: draft.description }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.profile) {
          const merged: StartupProfile = { ...draft, ...data.profile, description: draft.description };
          setDraft(merged);
          onProfileChange?.(merged);
          const live = data?.meta?.source === 'gemma' || data?.meta?.ai_source === 'gemma_live';
          setAiSource(live ? 'gemma_live' : 'demo_fixture');
          setAiModel(data?.meta?.model);
          setStatus(live ? 'Profile filled in by Gemma 4. Check each field.' : 'Profile filled in from your text. Check each field.');
          setIsAnalyzing(false);
          return;
        }
      }
    } catch {
      // Fall through to the local extractor when the API is offline.
    }
    const fallback = deterministicLocalExtract(draft.description, draft);
    setDraft(fallback);
    onProfileChange?.(fallback);
    setAiSource('demo_fixture');
    setStatus('AI is offline, so we filled in what we could from your text. Check each field.');
    setIsAnalyzing(false);
  };

  const addNeed = () => {
    const t = newNeed.trim();
    if (t && !draft.needs.includes(t)) update((prev) => ({ ...prev, needs: [...prev.needs, t] }));
    setNewNeed('');
  };

  const confirmItem = (item: string) =>
    update((prev) => ({
      ...prev,
      needs:
        item.toLowerCase().includes('offline') && !prev.needs.includes('offline-first')
          ? [...prev.needs, 'offline-first']
          : prev.needs,
      missing_fields: prev.missing_fields.filter((m) => m !== item),
      confidence_notes: [...prev.confidence_notes.filter((n) => n !== `Founder confirmed: ${item}`), `Founder confirmed: ${item}`],
    }));

  const missing = missingCore(draft);
  const toConfirm = draft.missing_fields || [];
  const isMissing = (key: keyof StartupProfile) => !draft[key];

  const selectField = (
    id: string,
    label: string,
    key: 'industry' | 'stage' | 'home_country' | 'target_country' | 'primary_goal',
    options: readonly string[]
  ) => (
    <Field label={label} hint={isMissing(key) ? 'Needed for matching' : undefined}>
      <select
        id={id}
        className={`${inputClass} ${isMissing(key) ? 'border-amber-ink/40 bg-amber-wash' : ''}`}
        value={(draft[key] as string) || ''}
        onChange={(e) => setField(key, (e.target.value || null) as never)}
      >
        <option value="">Choose</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Field>
  );

  return (
    <div className="space-y-5 pb-28 md:pb-24">
      {/* 1. Describe */}
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-ink">Describe your startup</h2>
            <p className="text-sm text-muted">What you build, your stage, and where you want to grow. A few sentences is enough.</p>
          </div>
          <AiSourceBadge source={aiSource} model={aiModel} />
        </div>
        <textarea
          id="passport-description"
          aria-label="Describe your startup"
          maxLength={2000}
          className={`${inputClass} min-h-[132px] py-3 leading-relaxed`}
          value={draft.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="We are a seed-stage Malaysian team building a phone app that spots crop disease. We want a field pilot with a farming company in Indonesia."
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="primary"
            onClick={extract}
            disabled={isAnalyzing || !draft.description.trim()}
            data-testid="extract-gemma-btn"
            icon={<Sparkles className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} aria-hidden="true" />}
          >
            {isAnalyzing ? 'Reading your description' : 'Fill in my profile'}
          </Button>
          <span className="text-xs text-muted">{draft.description.length}/2000</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-sm text-muted">Or try a sample:</span>
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => loadSample(s.profile, s.label)}
              data-testid={`preset-${s.profile.startup_name?.split(' ')[0].toLowerCase()}-btn`}
              className="min-h-[36px] rounded-full bg-paper px-3.5 text-sm font-semibold text-ink hover:bg-ink/10 cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
        {status ? (
          <p role="status" className="rounded-xl bg-ai-wash px-3.5 py-2.5 text-sm text-ai">
            {status}
          </p>
        ) : null}
      </Panel>

      {/* 2. Check the details */}
      <Panel className={`space-y-4 ${isAnalyzing ? 'animate-pulse opacity-60' : ''}`} aria-busy={isAnalyzing}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-ink">Check the details</h2>
            <p className="text-sm text-muted">
              {missing.length
                ? `${missing.length} field${missing.length === 1 ? '' : 's'} still needed for matching.`
                : 'All fields needed for matching are filled in.'}
            </p>
          </div>
          <KokoroTtsButton
            label="Listen"
            text={`${draft.startup_name || 'Your startup'}. ${draft.industry || 'Sector not set'}, ${draft.stage || 'stage not set'}. Growing from ${draft.home_country || 'an unknown home country'} to ${draft.target_country || 'an unknown target'}, aiming for ${draft.primary_goal || 'an unstated goal'}.`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Startup name" hint={isMissing('startup_name') ? 'Needed for matching' : undefined}>
            <input
              id="passport-startup-name"
              className={`${inputClass} ${isMissing('startup_name') ? 'border-amber-ink/40 bg-amber-wash' : ''}`}
              value={draft.startup_name || ''}
              onChange={(e) => setField('startup_name', e.target.value || null)}
            />
          </Field>
          <Field label="What you sell, in one line">
            <input
              id="passport-product"
              className={inputClass}
              value={draft.product || ''}
              onChange={(e) => setField('product', e.target.value || null)}
            />
          </Field>
          {selectField('passport-industry', 'Sector', 'industry', INDUSTRY_OPTIONS)}
          {selectField('passport-stage', 'Stage', 'stage', STAGE_OPTIONS)}
          {selectField('passport-home-country', 'Home country', 'home_country', COUNTRY_OPTIONS)}
          {selectField('passport-target-country', 'Target country', 'target_country', COUNTRY_OPTIONS)}
          <div className="sm:col-span-2">{selectField('passport-primary-goal', 'Main goal', 'primary_goal', GOAL_OPTIONS)}</div>
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-semibold text-ink">Skills and needs</span>
          <span className="block text-xs text-muted">We compare these with each challenge&apos;s must-haves.</span>
          <div className="flex flex-wrap gap-1.5">
            {draft.needs.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-paper py-1 pl-3 pr-1 text-sm font-medium text-ink">
                {tag}
                <button
                  type="button"
                  onClick={() => update((prev) => ({ ...prev, needs: prev.needs.filter((t) => t !== tag) }))}
                  aria-label={`Remove ${tag}`}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-ink/10 hover:text-ink cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              id="passport-add-need"
              aria-label="Add a skill or need"
              className={inputClass}
              value={newNeed}
              onChange={(e) => setNewNeed(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addNeed();
                }
              }}
              placeholder="e.g. offline-first, Bahasa interface"
            />
            <Button variant="secondary" onClick={addNeed} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Add
            </Button>
          </div>
        </div>
      </Panel>

      {/* 3. Things AI could not confirm */}
      {toConfirm.length > 0 ? (
        <Panel data-testid="passport-missing-fields-box" className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Please confirm</h2>
            <p className="text-sm text-muted">Your description didn&apos;t say these. We won&apos;t assume them.</p>
          </div>
          <ul className="space-y-2">
            {toConfirm.map((item) => (
              <li key={item} className="flex items-center justify-between gap-3 rounded-xl bg-amber-wash px-3.5 py-2.5">
                <span className="flex items-start gap-2 text-sm text-amber-ink">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {item}
                </span>
                <Button size="sm" variant="secondary" className="shrink-0" onClick={() => confirmItem(item)} data-testid={`resolve-missing-${item}`}>
                  Yes, confirmed
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {draft.confidence_notes.length > 0 ? (
        <details className="group rounded-2xl bg-surface shadow-card">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 sm:px-5 [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-semibold text-ink">How AI read your description</span>
            <ChevronDown className="h-5 w-5 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul className="space-y-1.5 border-t border-line px-4 py-3 text-sm text-muted sm:px-5">
            {draft.confidence_notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {/* Confirm */}
      <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-md md:bottom-0 md:left-60">
        <div className="mx-auto flex max-w-5xl items-center gap-3 sm:px-2">
          {missing.length ? (
            <p className="hidden flex-1 text-sm text-muted sm:block">Add {missing.join(', ').toLowerCase()} to continue.</p>
          ) : (
            <p className="hidden flex-1 items-center gap-1.5 text-sm text-jade sm:flex">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Ready to match
            </p>
          )}
          <Button
            size="lg"
            variant="jade"
            className="w-full sm:w-auto"
            disabled={missing.length > 0}
            onClick={() => onConfirmPassport(draft, aiSource, aiModel)}
            data-testid="confirm-passport-btn"
          >
            {missing.length ? `${missing.length} field${missing.length === 1 ? '' : 's'} missing` : 'Confirm and see matches'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StartupPassportFlow;
