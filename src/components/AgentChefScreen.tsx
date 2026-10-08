import React, { useState } from 'react';
import {
  MenuItem,
  HouseholdPreferences,
  CategoryGroup,
  DietaryMode,
  SubscriptionTier,
} from '../types';
import { ImgWithFallback } from './ImgWithFallback';
import { ContextualAdBanner } from './ContextualAdBanner';
import {
  Sparkles,
  ThumbsUp,
  ShoppingCart,
  Check,
  RefreshCw,
  Truck,
  Share2,
  MessageSquare,
  Award,
  SlidersHorizontal,
  ArrowRight,
  PackageCheck,
} from 'lucide-react';

interface AgentChefScreenProps {
  candidates: MenuItem[];
  weeklyMenu: MenuItem[];
  categories: CategoryGroup[];
  preferences: HouseholdPreferences;
  dietaryMode: DietaryMode;
  subscriptionTier: SubscriptionTier;
  isRefreshingMcp: boolean;
  onChangeDietaryMode: (mode: DietaryMode) => void;
  onVoteCandidate: (candidateId: string, voterName: string) => void;
  onAddCandidateFeedback: (candidateId: string, voterName: string, comment: string) => void;
  onFinalizeTopSeven: () => void;
  onOpenOrderModal: () => void;
  onUpgradeClick: () => void;
  onNotify: (msg: string) => void;
}

export function AgentChefScreen({
  candidates,
  weeklyMenu,
  categories,
  preferences,
  dietaryMode,
  subscriptionTier,
  isRefreshingMcp,
  onChangeDietaryMode,
  onVoteCandidate,
  onAddCandidateFeedback,
  onFinalizeTopSeven,
  onOpenOrderModal,
  onUpgradeClick,
  onNotify,
}: AgentChefScreenProps) {
  const [activeVoter, setActiveVoter] = useState<string>(preferences.members[0]?.name.split(' ')[0] || 'Sarah');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Sort candidates by votes descending to highlight Top 7 winners
  const sortedCandidates = [...candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const topSevenIds = new Set(sortedCandidates.slice(0, 7).map((c) => c.id));

  const allItems = categories.flatMap((c) => c.items);
  const toBuyItems = allItems.filter((i) => !i.pantryDeducted && !i.isChecked);
  const pantryDeductedItems = allItems.filter((i) => i.pantryDeducted);
  const cartSubtotal = allItems
    .filter((i) => i.price && !i.pantryDeducted)
    .reduce((sum, i) => sum + (i.price || 0), 0);
  const referralCommission = cartSubtotal * 0.02;

  const handleCopyShareLink = (memberName: string) => {
    const cleanName = memberName.split(' ')[0];
    const url = `${window.location.origin}${window.location.pathname}?tab=agent-chef&voter=${encodeURIComponent(cleanName)}`;
    navigator.clipboard.writeText(url);
    onNotify(`Copied no-account personal voting link for ${cleanName}!`);
  };

  const handleCommentSubmit = (candidateId: string) => {
    const text = (commentInputs[candidateId] || '').trim();
    if (!text) return;
    onAddCandidateFeedback(candidateId, activeVoter, text);
    setCommentInputs((prev) => ({ ...prev, [candidateId]: '' }));
  };

  return (
    <div className="pb-28 pt-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ContextualAdBanner
        tier={subscriptionTier}
        context="agent"
        onUpgradeClick={onUpgradeClick}
      />

      {/* Header & Workflow Stepper */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <span>Autonomous Weekly Workflow</span>
            <span>·</span>
            <span>NutriBalance MCP + Gemini + Spoonacular</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#1E3027] tracking-tight">
            Agent Chef: 10-Dinner Proposal & Cart Checkout
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Each week Agent Chef proposes <strong>10 nutritionally balanced dinners</strong>, your household votes via personal links (no login needed), and the top 7 winners auto-build your consolidated grocery cart minus pantry stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            disabled={isRefreshingMcp}
            onClick={() => onChangeDietaryMode(dietaryMode)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingMcp ? 'animate-spin' : ''}`} />
            Refresh 10 Proposals via MCP
          </button>

          <button
            type="button"
            onClick={onFinalizeTopSeven}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#233F33] hover:bg-[#192F26] rounded-lg shadow-2xs transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Lock Top 7 Winners & Sync Pantry Cart
          </button>
        </div>
      </div>

      {/* 3-Step Autonomous Agent Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-stone-200/90 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-semibold text-stone-900">Step 1 · Propose 10 Dinners</span>
            <span className="font-mono text-emerald-700">10 Candidates Active</span>
          </div>
          <p className="text-xs text-stone-600">
            Calibrated for {dietaryMode.toUpperCase()} mode via NutriBalance MCP (`mcp.smithery.ai/ghyeogh`).
          </p>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-semibold text-stone-900">Step 2 · Household Voting</span>
            <span className="font-mono text-[#233F33]">Top 7 Advance</span>
          </div>
          <p className="text-xs text-stone-600">
            Active voter: <strong>{activeVoter}</strong>. Share personal links with family members—no account required.
          </p>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-semibold text-stone-900">Step 3 · Agent Fills Cart & User Approves</span>
            <span className="font-mono text-[#B45309]">SGD ${cartSubtotal.toFixed(2)}</span>
          </div>
          <p className="text-xs text-stone-600">
            {pantryDeductedItems.length} pantry staples deducted automatically. 2% referral: SGD ${referralCommission.toFixed(2)}.
          </p>
        </div>
      </div>

      {/* Voter Identity & Dietary Mode Controls */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-stone-700">Voting as Household Member:</span>
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
            {preferences.members.map((m) => {
              const firstName = m.name.split(' ')[0];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveVoter(firstName)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    activeVoter === firstName
                      ? 'bg-[#233F33] text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {m.name} ({m.multiplier}x)
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handleCopyShareLink(activeVoter)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-50 border border-stone-200 rounded-lg"
          >
            <Share2 className="w-3.5 h-3.5" />
            Copy {activeVoter}'s Voting Link
          </button>
        </div>

        {/* Dietary Mode Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
            MCP Dietary Mode:
          </span>
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg overflow-x-auto">
            {(['standard', 'vegetarian', 'vegan', 'keto', 'high-protein'] as DietaryMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChangeDietaryMode(mode)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors capitalize whitespace-nowrap ${
                  dietaryMode === mode
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 10 Candidate Dinners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {candidates.map((cand, index) => {
          const isTopSeven = topSevenIds.has(cand.id);
          const hasVoted = (cand.votedBy || []).includes(activeVoter);
          const macros = cand.macros || { calories: 500, protein: 35, carbs: 35, fat: 22 };

          return (
            <div
              key={cand.id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all flex flex-col justify-between ${
                isTopSeven
                  ? 'border-[#233F33]/50 shadow-2xs'
                  : 'border-stone-200/80 opacity-85'
              }`}
            >
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-12">
                  <div className="sm:col-span-4 relative h-44 sm:h-auto">
                    <ImgWithFallback
                      src={cand.image}
                      alt={cand.mealName}
                      className="w-full h-full object-cover"
                      fallbackText={cand.mealName}
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/75 text-white px-2.5 py-1 rounded text-[11px] font-mono font-semibold">
                      #{index + 1} · {isTopSeven ? 'Top 7 Winner' : 'Waitlist'}
                    </div>
                  </div>

                  <div className="sm:col-span-8 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-1 font-mono">
                        <span>{cand.prepTimeMinutes}m prep · {cand.cuisine}</span>
                        <span className="text-[#233F33] font-bold">Score {cand.eatingScore || 91}/100</span>
                      </div>

                      <h3 className="font-editorial text-lg font-bold text-stone-900 leading-snug mb-1">
                        {cand.mealName}
                      </h3>

                      <p className="text-xs text-stone-600 line-clamp-2 mb-3">
                        {cand.description}
                      </p>
                    </div>

                    {/* Per-serving Macros */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-stone-100 text-center font-mono text-[11px]">
                      <div className="bg-stone-50 py-1 px-1.5 rounded">
                        <span className="text-stone-400 block text-[10px] font-sans">Kcal</span>
                        <span className="font-bold text-stone-800 tabular-nums">{macros.calories}</span>
                      </div>
                      <div className="bg-stone-50 py-1 px-1.5 rounded">
                        <span className="text-stone-400 block text-[10px] font-sans">Protein</span>
                        <span className="font-bold text-[#233F33] tabular-nums">{macros.protein}g</span>
                      </div>
                      <div className="bg-stone-50 py-1 px-1.5 rounded">
                        <span className="text-stone-400 block text-[10px] font-sans">Carbs</span>
                        <span className="font-bold text-stone-800 tabular-nums">{macros.carbs}g</span>
                      </div>
                      <div className="bg-stone-50 py-1 px-1.5 rounded">
                        <span className="text-stone-400 block text-[10px] font-sans">Fat</span>
                        <span className="font-bold text-stone-800 tabular-nums">{macros.fat}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Voting & Feedback Footer */}
              <div className="p-4 bg-[#FAFBF9] border-t border-stone-100 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-stone-600">
                    <span className="font-mono font-bold text-stone-900 tabular-nums">{cand.votes || 0} votes</span>
                    {(cand.votedBy || []).length > 0 && (
                      <span className="text-stone-500"> · Voted by {(cand.votedBy || []).join(', ')}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onVoteCandidate(cand.id, activeVoter)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      hasVoted
                        ? 'bg-[#233F33] text-white'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {hasVoted ? `Voted (${activeVoter})` : `Vote as ${activeVoter}`}
                  </button>
                </div>

                {/* Feedback comments */}
                {(cand.feedback || []).length > 0 && (
                  <div className="space-y-1 pt-1">
                    {(cand.feedback || []).map((fb) => (
                      <div key={fb.id} className="text-xs text-stone-600 bg-white px-2.5 py-1.5 rounded border border-stone-200/60">
                        <strong className="text-stone-800">{fb.memberName}:</strong> {fb.comment}{' '}
                        <span className="text-[10px] text-stone-400 font-mono">({fb.timestamp})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick feedback input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInputs[cand.id] || ''}
                    onChange={(e) => setCommentInputs((prev) => ({ ...prev, [cand.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(cand.id)}
                    placeholder={`Leave feedback as ${activeVoter}...`}
                    className="flex-1 px-2.5 py-1 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#233F33]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCommentSubmit(cand.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-200/70 hover:bg-stone-200 rounded-lg transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Pre-Filled Cart & One-Tap Checkout Approval Panel */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-[#233F33] font-mono font-semibold">
              <PackageCheck className="w-4 h-4" />
              <span>AGENT CHEF CART READY FOR USER APPROVAL</span>
            </div>
            <h2 className="font-editorial text-2xl font-bold text-stone-900">
              Consolidated Cart Minus Pantry Stock ({toBuyItems.length} items to buy)
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Agent Chef cross-referenced your top-voted 7 dinners against your household pantry ({pantryDeductedItems.length} staples deducted automatically). Approve checkout below to dispatch the order to your connected delivery partner and record the platform's <strong>2% referral revenue (SGD ${referralCommission.toFixed(2)})</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onFinalizeTopSeven}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors whitespace-nowrap"
            >
              <Check className="w-4 h-4 text-[#233F33]" />
              Apply Top 7 to Weekly Menu
            </button>

            <button
              type="button"
              onClick={onOpenOrderModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#233F33] hover:bg-[#192F26] rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <Truck className="w-4 h-4 text-emerald-300" />
              Approve & Checkout Cart (SGD ${cartSubtotal.toFixed(2)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
