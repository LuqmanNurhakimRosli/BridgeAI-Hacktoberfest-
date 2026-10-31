'use client';

import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  FileText,
  Lock,
  Unlock,
  Globe2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Scale,
  Database,
  Compass,
} from 'lucide-react';
import type {
  DealRoomDocMetadata,
  ReadinessChecklistItem,
  StartupProfile,
} from '@/types';
import { AiSourceBadge, ProvenanceBadge } from './ProvenanceBadge';
import { getCountryFlag } from './DemandBoard';

export interface InvestorReadinessViewProps {
  profile?: StartupProfile | null;
  aiSource?: 'gemma_live' | 'demo_fixture';
}

type ReadinessTab = 'deal_room' | 'soft_landing';

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

export function InvestorReadinessView({
  profile,
  aiSource = 'demo_fixture',
}: InvestorReadinessViewProps) {
  const [activeTab, setActiveTab] = useState<ReadinessTab>('deal_room');
  const [checklist, setChecklist] = useState<WeightedChecklistItem[]>(
    INITIAL_CHECKLIST_ITEMS
  );
  const [docs, setDocs] = useState(INITIAL_DEAL_ROOM_DOCS);
  const [selectedCountry, setSelectedCountry] =
    useState<SoftLandingCountry>('Indonesia');

  // Dynamic score calculation: 4 initial items checked = 20 + 20 + 20 + 18 = 78/100!
  const readinessScore = useMemo(() => {
    return checklist.reduce(
      (sum, item) => sum + (item.checked ? item.weight : 0),
      0
    );
  }, [checklist]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextChecked = !item.checked;
        return {
          ...item,
          checked: nextChecked,
          status: nextChecked ? 'ready' : 'in_progress',
        };
      })
    );
  };

  const toggleDocShared = (docId: string) => {
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              sharedDemo: !doc.sharedDemo,
              access_policy: !doc.sharedDemo
                ? 'shared_preview'
                : 'request_required',
            }
          : doc
      )
    );
  };

  // Circular SVG score ring geometry
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.max(0, Math.min(100, readinessScore)) / 100) * circumference;

  const currentGuide = COUNTRY_SOFT_LANDING_GUIDE[selectedCountry];

  return (
    <section
      aria-label="Investor Readiness and ASEAN Market Soft-Landing"
      className="mx-auto max-w-6xl space-y-6 pb-20"
    >
      {/* Top Header & Tab Switcher */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 border border-violet-200 px-3 py-1 text-xs font-bold text-violet-900">
                <ShieldCheck className="h-3.5 w-3.5 text-[#8B5CF6]" />
                <span>P1 Capital &amp; Cross-Border Market Readiness</span>
              </span>
              <AiSourceBadge source={aiSource} size="sm" />
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[#0F2D5B] sm:text-2xl">
              Investor Readiness &amp; ASEAN Soft-Landing Workspace
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-600">
              Prepare diligence metadata for{" "}
              <strong className="text-slate-900">
                {profile?.startup_name || 'AgriSmart'}
              </strong>{" "}
              and review source-backed regulatory questions before pilot deployment.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div
          role="tablist"
          aria-label="Readiness and Soft-Landing Tabs"
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5 border border-slate-200"
        >
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'deal_room'}
            onClick={() => setActiveTab('deal_room')}
            data-testid="tab-investor-readiness"
            className={`min-h-[44px] rounded-lg px-4 py-2.5 text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              activeTab === 'deal_room'
                ? 'bg-[#0F2D5B] text-white shadow-xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            Investor Readiness &amp; Safe Deal Room (P1 Mock)
          </button>

          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'soft_landing'}
            onClick={() => setActiveTab('soft_landing')}
            data-testid="tab-soft-landing"
            className={`min-h-[44px] rounded-lg px-4 py-2.5 text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              activeTab === 'soft_landing'
                ? 'bg-[#10B981] text-slate-950 shadow-xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            ASEAN Market Soft-Landing Checklist (P1)
          </button>
        </div>
      </div>

      {/* TAB A: Investor Readiness & Safe Deal Room (P1 Mock) */}
      <div
        data-testid="panel-investor-readiness"
        className={activeTab === 'deal_room' ? 'space-y-6' : 'hidden'}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Circular SVG Score Ring + 5 Interactive Readiness Checklist Categories */}
          <div className="lg:col-span-7 space-y-5">
            {/* Score Ring Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center gap-6">
              <div className="relative h-36 w-36 shrink-0 flex items-center justify-center">
                <svg
                  className="h-36 w-36 -rotate-90 transform"
                  viewBox="0 0 120 120"
                  role="img"
                  aria-label={`Readiness Score ${readinessScore}/100`}
                >
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke="#E2E8F0"
                    strokeWidth="10"
                    fill="transparent"
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
                  <span
                    data-testid="readiness-score-value"
                    className="text-2xl font-extrabold text-[#0F2D5B]"
                  >
                    {`${readinessScore}/100`}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Readiness Score
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                  Self-Assessed Diligence Completeness
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {readinessScore >= 90
                    ? 'Diligence Pack Complete for Seed / Pilot Review'
                    : 'Strong Pilot Readiness — 1 Legal/Governance Item Pending'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Check or uncheck categories below to dynamically recalculate your readiness score. Scores reflect documented preparation items, not an investment guarantee.
                </p>
              </div>
            </div>

            {/* 5 Interactive Readiness Checklist Categories */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#0F2D5B]">
                  Readiness Checklist (5 Diligence Categories)
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {checklist.filter((c) => c.checked).length} / {checklist.length} Ready
                </span>
              </div>

              <div className="space-y-3">
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    data-testid={`readiness-category-${item.category}`}
                    className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                      item.checked
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-amber-200 bg-amber-50/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#10B981]"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F2D5B]">
                            {item.category}
                          </span>
                          <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                            +{item.weight} pts
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          {item.title}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        item.checked
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {item.checked ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                          <span>Ready</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5 text-amber-700" />
                          <span>In Progress</span>
                        </>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): AI Tips to Improve Readiness + Deal Room Metadata Vault */}
          <div className="lg:col-span-5 space-y-5">
            {/* AI Tips to Improve Readiness (Prompt K) */}
            <div className="rounded-2xl border border-violet-200/90 bg-gradient-to-br from-white via-violet-50/40 to-indigo-50/30 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 border border-violet-200 px-3 py-1 text-xs font-bold text-violet-900">
                  <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
                  <span>AI Tips to Improve Readiness</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Gemma 4 Prompt K
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                <li className="rounded-xl border border-violet-200/70 bg-white p-3">
                  <strong className="text-[#0F2D5B]">
                    1. Resolve Cross-Border IP &amp; Data Consent (+22 pts):
                  </strong>{' '}
                  Add a 1-page annex clarifying that pre-existing leaf-disease model weights remain startup background IP while field validation metrics are shared jointly.
                </li>
                <li className="rounded-xl border border-violet-200/70 bg-white p-3">
                  <strong className="text-[#0F2D5B]">
                    2. Document Offline Field Telemetry:
                  </strong>{' '}
                  Attach benchmark logs demonstrating mobile queue sync under low-connectivity West Java cooperative conditions.
                </li>
                <li className="rounded-xl border border-violet-200/70 bg-white p-3">
                  <strong className="text-[#0F2D5B]">
                    3. Convert 75-Day POC Criteria into Unit Economics:
                  </strong>{' '}
                  Show how passing the Day 61–75 Pay/No-Pay review translates into annual per-cooperative licensing revenue.
                </li>
              </ul>
            </div>

            {/* Deal Room / Safe Document Metadata Vault (Demo Mock) */}
            <div
              data-testid="safe-deal-room-vault"
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4"
            >
              <div>
                <h3 className="flex items-center gap-2 text-base font-extrabold text-[#0F2D5B]">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>Deal Room / Safe Document Metadata Vault (Demo Mock)</span>
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Toggle visibility states between <code>Shared (Demo)</code> and <code>Private</code> metadata records.
                </p>
              </div>

              {/* Explicit Security Boundary Notice (Verbatim per Rule #14 & Brief) */}
              <div
                data-testid="security-boundary-rule14"
                className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs font-semibold text-amber-950 leading-relaxed flex items-start gap-2"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <span>
                  Security Boundary (Rule #14): Prototype tracks document readiness metadata only. Real investor data rooms require P2 authenticated encrypted storage.
                </span>
              </div>

              <ul className="space-y-2.5">
                {docs.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {doc.filename}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {doc.category} · {doc.size_label}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleDocShared(doc.id)}
                      data-testid={`toggle-doc-${doc.id}`}
                      className={`min-h-[36px] shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                        doc.sharedDemo
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                          : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      {doc.sharedDemo ? (
                        <>
                          <Unlock className="h-3 w-3 text-emerald-700" />
                          <span>Shared (Demo)</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 text-slate-500" />
                          <span>Private</span>
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* TAB B: ASEAN Market Soft-Landing Checklist (P1) (Section 26.2) */}
      <div
        data-testid="panel-soft-landing"
        className={activeTab === 'soft_landing' ? 'space-y-6' : 'hidden'}
      >
        {/* Country Selector Bar */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-[#0F2D5B]">
                <Globe2 className="h-5 w-5 text-[#10B981]" />
                <span>ASEAN Market Soft-Landing Checklist (Section 26.2)</span>
              </h3>
              <p className="text-xs text-slate-600">
                Select a destination ASEAN country to inspect source-backed regulatory, entity, and pilot preparation questions.
              </p>
            </div>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-900">
              Non-Legal Preparation Checklist — Verify with Local Counsel
            </span>
          </div>

          <div
            role="group"
            aria-label="Soft-Landing Country Selector"
            className="flex flex-wrap gap-2"
          >
            {SOFT_LANDING_COUNTRIES.map((country) => {
              const active = selectedCountry === country;
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => setSelectedCountry(country)}
                  data-testid={`soft-landing-country-${country}`}
                  className={`min-h-[42px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
                    active
                      ? 'bg-[#0F2D5B] text-white shadow-xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{getCountryFlag(country)}</span>
                  <span>{country}</span>
                </button>
              );
            })}
          </div>

          <p className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <strong className="text-[#0F2D5B]">
              {getCountryFlag(selectedCountry)} {selectedCountry} Soft-Landing Focus:
            </strong>{' '}
            {currentGuide.summary}
          </p>
        </div>

        {/* 4 Preparation Question Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#0F2D5B]">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <span>Entity &amp; Local Establishment Questions</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
              {currentGuide.entityQuestions.map((q, idx) => (
                <li
                  key={idx}
                  className="rounded-xl bg-slate-50 p-3 border border-slate-100"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#0F2D5B]">
              <Database className="h-4 w-4 text-emerald-600" />
              <span>Cross-Border Data &amp; Privacy Checks</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
              {currentGuide.privacyQuestions.map((q, idx) => (
                <li
                  key={idx}
                  className="rounded-xl bg-slate-50 p-3 border border-slate-100"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#0F2D5B]">
              <Scale className="h-4 w-4 text-amber-600" />
              <span>Sector Regulatory Questions</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
              {currentGuide.sectorQuestions.map((q, idx) => (
                <li
                  key={idx}
                  className="rounded-xl bg-slate-50 p-3 border border-slate-100"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-extrabold text-[#0F2D5B]">
              <Compass className="h-4 w-4 text-violet-600" />
              <span>Local Pilot &amp; Distribution Questions</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
              {currentGuide.pilotQuestions.map((q, idx) => (
                <li
                  key={idx}
                  className="rounded-xl bg-slate-50 p-3 border border-slate-100"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Official Public Reference Links & Handover Rule Compliance */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h4 className="text-base font-extrabold text-[#0F2D5B]">
              Official Public Ecosystem References &amp; Programme Status
            </h4>
            <p className="text-xs text-slate-600">
              Verified public portals are cited with explicit status labels. Closed historical windows are never presented as active grants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reference 1: Startup ASEAN Public Portal */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#0F2D5B]">
                    Startup ASEAN Public Portal
                  </span>
                  <ProvenanceBadge
                    status="verified_public"
                    sourceUrl="https://startup-asean.org/"
                    lastVerifiedAt="2026-10-31"
                  />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Official regional ASEAN startup ecosystem directory and policy reference portal.
                </p>
              </div>
              <a
                href="https://startup-asean.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
              >
                <span>Open https://startup-asean.org/</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Reference 2: Thailand NIA Global Startup Hub 2026 (Historical Reference) */}
            <div
              data-testid="nia-historical-reference-card"
              className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900">
                    Thailand NIA Global Startup Hub 2026
                  </span>
                  <span className="inline-flex items-center rounded-full border border-amber-400 bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-950">
                    Historical Reference — Application window closed 15 Mar 2026
                  </span>
                </div>
                <p className="text-xs text-amber-950/90 leading-relaxed">
                  Cited strictly as historical Thailand soft-landing programme context. Not an active grant or open cohort window.
                </p>
              </div>
              <a
                href="https://startupthailand.nia.or.th/ext/globalstartuphub/startup-thailand-2026-en.php"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 underline hover:text-amber-950"
              >
                <span>Inspect Historical Programme Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InvestorReadinessView;
