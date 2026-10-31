'use client';

import React, { useState } from 'react';
import { Check, CircleAlert, Copy, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type {
  POCMilestone,
  POCPlan,
  POCSuccessCriterion,
  ReverseMatch,
  StartupProfile,
} from '@/types';
import { AiSourceBadge } from './ProvenanceBadge';
import { KokoroTtsButton } from './KokoroTtsButton';
import { formatBudgetPill } from './DemandBoard';
import { BackLink, Button, Chip, Field, Panel, RouteRibbon, Segmented, Sheet, inputClass } from './ui';

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

type PlanSection = 'plan' | 'success' | 'questions' | 'message';

const OWNER_LABEL: Record<POCMilestone['owner'], string> = {
  startup: 'you lead',
  partner: 'partner leads',
  joint: 'shared',
};

const OPEN_QUESTIONS = [
  'How will cross-border data and user consent be handled?',
  'Who owns the IP: your model, the field data and any improvements?',
  'Who is responsible for safety and liability during field trials?',
  'Which local rules or import checks apply in the target country?',
  'What results would turn the pilot into a paid contract?',
] as const;

const LANG_CODE: Record<OutreachLanguage, 'en-US' | 'ms-MY' | 'id-ID'> = {
  English: 'en-US',
  'Bahasa Melayu': 'ms-MY',
  'Bahasa Indonesia': 'id-ID',
};

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
  const [section, setSection] = useState<PlanSection>('plan');
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const [lang, setLang] = useState<OutreachLanguage>(plan.outreach_email?.language || 'English');
  const [copied, setCopied] = useState(false);
  const [regenState, setRegenState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [saveOpen, setSaveOpen] = useState(false);
  const [nextActionTitle, setNextActionTitle] = useState(`Book a scoping call with ${match.demand.buyer_name}`);
  const [cadenceDays, setCadenceDays] = useState<30 | 90 | 180>(30);

  const resolvedCount = OPEN_QUESTIONS.filter((q) => resolved[q]).length;
  const wordCount = plan.outreach_email.body.trim().split(/\s+/).filter(Boolean).length;

  const switchLanguage = (next: OutreachLanguage) => {
    setLang(next);
    setPlan((prev) => ({ ...prev, outreach_email: buildOutreachEmailDraft(next, profile, match) }));
    setCopied(false);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard?.writeText(`Subject: ${plan.outreach_email.subject}\n\n${plan.outreach_email.body}`);
    } catch {
      // Clipboard can be blocked; the text stays visible for manual copying.
    }
    setCopied(true);
  };

  const regenerate = async () => {
    setRegenState('loading');
    try {
      const res = await fetch('/api/poc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, demand: match.demand, language: lang }),
      });
      const data = res.ok ? await res.json() : null;
      if (!data?.plan) throw new Error('No plan returned');
      setPlan((prev) => ({
        ...prev,
        ...data.plan,
        outreach_email: data.plan.outreach_email ?? prev.outreach_email,
      }));
      setRegenState('idle');
    } catch {
      setRegenState('error');
    }
  };

  const updateCriterion = (idx: number, field: keyof POCSuccessCriterion, value: string) =>
    setPlan((prev) => {
      const next = [...prev.success_criteria];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, success_criteria: next };
    });

  const updateMilestone = (idx: number, value: string) =>
    setPlan((prev) => {
      const next = [...prev.milestones];
      next[idx] = { ...next[idx], action: value };
      return { ...prev, milestones: next };
    });

  const save = () => {
    onSaveDealWithPoc(match, plan, nextActionTitle.trim() || `Follow up with ${match.demand.buyer_name}`, cadenceDays);
    setSaveOpen(false);
  };

  return (
    <section aria-label="Pilot plan" className="space-y-5 pb-28 md:pb-24">
      <BackLink onClick={onBack}>Challenge details</BackLink>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted">
          <RouteRibbon from={profile.home_country} to={match.demand.country} size="sm" />
          <span>{plan.partner_name}</span>
        </div>
        <h2 className="text-2xl font-bold leading-tight text-ink">{match.demand.title}</h2>
        <div
          data-testid="poc-mandatory-disclaimer-banner"
          className="flex items-start gap-2 rounded-xl bg-amber-wash px-3.5 py-3 text-sm text-amber-ink"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong className="font-bold">Draft for discussion.</strong> This {plan.proposed_duration_days}-day plan is a
            proposal. It is not signed, funded or legally binding.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AiSourceBadge source={plan.ai_source} />
          <Button
            variant="ghost"
            size="sm"
            onClick={regenerate}
            disabled={regenState === 'loading'}
            icon={<RefreshCw className={`h-4 w-4 ${regenState === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" />}
          >
            {regenState === 'loading' ? 'Drafting' : 'Redraft with AI'}
          </Button>
          {regenState === 'error' ? (
            <span role="alert" className="text-sm text-risk">
              Could not redraft. Your edits are kept, so try again in a moment.
            </span>
          ) : null}
        </div>
      </header>

      <div className="sticky top-[61px] z-20 -mx-4 bg-paper/90 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6">
        <Segmented
          label="Plan sections"
          value={section}
          onChange={setSection}
          options={[
            { id: 'plan', label: 'Plan' },
            { id: 'success', label: 'Success' },
            { id: 'questions', label: 'Questions' },
            { id: 'message', label: 'Message' },
          ]}
        />
      </div>

      {section === 'plan' ? (
        <div className="space-y-4">
          <Panel className="space-y-4">
            <Field label="Goal of the pilot">
              <textarea
                className={`${inputClass} min-h-[96px] py-2.5 leading-relaxed [field-sizing:content]`}
                value={plan.objective}
                onChange={(e) => setPlan((prev) => ({ ...prev, objective: e.target.value }))}
              />
            </Field>
            <Field label="Scope and who takes part">
              <textarea
                className={`${inputClass} min-h-[96px] py-2.5 leading-relaxed [field-sizing:content]`}
                value={plan.proposed_scope}
                onChange={(e) => setPlan((prev) => ({ ...prev, proposed_scope: e.target.value }))}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Chip>{plan.target_users_label}</Chip>
              <Chip>{plan.estimated_budget_note}</Chip>
            </div>
            <p data-testid="grant-cofunding-honesty-card" className="text-xs text-muted">
              Grants and co-funding are not guaranteed. Check official programme dates before you budget.
            </p>
          </Panel>

          <Panel>
            <h3 className="text-base font-bold text-ink">Timeline</h3>
            <ol className="mt-4">
              {plan.milestones.map((ms, idx) => (
                <li key={ms.phase} data-testid={`poc-phase-card-${idx + 1}`} className="relative flex gap-3 pb-5 last:pb-0">
                  {idx < plan.milestones.length - 1 ? (
                    <span aria-hidden="true" className="absolute bottom-0 left-[13px] top-7 w-0.5 bg-line" />
                  ) : null}
                  <span className="tabular relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-[15px] font-bold text-ink">
                        {ms.phase.replace(/^Phase \d+:\s*/, '').replace(/\s*\(Days.*\)$/, '')}
                      </span>
                      <span className="text-xs font-semibold text-muted">
                        {ms.window_label}, {OWNER_LABEL[ms.owner]}
                      </span>
                    </div>
                    <textarea
                      aria-label={`What happens in ${ms.window_label}`}
                      className={`${inputClass} min-h-[72px] py-2 text-sm leading-relaxed [field-sizing:content]`}
                      value={ms.action}
                      onChange={(e) => updateMilestone(idx, e.target.value)}
                    />
                    {ms.deliverables.length > 0 ? (
                      <ul className="space-y-1 text-sm text-muted">
                        {ms.deliverables.map((d) => (
                          <li key={d} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jade" aria-hidden="true" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel>
            <h3 className="text-base font-bold text-ink">If it works</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{plan.possible_conversion_to_paid}</p>
          </Panel>
        </div>
      ) : null}

      {section === 'success' ? (
        <Panel className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-ink">How you will measure success</h3>
              <p className="text-sm text-muted">Agree these with the partner before the pilot starts.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() =>
                setPlan((prev) => ({
                  ...prev,
                  success_criteria: [...prev.success_criteria, { metric: '', target: '', validation_method: '' }],
                }))
              }
            >
              Add
            </Button>
          </div>
          <ul className="space-y-3">
            {plan.success_criteria.map((c, idx) => (
              <li key={idx} className="space-y-2 rounded-xl border border-line p-3">
                <div className="flex items-center gap-2">
                  <input
                    aria-label={`Measure ${idx + 1}`}
                    placeholder="What you will measure"
                    className={`${inputClass} font-semibold`}
                    value={c.metric}
                    onChange={(e) => updateCriterion(idx, 'metric', e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={`Remove measure ${idx + 1}`}
                    onClick={() =>
                      setPlan((prev) => ({ ...prev, success_criteria: prev.success_criteria.filter((_, i) => i !== idx) }))
                    }
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-risk-wash hover:text-risk cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    aria-label={`Target for measure ${idx + 1}`}
                    placeholder="Target"
                    className={`${inputClass} text-sm`}
                    value={c.target}
                    onChange={(e) => updateCriterion(idx, 'target', e.target.value)}
                  />
                  <input
                    aria-label={`How measure ${idx + 1} is checked`}
                    placeholder="How it is checked"
                    className={`${inputClass} text-sm`}
                    value={c.validation_method}
                    onChange={(e) => updateCriterion(idx, 'validation_method', e.target.value)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {section === 'questions' ? (
        <Panel className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-ink">Questions to resolve before the pilot starts</h3>
            <p className="text-sm text-muted">
              {resolvedCount} of {OPEN_QUESTIONS.length} answered. Get legal advice where you need it; BridgeAI does not give it.
            </p>
          </div>
          <ul className="space-y-2">
            {OPEN_QUESTIONS.map((q) => (
              <li key={q}>
                <label className="flex min-h-[52px] cursor-pointer items-start gap-3 rounded-xl border border-line p-3 hover:bg-paper">
                  <input
                    type="checkbox"
                    checked={Boolean(resolved[q])}
                    onChange={() => setResolved((prev) => ({ ...prev, [q]: !prev[q] }))}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-jade)]"
                  />
                  <span className={`text-sm leading-snug ${resolved[q] ? 'text-muted line-through' : 'text-ink'}`}>{q}</span>
                </label>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {section === 'message' ? (
        <Panel className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-ink">First message to {plan.partner_name}</h3>
            <p className="text-sm text-muted">Short and non-binding. Edit it, then paste it into your own email.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['English', 'Bahasa Melayu', 'Bahasa Indonesia'] as OutreachLanguage[]).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => switchLanguage(l)}
                data-testid={`outreach-lang-${l}`}
                className={`min-h-[40px] rounded-full px-4 text-sm font-semibold cursor-pointer ${
                  lang === l ? 'bg-ink text-white' : 'bg-paper text-ink hover:bg-ink/10'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <Field label="Subject">
            <input
              className={inputClass}
              value={plan.outreach_email.subject}
              onChange={(e) =>
                setPlan((prev) => ({ ...prev, outreach_email: { ...prev.outreach_email, subject: e.target.value } }))
              }
            />
          </Field>
          <Field label="Message" hint={`${wordCount} words. Keep it under 180.`}>
            <textarea
              className={`${inputClass} min-h-[220px] py-2.5 leading-relaxed`}
              value={plan.outreach_email.body}
              onChange={(e) =>
                setPlan((prev) => ({ ...prev, outreach_email: { ...prev.outreach_email, body: e.target.value } }))
              }
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={copyMessage}
              data-testid="copy-outreach-draft-btn"
              icon={
                copied ? <Check className="h-4 w-4 text-jade" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />
              }
            >
              {copied ? 'Copied' : 'Copy message'}
            </Button>
            <KokoroTtsButton
              label="Listen"
              lang={LANG_CODE[lang]}
              text={`${plan.outreach_email.subject}. ${plan.outreach_email.body}`}
              size="md"
            />
          </div>
          {copied ? (
            <p role="status" data-testid="copy-outreach-toast" className="text-sm text-muted">
              Copied. This does not mark the deal as contacted. Update the stage yourself once you send it.
            </p>
          ) : null}
        </Panel>
      ) : null}

      <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-md md:bottom-0 md:left-60">
        <div className="mx-auto max-w-5xl sm:px-2">
          <Button block size="lg" variant="jade" onClick={() => setSaveOpen(true)} data-testid="save-deal-with-poc-btn">
            Save plan to deals
          </Button>
        </div>
      </div>

      <Sheet
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save plan to deals"
        description={`${plan.partner_name} will be added to your deals with a reminder. Nothing is sent to them.`}
        footer={
          <Button block size="lg" variant="jade" onClick={save}>
            Save plan
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Your next step">
            <input className={inputClass} value={nextActionTitle} onChange={(e) => setNextActionTitle(e.target.value)} />
          </Field>
          <div className="space-y-1.5">
            <span className="block text-sm font-semibold text-ink">Remind me in</span>
            <Segmented
              label="Reminder"
              value={String(cadenceDays) as '30' | '90' | '180'}
              onChange={(v) => setCadenceDays(Number(v) as 30 | 90 | 180)}
              options={[
                { id: '30', label: '30 days' },
                { id: '90', label: '90 days' },
                { id: '180', label: '180 days' },
              ]}
            />
          </div>
        </div>
      </Sheet>
    </section>
  );
}

export default PilotPlanEditor;
