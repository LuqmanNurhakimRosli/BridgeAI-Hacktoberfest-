'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Rocket, X } from 'lucide-react';
import type {
  Deal,
  DealState,
  DemandBrief,
  POCPlan,
  ReverseMatch,
  StartupProfile,
} from '@/types';
import demandBriefsData from '@/data/demand-briefs.json';
import { rankDemandMatches } from '@/lib/demand-matcher';
import { toRequestProfile } from '@/lib/contract';
import {
  addDealTask,
  appendDealEvent,
  createQualifiedDealFromMatch,
  getDemoCohortDeals,
  getLocalDeals,
  saveLocalDeal,
  toggleDealTask,
} from '@/lib/repositories/deal-local-client';
import { AppShell, type NavTab } from '@/components/AppShell';
import { HomeGateway } from '@/components/HomeGateway';
import {
  AGRISMART_PRESET,
  StartupPassportFlow,
} from '@/components/StartupPassportFlow';
import { DemandBoard } from '@/components/DemandBoard';
import { ReverseMatchDetail } from '@/components/ReverseMatchDetail';
import {
  PilotPlanEditor,
  buildDefaultPocPlan,
} from '@/components/PilotPlanEditor';
import { DealTrackerView } from '@/components/DealTrackerView';
import { OutcomeAnalyticsView } from '@/components/OutcomeAnalyticsView';
import { InvestorReadinessView } from '@/components/InvestorReadinessView';

type ChallengeSubView = 'list' | 'detail' | 'poc';

export default function BridgeAiMainPage() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [challengeSubView, setChallengeSubView] =
    useState<ChallengeSubView>('list');

  const [profile, setProfile] = useState<StartupProfile>(AGRISMART_PRESET);
  const [isPassportConfirmed, setIsPassportConfirmed] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<'gemma_live' | 'demo_fixture'>(
    'demo_fixture'
  );
  const [aiModel, setAiModel] = useState<string | undefined>(
    'google/gemma-4-26b-a4b-it'
  );

  const [demands, setDemands] = useState<DemandBrief[]>(
    () => demandBriefsData as DemandBrief[]
  );
  const [matches, setMatches] = useState<ReverseMatch[]>(() =>
    rankDemandMatches(AGRISMART_PRESET, demandBriefsData as DemandBrief[])
  );
  const [selectedMatchId, setSelectedMatchId] = useState<string>('DEMO-CH-001');
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(false);

  const [localDeals, setLocalDeals] = useState<Deal[]>([]);
  const [demoDeals] = useState<Deal[]>(() => getDemoCohortDeals());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalDeals(getLocalDeals());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const selectedMatch: ReverseMatch = useMemo(() => {
    return (
      matches.find((m) => m.demand_id === selectedMatchId) ||
      matches[0] ||
      rankDemandMatches(profile, demands)[0]
    );
  }, [matches, selectedMatchId, profile, demands]);

  const handleNavigate = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'challenges') {
      setChallengeSubView('list');
    }
  };

  const refreshDemandMatches = async (targetProfile: StartupProfile) => {
    setIsLoadingMatches(true);
    const localRanked = rankDemandMatches(targetProfile, demands);
    setMatches(localRanked);

    try {
      const response = await fetch('/api/demand/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startup_profile: toRequestProfile(targetProfile) }),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.matches) && data.matches.length > 0) {
          const demandMap = new Map(demands.map((d: any) => [d.id, d]));
          const hydratedMatches = data.matches.map((m: any) => ({
            ...m,
            demand: m.demand || demandMap.get(m.demand_id) || demands[0],
            score_label: m.score_label || `${m.score}% Fit`,
            data_status: m.data_status || demandMap.get(m.demand_id)?.data_status || 'synthetic_demo',
          }));
          setMatches(hydratedMatches);
          if (data?.meta?.source === 'gemma' || data?.meta?.ai_source === 'gemma_live') {
            setAiSource('gemma_live');
          } else if (data?.meta?.ai_source) {
            setAiSource(data.meta.ai_source);
          }
          if (data?.meta?.model) {
            setAiModel(data.meta.model);
          }
        }
      }
    } catch {
      // Keep deterministic local matches if API route is offline
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleConfirmPassport = (
    confirmedProfile: StartupProfile,
    source?: 'gemma_live' | 'demo_fixture',
    model?: string
  ) => {
    setProfile(confirmedProfile);
    setIsPassportConfirmed(true);
    if (source) setAiSource(source);
    if (model) setAiModel(model);
    refreshDemandMatches(confirmedProfile);
    setActiveTab('challenges');
    setChallengeSubView('list');
    showToast(
      `Confirmed Startup Passport for ${
        confirmedProfile.startup_name || 'AgriSmart'
      }. Ranked ${demands.length} ASEAN demand briefs.`
    );
  };

  const handleSelectMatchFromHomeOrBoard = (match: ReverseMatch) => {
    setSelectedMatchId(match.demand_id);
    setActiveTab('challenges');
    setChallengeSubView('detail');
  };

  const handleOpenPocBuilder = (match: ReverseMatch) => {
    setSelectedMatchId(match.demand_id);
    setActiveTab('challenges');
    setChallengeSubView('poc');
  };

  const handleSaveQualifiedDeal = (match: ReverseMatch) => {
    const created = createQualifiedDealFromMatch({
      startupName: profile.startup_name || 'AgriSmart',
      demand: match.demand,
    });
    setLocalDeals(getLocalDeals());
    showToast(
      `Saved "${created.title}" at state "Qualified Match" in browser localStorage.`
    );
  };

  const handleSaveDealWithPoc = (
    match: ReverseMatch,
    plan: POCPlan,
    nextActionTitle: string,
    cadenceDays: 30 | 90 | 180
  ) => {
    const deal = createQualifiedDealFromMatch({
      startupName: profile.startup_name || 'AgriSmart',
      demand: match.demand,
      pocPlan: plan,
      note: `Saved qualified match with 75-day proposed POC draft (${plan.title}).`,
    });

    if (nextActionTitle) {
      addDealTask({
        dealId: deal.id,
        title: nextActionTitle,
        cadenceDays,
      });
    }

    setLocalDeals(getLocalDeals());
    setActiveTab('deals');
    showToast(
      `Saved 75-Day Proposed POC & Qualified Deal with ${match.demand.buyer_name} to Deal Tracker!`
    );
  };

  const ensureDealInLocalStorage = (dealId: string): string => {
    const existingLocal = getLocalDeals().find((d) => d.id === dealId);
    if (existingLocal) return existingLocal.id;

    const demoTarget = demoDeals.find((d) => d.id === dealId);
    if (demoTarget) {
      saveLocalDeal({
        ...demoTarget,
        data_status: 'self_reported',
      });
      return demoTarget.id;
    }
    return dealId;
  };

  const handleTransitionDeal = (
    dealId: string,
    toState: DealState,
    note: string
  ) => {
    try {
      const targetId = ensureDealInLocalStorage(dealId);
      const { deals } = appendDealEvent({
        dealId: targetId,
        toState,
        note,
      });
      setLocalDeals(deals);
      showToast(`Recorded human-confirmed stage transition to "${toState}".`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not transition deal state.'
      );
    }
  };

  const handleAddTask = (
    dealId: string,
    title: string,
    cadenceDays: 30 | 90 | 180
  ) => {
    try {
      const targetId = ensureDealInLocalStorage(dealId);
      const { deals } = addDealTask({
        dealId: targetId,
        title,
        cadenceDays,
      });
      setLocalDeals(deals);
      showToast(`Scheduled ${cadenceDays}-day follow-up check-in task.`);
    } catch {
      // Ignore if deal not found
    }
  };

  const handleToggleTask = (dealId: string, taskId: string) => {
    try {
      const targetId = ensureDealInLocalStorage(dealId);
      const { deals } = toggleDealTask(targetId, taskId);
      setLocalDeals(deals);
    } catch {
      // Ignore if deal not found
    }
  };

  // 1-Click AgriSmart Golden Path Demo Runner
  const handleRunGoldenPath = () => {
    const goldenProfile: StartupProfile = {
      ...AGRISMART_PRESET,
      needs: [
        'crop disease detection',
        'mobile workflow',
        'offline-first',
        'Field pilot',
      ],
      missing_fields: [],
      confidence_notes: [
        ...AGRISMART_PRESET.confidence_notes,
        'Founder confirmed: Offline field capability confirmation',
      ],
    };

    setProfile(goldenProfile);
    setIsPassportConfirmed(true);

    const ranked = rankDemandMatches(goldenProfile, demands);
    setMatches(ranked);
    const topNusantara =
      ranked.find((m) => m.demand_id === 'DEMO-CH-001') || ranked[0];

    if (topNusantara) {
      setSelectedMatchId(topNusantara.demand_id);
      const pocPlan = buildDefaultPocPlan(goldenProfile, topNusantara);
      createQualifiedDealFromMatch({
        startupName: goldenProfile.startup_name || 'AgriSmart',
        demand: topNusantara.demand,
        pocPlan,
        note: 'Golden Path Demo: Qualified AgriSmart × Nusantara Food & Farms Innovation Lab (85/100 compatibility) with 75-day proposed POC plan.',
      });
      setLocalDeals(getLocalDeals());
    }

    setActiveTab('challenges');
    setChallengeSubView('detail');
    showToast(
      '🚀 Golden Path Ready: AgriSmart Passport confirmed, matched with Nusantara Food & Farms (ID), and 75-day POC queued!'
    );
  };

  const isSelectedDealSaved = useMemo(() => {
    if (!selectedMatch) return false;
    return localDeals.some(
      (d) =>
        d.demand_id === selectedMatch.demand_id &&
        d.startup_name.toLowerCase() ===
          (profile.startup_name || 'AgriSmart').toLowerCase()
    );
  }, [localDeals, selectedMatch, profile.startup_name]);

  const activeDealsCount = localDeals.length + demoDeals.length;

  return (
    <AppShell
      activeTab={activeTab}
      onNavigate={handleNavigate}
      matchedDemandsCount={matches.length}
      activeDealsCount={activeDealsCount}
      aiSource={aiSource}
      aiModel={aiModel}
      profile={profile}
      onRunGoldenPath={handleRunGoldenPath}
    >
      {/* Toast Notification Strip */}
      {toastMessage ? (
        <div
          role="status"
          data-testid="global-toast-banner"
          className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-950 px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-md"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
            className="rounded-lg p-1 text-emerald-200 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Quick Golden Path Stepper Bar when inside Challenges sub-views */}
      {activeTab === 'challenges' && challengeSubView !== 'list' ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-2xs">
          <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-600">
            <Rocket className="h-4 w-4 text-[#10B981]" />
            <span>Challenges Flow:</span>
            <button
              type="button"
              onClick={() => setChallengeSubView('list')}
              className="underline hover:text-[#0F2D5B]"
            >
              1. Demand Board
            </button>
            <span>→</span>
            <button
              type="button"
              onClick={() => setChallengeSubView('detail')}
              className={
                challengeSubView === 'detail'
                  ? 'font-extrabold text-[#0F2D5B]'
                  : 'underline hover:text-[#0F2D5B]'
              }
            >
              2. Match Intelligence Detail
            </button>
            <span>→</span>
            <button
              type="button"
              onClick={() => setChallengeSubView('poc')}
              className={
                challengeSubView === 'poc'
                  ? 'font-extrabold text-[#10B981]'
                  : 'underline hover:text-[#0F2D5B]'
              }
            >
              3. 75-Day POC Builder &amp; Outreach
            </button>
          </div>
        </div>
      ) : null}

      {/* Main View Switcher */}
      {activeTab === 'home' && (
        <HomeGateway
          profile={profile}
          isPassportConfirmed={isPassportConfirmed}
          demands={demands}
          matches={matches}
          localDeals={localDeals}
          demoDeals={demoDeals}
          onNavigate={handleNavigate}
          onRunGoldenPath={handleRunGoldenPath}
          onSelectMatch={handleSelectMatchFromHomeOrBoard}
        />
      )}

      {activeTab === 'passport' && (
        <StartupPassportFlow
          profile={profile}
          onProfileChange={setProfile}
          onConfirmPassport={handleConfirmPassport}
          aiSource={aiSource}
          aiModel={aiModel}
        />
      )}

      {activeTab === 'challenges' && challengeSubView === 'list' && (
        <DemandBoard
          profile={profile}
          matches={matches}
          onSelectMatch={handleSelectMatchFromHomeOrBoard}
          onOpenPocBuilder={handleOpenPocBuilder}
          onRefreshMatches={() => refreshDemandMatches(profile)}
          isLoading={isLoadingMatches}
          onAddCustomDemand={(newBrief, scoredMatch) => {
            setDemands((prev) => [newBrief, ...prev]);
            setMatches((prev) => [scoredMatch, ...prev]);
            showToast(
              `Posted self-reported brief "${newBrief.title}" (${scoredMatch.score}/100 compatibility).`
            );
          }}
        />
      )}

      {activeTab === 'challenges' &&
        challengeSubView === 'detail' &&
        selectedMatch && (
          <ReverseMatchDetail
            profile={profile}
            match={selectedMatch}
            onBack={() => setChallengeSubView('list')}
            onOpenPocBuilder={handleOpenPocBuilder}
            onSaveQualifiedDeal={handleSaveQualifiedDeal}
            isDealSaved={isSelectedDealSaved}
          />
        )}

      {activeTab === 'challenges' &&
        challengeSubView === 'poc' &&
        selectedMatch && (
          <PilotPlanEditor
            profile={profile}
            match={selectedMatch}
            onBack={() => setChallengeSubView('detail')}
            onSaveDealWithPoc={handleSaveDealWithPoc}
          />
        )}

      {activeTab === 'deals' && (
        <DealTrackerView
          localDeals={localDeals}
          demoDeals={demoDeals}
          onTransitionDeal={handleTransitionDeal}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onOpenChallenges={() => {
            setActiveTab('challenges');
            setChallengeSubView('list');
          }}
        />
      )}

      {activeTab === 'insights' && (
        <OutcomeAnalyticsView localDeals={localDeals} demoDeals={demoDeals} />
      )}

      {activeTab === 'readiness' && (
        <InvestorReadinessView profile={profile} aiSource={aiSource} />
      )}
    </AppShell>
  );
}
