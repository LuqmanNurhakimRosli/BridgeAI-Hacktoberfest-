'use client';

import React from 'react';
import { Briefcase, Compass, Home, PlayCircle, UserRound } from 'lucide-react';
import type { StartupProfile } from '@/types';
import { AiSourceBadge } from './ProvenanceBadge';
import { RouteRibbon } from './ui';

export type NavTab = 'home' | 'discover' | 'deals' | 'profile';

export interface AppShellProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  /** Overrides the header title for sub-screens (e.g. a challenge detail). */
  title?: string;
  activeDealsCount?: number;
  aiSource?: 'gemma_live' | 'demo_fixture';
  aiModel?: string;
  profile?: StartupProfile | null;
  onRunGoldenPath?: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  title: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}> = [
  { id: 'home', label: 'Home', title: 'Home', icon: Home },
  { id: 'discover', label: 'Discover', title: 'Discover challenges', icon: Compass },
  { id: 'deals', label: 'Deals', title: 'My deals', icon: Briefcase },
  { id: 'profile', label: 'Profile', title: 'Startup profile', icon: UserRound },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
        <span className="absolute left-1.5 right-1.5 top-1/2 border-t-2 border-dashed border-white/50" />
        <span className="absolute right-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-jade-bright" />
      </span>
      {compact ? null : <span className="text-lg font-extrabold tracking-tight text-ink">BridgeAI</span>}
    </span>
  );
}

export function AppShell({
  activeTab,
  onNavigate,
  title,
  activeDealsCount = 0,
  aiSource = 'demo_fixture',
  aiModel,
  profile,
  onRunGoldenPath,
  children,
}: AppShellProps) {
  const current = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];
  const startupName = profile?.startup_name || 'Your startup';

  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden bg-paper md:flex-row">
      {/* Desktop sidebar */}
      <aside
        aria-label="Primary"
        className="hidden select-none border-r border-line bg-surface md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:justify-between"
      >
        <div className="space-y-6 p-4">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center rounded-lg p-1 cursor-pointer"
            aria-label="BridgeAI home"
          >
            <BrandMark />
          </button>

          <nav className="space-y-1" aria-label="Main sections">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  data-testid={`sidebar-nav-${item.id}`}
                  className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors cursor-pointer ${
                    active ? 'bg-ink text-white' : 'text-muted hover:bg-paper hover:text-ink'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? 'text-jade-bright' : ''}`} aria-hidden />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.id === 'deals' && activeDealsCount > 0 ? (
                    <span
                      className={`tabular rounded-full px-2 py-0.5 text-xs font-bold ${
                        active ? 'bg-white/15 text-white' : 'bg-paper text-ink'
                      }`}
                    >
                      {activeDealsCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-line p-4">
          {onRunGoldenPath ? (
            <button
              type="button"
              onClick={onRunGoldenPath}
              data-testid="sidebar-golden-path-btn"
              className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-jade hover:bg-jade-wash cursor-pointer"
            >
              <PlayCircle className="h-[18px] w-[18px]" aria-hidden="true" />
              Run guided demo
            </button>
          ) : null}
          <p className="px-3 text-xs leading-relaxed text-muted">
            Challenges here are sample data. Anything you save stays in this browser.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 max-w-full flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="shrink-0 rounded-lg md:hidden cursor-pointer"
                aria-label="BridgeAI home"
              >
                <BrandMark compact />
              </button>
              <h1 className="truncate text-base font-bold text-ink sm:text-lg">{title ?? current.title}</h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden sm:inline-flex">
                <AiSourceBadge source={aiSource} model={aiModel} />
              </span>
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                data-testid="founder-profile-pill"
                title={`${startupName}: view or edit your startup profile`}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-surface px-3 shadow-card hover:bg-paper cursor-pointer"
              >
                <span className="hidden max-w-[120px] truncate text-sm font-semibold text-ink sm:inline">
                  {startupName}
                </span>
                <RouteRibbon from={profile?.home_country} to={profile?.target_country} size="sm" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pt-6 md:pb-10">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav
          aria-label="Main sections"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
          <div className="grid grid-cols-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  data-testid={`mobile-nav-${item.id}`}
                  className={`relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer ${
                    active ? 'text-ink' : 'text-muted'
                  }`}
                >
                  {active ? (
                    <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-jade-bright" />
                  ) : null}
                  <span className="relative">
                    <Icon className="h-[22px] w-[22px]" aria-hidden />
                    {item.id === 'deals' && activeDealsCount > 0 ? (
                      <span className="tabular absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
                        {activeDealsCount}
                      </span>
                    ) : null}
                  </span>
                  {item.label}
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
