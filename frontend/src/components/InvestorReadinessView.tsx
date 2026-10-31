'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ExternalLink, Lock } from 'lucide-react';
import type { DealRoomDocMetadata, ReadinessChecklistItem, StartupProfile } from '@/types';
import { AiSourceBadge, ProvenanceBadge } from './ProvenanceBadge';
import { Chip, FilterChip, Panel } from './ui';

export interface InvestorReadinessViewProps {
  profile?: StartupProfile | null;
  aiSource?: 'gemma_live' | 'demo_fixture';
}

interface WeightedChecklistItem extends ReadinessChecklistItem {
  weight: number;
  checked: boolean;
}

const INITIAL_CHECKLIST_ITEMS: WeightedChecklistItem[] = [
  {
    id: 'CHK-FIN',
    category: 'Financials',
    title: '18-Month Cashflow & Unit Economics Model',
    description:
      'Redacted pilot unit economics, burn rate, and per-hectare / per-site pricing assumptions.',
    status: 'ready',
    verification_note: 'Self-reported founder model (not audited)',
    weight: 20,
    checked: true,
  },
  {
    id: 'CHK-TRAC',
    category: 'Traction & Metrics',
    title: 'Pilot Baseline & Field Validation Telemetry',
    description:
      'Documented precision/recall benchmarks and cooperative letter-of-intent or discovery logs.',
    status: 'ready',
    verification_note: 'Linked to Deal Tracker activity events',
    weight: 20,
    checked: true,
  },
  {
    id: 'CHK-DECK',
    category: 'Product Deck',
    title: 'Cross-Border Problem & 75-Day POC Architecture Deck',
    description:
      'Clear articulation of offline-first workflow, must-have gate coverage, and ASEAN expansion thesis.',
    status: 'ready',
    verification_note: 'Aligned with confirmed Startup Passport',
    weight: 20,
    checked: true,
  },
  {
    id: 'CHK-TEAM',
    category: 'Team Information',
    title: 'Founding Team & Local Execution Bios',
    description:
      'Domain backgrounds in agronomy/ML, Malaysia home base, and Bahasa Indonesia speaking lead.',
    status: 'ready',
    verification_note: 'Founder profile verified locally',
    weight: 18,
    checked: true,
  },
  {
    id: 'CHK-LEGAL',
    category: 'Legal & Governance Docs',
    title: 'Cross-Border IP Assignment, Data Consent & Incorporation Pack',
    description:
      'Foreground/background IP ownership clauses, farm data consent template, and SSM/ACRA certificate.',
    status: 'in_progress',
    verification_note: 'Pending target-market counsel review before paid contract',
    weight: 22,
    checked: false,
  },
];

const INITIAL_DEAL_ROOM_DOCS: Array<
  DealRoomDocMetadata & { sharedDemo: boolean }
> = [
  {
    id: 'DOC-01',
    filename: 'Company Overview Deck',
    category: 'Product Deck',
    access_policy: 'shared_preview',
    verification_status: 'self_reported',
    updated_at: '2026-10-28',
    size_label: '2.4 MB PDF (Metadata Only)',
    security_notice: 'Metadata row only — no binary file stored in public client.',
    sharedDemo: true,
  },
  {
    id: 'DOC-02',
    filename: 'Financial Model (Redacted Summary)',
    category: 'Financials',
    access_policy: 'metadata_only_demo',
    verification_status: 'self_reported',
    updated_at: '2026-10-25',
    size_label: '640 KB XLSX (Metadata Only)',
    security_notice: 'Redacted summary metadata — requires P2 encrypted vault.',
    sharedDemo: true,
  },
  {
    id: 'DOC-03',
    filename: 'Cap Table Structure',
    category: 'Legal & Governance Docs',
    access_policy: 'request_required',
    verification_status: 'self_reported',
    updated_at: '2026-10-19',
    size_policy_note: 'Private by default',
    size_label: '180 KB PDF (Metadata Only)',
    security_notice: 'Private founder governance metadata.',
    sharedDemo: false,
  } as DealRoomDocMetadata & { sharedDemo: boolean; size_policy_note?: string },
  {
    id: 'DOC-04',
    filename: 'Incorporation Certificate',
    category: 'Legal & Governance Docs',
    access_policy: 'request_required',
    verification_status: 'self_reported',
    updated_at: '2026-09-14',
    size_label: '410 KB PDF (Metadata Only)',
    security_notice: 'Entity registration metadata only.',
    sharedDemo: false,
  },
  {
    id: 'DOC-05',
    filename: 'Field Pilot Protocol',
    category: 'Traction & Metrics',
    access_policy: 'shared_preview',
    verification_status: 'self_reported',
    updated_at: '2026-10-30',
    size_label: '520 KB DOCX (Metadata Only)',
    security_notice: '75-day proposed POC evaluation protocol.',
    sharedDemo: true,
  },
];

const SOFT_LANDING_COUNTRIES = [
  'Indonesia',
  'Singapore',
  'Malaysia',
  'Thailand',
  'Vietnam',
] as const;

type SoftLandingCountry = (typeof SOFT_LANDING_COUNTRIES)[number];

const COUNTRY_SOFT_LANDING_GUIDE: Record<
  SoftLandingCountry,
  {
    summary: string;
    entityQuestions: string[];
    privacyQuestions: string[];
    sectorQuestions: string[];
    pilotQuestions: string[];
  }
> = {
  Indonesia: {
    summary:
      'Preparing a 75-day field pilot in Indonesia requires clarifying whether the trial can run under a cross-border B2B testing agreement before incorporating a PT PMA.',
    entityQuestions: [
      'Can the initial 75-day non-commercial POC operate via a cross-border Memorandum of Understanding with the Indonesian corporate partner before establishing a local PT PMA entity?',
      'Which party acts as the importer of record or local field sponsor if hardware sensors or edge devices are tested?',
    ],
    privacyQuestions: [
      'How is explicit farmer/user consent captured in Bahasa Indonesia under Indonesia Personal Data Protection (UU PDP) rules?',
      'Can pilot model inference run on anonymized crop leaf images without transferring personally identifiable farmer records across borders?',
    ],
    sectorQuestions: [
      'Does the agronomic advisory or alternative credit scoring workflow trigger sector-specific Ministry of Agriculture or OJK sandbox registration?',
      'Are local agronomic extension officers reviewing AI recommendations in a human-in-the-loop workflow?',
    ],
    pilotQuestions: [
      'Do field test sites in West Java or Lampung require full offline-first mobile caching for low-connectivity cooperative checkpoints?',
      'What post-POC procurement threshold converts the 75-day trial into a paid commercial roll-out?',
    ],
  },
  Singapore: {
    summary:
      'Singapore serves as a high-trust regional headquarters and urban sandbox hub with strict PDPA and technical telemetry standards.',
    entityQuestions: [
      'Is an ACRA-registered private limited entity required for commercial procurement, or can the initial sandbox run with your existing ASEAN home entity?',
      'Are bilateral cross-border invoicing and withholding tax rules clarified between home entity and Singapore buyer?',
    ],
    privacyQuestions: [
      'Does the pilot telemetry pipeline comply with Singapore PDPA data minimization and purpose limitation requirements?',
      'Are API logs and fleet/enterprise datasets scrubbed of personal identifiers prior to sandbox ingestion?',
    ],
    sectorQuestions: [
      'Does the urban mobility, fintech, or industrial AI workflow require sector sandbox notification (e.g., LTA, MAS, or IMDA AI Verify guidelines)?',
      'What cybersecurity and SOC2 / ISO27001 evidence does enterprise procurement require after pilot completion?',
    ],
    pilotQuestions: [
      'Are SLA latency and uptime targets clearly bounded for the 75-day sandbox window?',
      'Who owns joint benchmark metrics produced during the Singapore commercial pilot?',
    ],
  },
  Malaysia: {
    summary:
      'Malaysia offers industrial decarbonisation, plantation agritech, and Islamic/rural fintech corridors across Selangor, Penang, and Johor.',
    entityQuestions: [
      'Is an SSM-registered Sdn Bhd entity or local distributor partner needed if the pilot converts to a multi-site commercial contract?',
      'How are cross-border service agreements structured for initial 75-day industrial sandbox trials?',
    ],
    privacyQuestions: [
      'Are worker, merchant, or smallholder consent notices aligned with the Malaysia Personal Data Protection Act (PDPA) in Bahasa Melayu and English?',
      'Where are telemetry and operational logs hosted during the pilot evaluation?',
    ],
    sectorQuestions: [
      'For industrial IoTclamp sensors or energy sub-metering, are SIRIM / Suruhanjaya Tenaga safety preconditions applicable?',
      'Are Scope 2 emissions factors aligned with local Malaysian grid reporting standards?',
    ],
    pilotQuestions: [
      'Which 2–3 factory or plantation test sites will serve as the bounded 75-day baseline cohort?',
      'Who signs off on the Day 61–75 Pay/No-Pay conversion review?',
    ],
  },
  Thailand: {
    summary:
      'Thailand combines major retail cold-chain, food processing, and smart logistics demand with PDPA and localized Thai-language operator needs.',
    entityQuestions: [
      'Can the 75-day pilot be executed under a direct corporate innovation testing agreement before Foreign Business Act / BOI entity setup?',
      'Is a local Thai systems integrator or corporate innovation unit co-sponsoring store-level deployment?',
    ],
    privacyQuestions: [
      'Does the pilot data handling protocol comply with Thailand PDPA consent and cross-border transfer safeguards?',
      'Are retail store staff and supply-chain operator interfaces stripped of personal employee tracking?',
    ],
    sectorQuestions: [
      'Are food-safety, cold-chain sensor calibration, or retail ERP webhook security reviews required prior to store testing?',
      'Note: Historical ecosystem programs such as Thailand NIA Global Startup Hub 2026 (closed 15 Mar 2026) are historical references only — verify active corporate budgets independently.',
    ],
    pilotQuestions: [
      'Is a Thai-language staff UI required for Day 26–60 store/warehouse pilot execution?',
      'How is baseline spoilage vs pilot spoilage measured across test stores?',
    ],
  },
  Vietnam: {
    summary:
      'Vietnam features fast-growing Mekong Delta agritech/aquaculture and manufacturing corridors with specific cybersecurity and data localization rules.',
    entityQuestions: [
      'Can the seasonal field trial operate with a local cooperative or corporate innovation host prior to establishing a Vietnamese subsidiary?',
      'How are hardware sensor imports or mobile software trials documented with the local partner?',
    ],
    privacyQuestions: [
      'Does the pilot architecture comply with Vietnam Decree 13 on Personal Data Protection (PDPD) regarding farm/user data?',
      'Can anonymized pond/crop telemetry be processed without storing sensitive personal citizen data?',
    ],
    sectorQuestions: [
      'Are aquaculture water-quality advisories framed as decision-support tools verified by local extension officers?',
      'What local telecommunications (SMS/Zalo) alert integrations are needed for rural pond operators?',
    ],
    pilotQuestions: [
      'How will offline-first sync be validated during seasonal monsoon connectivity drops in the Mekong Delta?',
      'What unit economics per cooperative farm unlock post-pilot commercial licensing?',
    ],
  },
};

const QUESTION_GROUPS: Array<{
  key: 'entityQuestions' | 'privacyQuestions' | 'sectorQuestions' | 'pilotQuestions';
  title: string;
}> = [
  { key: 'entityQuestions', title: 'Company setup' },
  { key: 'privacyQuestions', title: 'Data and privacy' },
  { key: 'sectorQuestions', title: 'Sector rules' },
  { key: 'pilotQuestions', title: 'Running the pilot' },
];

export function InvestorReadinessView({ profile, aiSource = 'demo_fixture' }: InvestorReadinessViewProps) {
  const [checklist, setChecklist] = useState<WeightedChecklistItem[]>(INITIAL_CHECKLIST_ITEMS);
  const [docsReady, setDocsReady] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(INITIAL_DEAL_ROOM_DOCS.map((d) => [d.id, d.sharedDemo]))
  );
  const initialCountry = (SOFT_LANDING_COUNTRIES as readonly string[]).includes(profile?.target_country ?? '')
    ? (profile!.target_country as SoftLandingCountry)
    : 'Indonesia';
  const [country, setCountry] = useState<SoftLandingCountry>(initialCountry);

  const score = useMemo(() => checklist.reduce((sum, item) => sum + (item.checked ? item.weight : 0), 0), [checklist]);
  const guide = COUNTRY_SOFT_LANDING_GUIDE[country];
  const readyDocs = Object.values(docsReady).filter(Boolean).length;

  return (
    <section aria-label="Investor readiness" className="space-y-6">
      {/* Self-assessed readiness */}
      <Panel className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">How ready is {profile?.startup_name || 'your startup'} for investors?</h2>
            <p className="text-sm text-muted">Tick what you already have. This is a self-check, not a rating from BridgeAI.</p>
          </div>
          <AiSourceBadge source={aiSource} />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="tabular text-3xl font-extrabold text-ink">{score}/100</span>
            <span className="text-sm text-muted">ready</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-jade-bright transition-[width]" style={{ width: `${score}%` }} />
          </div>
        </div>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 hover:bg-paper">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() =>
                    setChecklist((prev) =>
                      prev.map((c) =>
                        c.id === item.id ? { ...c, checked: !c.checked, status: c.checked ? 'in_progress' : 'ready' } : c
                      )
                    )
                  }
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-jade)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="text-sm font-semibold text-ink">{item.category}</span>
                    <span className="tabular text-xs text-muted">{item.weight} pts</span>
                  </span>
                  <span className="block text-sm text-ink">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">{item.description}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Documents: readiness only, no file sharing */}
      <Panel className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-ink">Documents investors will ask for</h2>
          <p className="text-sm text-muted">{readyDocs} of {INITIAL_DEAL_ROOM_DOCS.length} ready.</p>
        </div>
        <ul className="divide-y divide-line">
          {INITIAL_DEAL_ROOM_DOCS.map((doc) => (
            <li key={doc.id}>
              <label className="flex min-h-[52px] cursor-pointer items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(docsReady[doc.id])}
                  onChange={() => setDocsReady((prev) => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                  className="h-5 w-5 shrink-0 accent-[var(--color-jade)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{doc.filename}</span>
                  <span className="block text-xs text-muted">{doc.category}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-2 rounded-xl bg-paper p-3 text-xs text-muted">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Document sharing isn&apos;t available yet. BridgeAI only records which documents you have, never the files. Share them
          through your own secure channel for now.
        </p>
      </Panel>

      {/* Market entry questions */}
      <Panel className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Questions before entering a new market</h2>
          <p className="text-sm text-muted">A starting list to take to a local advisor. This is not legal advice.</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Country">
          {SOFT_LANDING_COUNTRIES.map((c) => (
            <FilterChip key={c} active={country === c} onClick={() => setCountry(c)}>
              {c}
            </FilterChip>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-ink">{guide.summary}</p>
        <div className="space-y-2">
          {QUESTION_GROUPS.map((group, i) => (
            <details key={group.key} open={i === 0} className="group rounded-xl border border-line">
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-3.5 [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-semibold text-ink">
                  {group.title} <span className="font-normal text-muted">({guide[group.key].length})</span>
                </span>
                <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <ul className="space-y-2 border-t border-line px-3.5 py-3 text-sm leading-relaxed text-ink">
                {guide[group.key].map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </Panel>

      {/* Sources */}
      <Panel className="space-y-3">
        <h2 className="text-lg font-bold text-ink">Useful sources</h2>
        <ul className="space-y-3">
          <li className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-ink">Startup ASEAN</span>
              <ProvenanceBadge status="verified_public" sourceUrl="https://startup-asean.org/" lastVerifiedAt="2026-10-31" />
            </div>
            <p className="text-sm text-muted">The official regional directory of ASEAN startup programmes and partners.</p>
            <a
              href="https://startup-asean.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[36px] items-center gap-1 text-sm font-semibold text-jade underline-offset-2 hover:underline"
            >
              startup-asean.org
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </li>
          <li className="space-y-1.5 border-t border-line pt-3" data-testid="nia-historical-reference-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-ink">Thailand NIA Global Startup Hub 2026</span>
              <Chip tone="amber">Closed 15 Mar 2026</Chip>
            </div>
            <p className="text-sm text-muted">Listed for background only. Applications are closed, so this is not an open grant.</p>
            <a
              href="https://startupthailand.nia.or.th/ext/globalstartuphub/startup-thailand-2026-en.php"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[36px] items-center gap-1 text-sm font-semibold text-jade underline-offset-2 hover:underline"
            >
              View past programme page
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </Panel>
    </section>
  );
}

export default InvestorReadinessView;
