'use client';

import React from 'react';
import {
  Home,
  Sparkles,
  Target,
  Briefcase,
  BarChart3,
  ShieldCheck,
  Rocket,
  Globe2,
} from 'lucide-react';
import type { StartupProfile } from '@/types';
import { AiSourceBadge } from './ProvenanceBadge';

export type NavTab =
  | 'home'
  | 'passport'
  | 'challenges'
  | 'deals'
  | 'insights'
  | 'readiness';

export interface AppShellProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  matchedDemandsCount?: number;
  activeDealsCount?: number;
  aiSource?: 'gemma_live' | 'demo_fixture';
  aiModel?: string;
  profile?: StartupProfile | null;
  onRunGoldenPath?: () => void;
  children: React.ReactNode;
}

const COUNTRY_CODE_MAP: Record<string, string> = {
  malaysia: 'MY',
  indonesia: 'ID',
  singapore: 'SG',
  thailand: 'TH',
  vietnam: 'VN',
  philippines: 'PH',
  brunei: 'BN',
  cambodia: 'KH',
  laos: 'LA',
  myanmar: 'MM',
};

function toCountryCode(country?: string | null, fallback = 'ASEAN'): string {
  if (!country) return fallback;
  const trimmed = country.trim();
  const mapped = COUNTRY_CODE_MAP[trimmed.toLowerCase()];
  if (mapped) return mapped;
  return trimmed.length <= 4 ? trimmed.toUpperCase() : trimmed.slice(0, 2).toUpperCase();
}

const VIEW_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  home: {
    title: 'ASEAN Opportunity Gateway',
    subtitle: 'Demand-to-Deal Operating System · Cross-Border Commercialization',
  },
  passport: {
    title: 'AI Startup Passport',
    subtitle: 'Structured Founder Profile, Missing-Field Audit & Gemma 4 Extraction',
  },
  challenges: {
    title: 'Challenges & Demand Board',
    subtitle: 'Deterministic Hard-Gate Reverse Matching + Grounded Fit Intelligence',
  },
  deals: {
    title: 'Deal Tracker & CRM',
    subtitle: 'Human-Confirmed Stage Transitions, 75-Day POCs & Follow-up Cadence',
  },
  insights: {
    title: 'Outcome Analytics',
    subtitle: 'Honest Denominators & Strict Cohort Separation (Local vs Synthetic Demo)',
  },
  readiness: {
    title: 'Investor Readiness & ASEAN Soft-Landing (P1)',
    subtitle: 'Document Metadata Checklist & Country Regulatory Preparation Questions',
  },
};

export function AppShell({
  activeTab,
  onNavigate,
  matchedDemandsCount = 8,
  activeDealsCount = 0,
  aiSource = 'demo_fixture',
  aiModel,
  profile,
  onRunGoldenPath,
  children,
}: AppShellProps) {
  const desktopNavItems: Array<{
    id: NavTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    isP1?: boolean;
  }> = [
    {
      id: 'home',
      label: 'Home Gateway',
      shortLabel: 'Home',
      icon: Home,
    },
    {
      id: 'passport',
      label: 'AI Startup Passport',
      shortLabel: 'Passport',
      icon: Sparkles,
    },
    {
      id: 'challenges',
      label: 'Challenges & Demand',
      shortLabel: 'Challenges',
      icon: Target,
      badge: matchedDemandsCount,
    },
    {
      id: 'deals',
      label: 'Deal Tracker & CRM',
      shortLabel: 'Deals',
      icon: Briefcase,
      badge: activeDealsCount,
    },
    {
      id: 'insights',
      label: 'Outcome Analytics',
      shortLabel: 'Insights',
      icon: BarChart3,
    },
    {
      id: 'readiness',
      label: 'Investor Readiness (P1)',
      shortLabel: 'Readiness',
      icon: ShieldCheck,
      isP1: true,
    },
  ];

  const mobileBottomTabs = desktopNavItems.slice(0, 5);
  const currentView = VIEW_TITLES[activeTab] ?? VIEW_TITLES.home;

  const startupName = profile?.startup_name || 'AgriSmart';
  const homeCode = toCountryCode(profile?.home_country, 'MY');
  const targetCode = toCountryCode(profile?.target_country, 'ID');
  const founderPillLabel = `${startupName} Founder · ${homeCode} → ${targetCode}`;

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row">
      {/* Desktop Persistent Left Sidebar */}
      <aside
        aria-label="Primary Sidebar Navigation"
        className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:justify-between border-r border-slate-200/90 bg-white shadow-xs select-none"
      >
        <div className="p-5 space-y-6">
          {/* Brand Logo & Tagline */}
          <div className="space-y-1.5 border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-left group focus:outline-none"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F2D5B] text-white shadow-xs">
                <Globe2 className="h-5 w-5 text-[#10B981]" />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight leading-none">
                  <span className="text-[#0F2D5B]">Bridge</span>
                  <span className="text-[#10B981]">AI</span>
                  <span className="ml-1.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#0F2D5B] align-middle">
                    ASEAN V2
                  </span>
                </div>
              </div>
            </button>
            <p className="text-[11px] font-medium text-slate-500 leading-snug">
              Connect · Collaborate · Commercialise for a Stronger ASEAN
            </p>
          </div>

          {/* Desktop 6 Navigation Items */}
          <nav className="space-y-1" aria-label="Main sections">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  data-testid={`sidebar-nav-${item.id}`}
                  className={`w-full min-h-[44px] flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#0F2D5B] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#0F2D5B]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-[#10B981]' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {typeof item.badge === 'number' ? (
                    <span
                      className={`ml-auto inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                        isActive
                          ? 'bg-[#10B981] text-slate-950'
                          : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : item.isP1 ? (
                    <span
                      className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-violet-100 text-violet-800'
                      }`}
                    >
                      P1
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Quick Golden Path Trigger & Compliance Notice */}
        <div className="p-4 space-y-3 border-t border-slate-100 bg-slate-50/70">
          {onRunGoldenPath ? (
            <button
              type="button"
              onClick={onRunGoldenPath}
              data-testid="sidebar-golden-path-btn"
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#10B981] hover:bg-[#059669] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Rocket className="h-4 w-4 shrink-0" />
              <span>Golden Path Demo (1-Click)</span>
            </button>
          ) : null}

          <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 p-2.5 text-[11px] text-amber-950 leading-relaxed">
            <div className="font-bold text-amber-900 flex items-center gap-1">
              <span>🛡️ Synthetic Demo &amp; Local-Only Storage</span>
            </div>
            <p className="mt-0.5 text-amber-800/95">
              Seed challenges are synthetic evaluation records. Deals &amp; edits persist locally in this browser—no unverified claims or live grants.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Top Responsive Header Bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-3.5 py-2.5 sm:px-6 sm:py-3">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
            {/* Mobile Brand + View Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="md:hidden inline-flex items-center gap-1.5 rounded-lg bg-[#0F2D5B] px-2.5 py-1.5 text-xs font-extrabold text-white shrink-0 min-h-[38px]"
                aria-label="BridgeAI Home"
              >
                <span>Bridge</span>
                <span className="text-[#10B981]">AI</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-[#0F2D5B] truncate">
                  {currentView.title}
                </h1>
                <p className="hidden sm:block text-xs text-slate-500 truncate">
                  {currentView.subtitle}
                </p>
              </div>
            </div>

            {/* Right Controls: AI Source Badge, Mobile Investor Readiness Button, Founder Profile Pill */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <AiSourceBadge source={aiSource} model={aiModel} size="sm" />

              {/* Mobile Quick Button to open Investor Readiness (P1) */}
              <button
                type="button"
                onClick={() => onNavigate('readiness')}
                data-testid="mobile-readiness-btn"
                className={`md:hidden min-h-[38px] inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  activeTab === 'readiness'
                    ? 'border-[#0F2D5B] bg-[#0F2D5B] text-white'
                    : 'border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Investor Readiness (P1)</span>
              </button>

              {/* Founder Profile Pill */}
              <button
                type="button"
                onClick={() => onNavigate('passport')}
                data-testid="founder-profile-pill"
                title="View or edit Startup Passport"
                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-[#F1F5F9] hover:bg-slate-200/70 px-3 py-1 text-xs font-semibold text-[#0F2D5B] transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                <span className="truncate max-w-[180px] sm:max-w-none">
                  {founderPillLabel}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 py-4 sm:px-6 sm:py-6 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (5 Tabs, min-h-[60px], 44px+ touch targets) */}
        <nav
          aria-label="Mobile Bottom Navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg"
        >
          <div className="grid grid-cols-5 min-h-[60px] px-1 py-1">
            {mobileBottomTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  data-testid={`mobile-nav-${item.id}`}
                  className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-semibold transition-colors ${
                    isActive
                      ? 'text-[#0F2D5B] bg-slate-100/90'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`h-5 w-5 ${
                        isActive ? 'text-[#10B981]' : 'text-slate-500'
                      }`}
                    />
                    {typeof item.badge === 'number' && item.badge > 0 ? (
                      <span className="absolute -top-1.5 -right-3 inline-flex min-w-[16px] h-4 items-center justify-center rounded-full bg-[#0F2D5B] px-1 text-[9px] font-bold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="truncate max-w-full leading-tight">
                    {item.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default AppShell;
