import React, { useState } from 'react';
import {
  MenuItem,
  HouseholdPreferences,
  DietaryMode,
  NutriBalanceProfile,
  SubscriptionTier,
} from '../types';
import {
  getMemberPortion,
  getDailyCalorieTarget,
  getSampleDinnerCalories,
} from '../data/sampleCalories';
import { ImgWithFallback } from './ImgWithFallback';
import { ContextualAdBanner } from './ContextualAdBanner';
import {
  Flame,
  Calendar,
  Clock,
  Sparkles,
  Users,
  ShoppingCart,
  ChevronRight,
  ChefHat,
  RefreshCw,
  Lock,
  Unlock,
  ThumbsUp,
  Share2,
  SlidersHorizontal,
  Activity,
  Utensils,
} from 'lucide-react';

interface WeeklyMenuScreenProps {
  menuItems: MenuItem[];
  preferences: HouseholdPreferences;
  dietaryMode?: DietaryMode;
  nutriProfile?: NutriBalanceProfile | null;
  subscriptionTier?: SubscriptionTier;
  onGenerateClick: () => void;
  onViewShoppingList: () => void;
  onOpenCookingView?: () => void;
  onSwapMeal?: (dayName: string) => void;
  onToggleLockDay?: (dayName: string) => void;
  onRegenerateUnlocked?: () => void;
  onRefreshNutriBalance?: (mode: DietaryMode) => void;
  onVoteMeal?: (dayName: string, voterName: string) => void;
  onAddMealFeedback?: (dayName: string, voterName: string, comment: string) => void;
  onUpgradeClick?: () => void;
  onNotify?: (msg: string) => void;
  isLoading?: boolean;
}

export function WeeklyMenuScreen({
  menuItems,
  preferences,
  dietaryMode = 'standard',
  nutriProfile,
  subscriptionTier = 'family',
  onGenerateClick,
  onViewShoppingList,
  onOpenCookingView,
  onSwapMeal,
  onToggleLockDay,
  onRegenerateUnlocked,
  onRefreshNutriBalance,
  onVoteMeal,
  onAddMealFeedback,
  onUpgradeClick,
  onNotify,
  isLoading = false,
}: WeeklyMenuScreenProps) {
  const [selectedDay, setSelectedDay] = useState<string>('Wednesday');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [activeVoter, setActiveVoter] = useState<string>(
    preferences.members[0]?.name.split(' ')[0] || 'Sarah'
  );
  const [feedbackText, setFeedbackText] = useState<string>('');

  const selectedMeal = menuItems.find((m) => m.day === selectedDay) || menuItems[0];

  const totalMultiplier = preferences.members.reduce((acc, m) => acc + getMemberPortion(m), 0);

  const selectedMember =
    preferences.members.find((m) => m.id === selectedMemberId) || preferences.members[0];
  const memberPortion = selectedMember ? getMemberPortion(selectedMember) : 1;
  const memberDinnerCalories = selectedMeal
    ? Math.round((selectedMeal.macros?.calories || getSampleDinnerCalories(selectedMeal)) * memberPortion)
    : 0;
  const memberDailyTarget = selectedMember ? getDailyCalorieTarget(selectedMember) : 0;

  const lockedCount = menuItems.filter((m) => m.isLocked).length;

  const selectedMacros = selectedMeal?.macros || {
    calories: getSampleDinnerCalories(selectedMeal),
    protein: 38,
    carbs: 32,
    fat: 24,
  };

  const handleSharePersonalVotingLink = (memberName: string) => {
    const cleanName = memberName.split(' ')[0];
    const link = `${window.location.origin}${window.location.pathname}?tab=menu&voter=${encodeURIComponent(cleanName)}`;
    navigator.clipboard.writeText(link);
    if (onNotify) {
      onNotify(`Copied personal voting & feedback link for ${cleanName} (no account required)!`);
    }
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim() || !selectedMeal || !onAddMealFeedback) return;
    onAddMealFeedback(selectedMeal.day, activeVoter, feedbackText.trim());
    setFeedbackText('');
  };

  return (
    <div className="pb-28 pt-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ContextualAdBanner
        tier={subscriptionTier}
        context="menu"
        onUpgradeClick={() => onUpgradeClick && onUpgradeClick()}
      />

      {/* Top Metadata Line */}
      <div className="mb-2 flex items-center gap-2 text-xs text-stone-500 font-mono">
        <span>OCT 21 – OCT 27</span>
        <span>·</span>
        <span>7-DAY NUTRITION & PORTION BALANCED ROTATION</span>
        <span>·</span>
        <span className="text-[#233F33] font-semibold">
          NutriBalance MCP Score: {nutriProfile?.dailyEatingScore || selectedMeal?.eatingScore || 92}/100
        </span>
      </div>

      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#1E3027] tracking-tight">
            Weekly Family Meal Plan & Voting
          </h1>
          <p className="text-sm text-stone-500 mt-1 max-w-2xl">
            Auto-consolidated based on household portion multiplier (<span className="font-semibold text-stone-700 font-mono">{totalMultiplier.toFixed(2)}x</span>), per-serving macros, household votes, and zero-allergen safety.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onRegenerateUnlocked && (
            <button
              onClick={onRegenerateUnlocked}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 shadow-2xs transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate Unlocked ({7 - lockedCount})</span>
            </button>
          )}

          <button
            onClick={onViewShoppingList}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 shadow-2xs transition-colors whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-stone-500" />
            Consolidated Shopping List
          </button>

          <button
            onClick={onGenerateClick}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#233F33] hover:bg-[#192F26] rounded-lg shadow-2xs transition-all active:scale-[0.98] disabled:opacity-60 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Generate New Rotation
          </button>
        </div>
      </div>

      {/* NutriBalance MCP Control Bar (Dietary Modes, TDEE & Personal Voting Links) */}
      <div className="bg-white border border-stone-200/80 rounded-xl p-4 mb-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#233F33]" />
            NutriBalance MCP Mode:
          </span>
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg overflow-x-auto">
            {(['standard', 'vegetarian', 'vegan', 'keto', 'high-protein'] as DietaryMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onRefreshNutriBalance && onRefreshNutriBalance(mode)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors capitalize whitespace-nowrap ${
                  dietaryMode === mode
                    ? 'bg-[#233F33] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Household Member Voter Selector & Shareable Link */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs text-stone-500">Voting as:</span>
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
            {preferences.members.map((m) => {
              const firstName = m.name.split(' ')[0];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveVoter(firstName)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    activeVoter === firstName
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {firstName}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => handleSharePersonalVotingLink(activeVoter)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5 text-stone-500" />
            Share {activeVoter}'s Voting Link
          </button>
        </div>
      </div>

      {/* Week Day Selector Cards with Per-Serving Macros & Votes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-8">
        {menuItems.map((item) => {
          const isSelected = item.day === selectedDay;
          const itemMacros = item.macros || {
            calories: getSampleDinnerCalories(item),
            protein: 36,
            carbs: 30,
            fat: 22,
          };
          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-[#233F33] ring-2 ring-[#233F33]/20 shadow-xs'
                  : 'bg-white/70 border-stone-200 hover:border-stone-300 hover:bg-white'
              }`}
            >
              <div
                onClick={() => setSelectedDay(item.day)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-1">
                  <span>{item.day.slice(0, 3)}</span>
                  <span className="text-[10px] text-stone-400 font-mono tabular-nums">
                    {item.prepTimeMinutes}m
                  </span>
                </div>
                <p
                  className={`text-xs font-bold line-clamp-1 leading-snug ${
                    isSelected ? 'text-[#1F3329]' : 'text-stone-800'
                  }`}
                >
                  {item.mealName.split('&')[0]}
                </p>
                <p className="text-[10px] text-stone-500 font-mono mt-1 tabular-nums">
                  {itemMacros.calories} kcal · {itemMacros.protein}g P
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVoteMeal && onVoteMeal(item.day, activeVoter);
                  }}
                  className="text-[10px] font-mono font-semibold text-stone-600 hover:text-[#233F33] flex items-center gap-1"
                  title={`Vote for ${item.day}'s dinner as ${activeVoter}`}
                >
                  <ThumbsUp className="w-2.5 h-2.5" />
                  <span>{item.votes ?? 2}</span>
                </button>

                {onToggleLockDay && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLockDay(item.day);
                    }}
                    title={item.isLocked ? 'Locked (will not change during generation)' : 'Unlocked'}
                    className={`p-1 rounded hover:bg-stone-100 transition-colors ${
                      item.isLocked ? 'text-[#233F33]' : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    {item.isLocked ? (
                      <Lock className="w-3 h-3 text-[#233F33]" />
                    ) : (
                      <Unlock className="w-3 h-3 text-stone-300 hover:text-stone-500" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Feature Card */}
      {selectedMeal && (
        <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-2xs mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Visual Cover */}
            <div className="lg:col-span-5 relative h-64 lg:h-auto min-h-[320px]">
              <ImgWithFallback
                src={selectedMeal.image}
                alt={selectedMeal.mealName}
                className="w-full h-full object-cover"
                fallbackText={selectedMeal.mealName}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
              <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-xs font-mono">
                {selectedMeal.day} Dinner · {selectedMeal.cuisine}
                {selectedMeal.isLocked ? ' · Locked' : ''}
              </div>
            </div>

            {/* Details Content */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-xs text-stone-500 mb-2 font-mono flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-stone-700">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    {selectedMeal.prepTimeMinutes} mins prep
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-semibold text-stone-700">
                    <Users className="w-3.5 h-3.5 text-stone-500" />
                    Yield: {totalMultiplier.toFixed(2)}x portions
                  </span>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold">
                    Eating Score: {selectedMeal.eatingScore || 92}/100
                  </span>
                </div>

                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1E3027] tracking-tight mb-2">
                  {selectedMeal.mealName}
                </h2>

                <p className="text-xs sm:text-sm font-semibold text-[#B45309] mb-3">
                  {selectedMeal.subName}
                </p>

                <p className="text-sm text-stone-600 leading-relaxed mb-5">
                  {selectedMeal.description}
                </p>

                {/* Per-Serving Macros Grid (Calories, Protein, Carbs, Fat) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 font-mono">
                  <div className="p-3 bg-[#FAFBF9] border border-stone-200/70 rounded-xl">
                    <span className="text-[11px] text-stone-500 font-sans block">Calories / 1.0x</span>
                    <span className="text-lg font-bold text-stone-900 tabular-nums">
                      {selectedMacros.calories} kcal
                    </span>
                  </div>
                  <div className="p-3 bg-[#FAFBF9] border border-stone-200/70 rounded-xl">
                    <span className="text-[11px] text-stone-500 font-sans block">Protein</span>
                    <span className="text-lg font-bold text-[#233F33] tabular-nums">
                      {selectedMacros.protein}g
                    </span>
                  </div>
                  <div className="p-3 bg-[#FAFBF9] border border-stone-200/70 rounded-xl">
                    <span className="text-[11px] text-stone-500 font-sans block">Carbs</span>
                    <span className="text-lg font-bold text-stone-900 tabular-nums">
                      {selectedMacros.carbs}g
                    </span>
                  </div>
                  <div className="p-3 bg-[#FAFBF9] border border-stone-200/70 rounded-xl">
                    <span className="text-[11px] text-stone-500 font-sans block">Fat</span>
                    <span className="text-lg font-bold text-stone-900 tabular-nums">
                      {selectedMacros.fat}g
                    </span>
                  </div>
                </div>

                {/* Calories per person (member portion calculator) */}
                {selectedMember && (
                  <div className="mb-5 p-3.5 bg-[#FAFBF9] border border-[#E3E8E4] rounded-xl">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                      <h3 className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#B45309]" />
                        Personalised Member TDEE & Portion Calibration
                      </h3>
                      <label className="flex items-center gap-2 text-[11px] font-medium text-stone-500">
                        <span>Member</span>
                        <select
                          value={selectedMember.id}
                          onChange={(e) => setSelectedMemberId(e.target.value)}
                          className="px-2 py-1 text-xs font-semibold text-stone-800 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#233F33]"
                        >
                          {preferences.members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 bg-white border border-stone-200/70 rounded-lg">
                        <p className="text-[11px] font-medium text-stone-500">
                          This dinner · {selectedMember.name}'s portion ({memberPortion}x)
                        </p>
                        <p className="text-lg font-bold text-stone-900 font-mono tabular-nums">
                          ~{memberDinnerCalories.toLocaleString()} kcal ({Math.round(selectedMacros.protein * memberPortion)}g P)
                        </p>
                      </div>
                      <div className="p-2.5 bg-white border border-stone-200/70 rounded-lg">
                        <p className="text-[11px] font-medium text-stone-500">
                          Daily TDEE Calorie Target · Whole Day
                        </p>
                        <p className="text-lg font-bold text-stone-900 font-mono tabular-nums">
                          {memberDailyTarget > 0 ? `${memberDailyTarget.toLocaleString()} kcal` : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Household Voting & Feedback Box (No Account Needed) */}
                <div className="mb-5 p-3.5 bg-stone-50 border border-stone-200/70 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs text-stone-700">
                      <span className="font-bold">Household Votes: </span>
                      <span className="font-mono font-bold text-[#233F33]">{selectedMeal.votes ?? 2} votes</span>
                      {(selectedMeal.votedBy || []).length > 0 && (
                        <span className="text-stone-500"> · ({(selectedMeal.votedBy || []).join(', ')})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onVoteMeal && onVoteMeal(selectedMeal.day, activeVoter)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-[#233F33] hover:bg-[#192F26] rounded-lg transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Upvote Dinner as {activeVoter}
                    </button>
                  </div>

                  {(selectedMeal.feedback || []).length > 0 && (
                    <div className="space-y-1">
                      {(selectedMeal.feedback || []).map((fb) => (
                        <div key={fb.id} className="text-xs bg-white px-2.5 py-1.5 rounded border border-stone-200/70 text-stone-600">
                          <strong className="text-stone-900">{fb.memberName}:</strong> {fb.comment}{' '}
                          <span className="text-[10px] text-stone-400 font-mono">({fb.timestamp})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFeedbackSubmit()}
                      placeholder={`Leave feedback on ${selectedMeal.day}'s dinner as ${activeVoter} (no login required)...`}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#233F33]"
                    />
                    <button
                      type="button"
                      onClick={handleFeedbackSubmit}
                      className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                      Post Note
                    </button>
                  </div>
                </div>

                {/* Recipe Ingredients & Pantry Breakdown */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-stone-600 mb-3 flex items-center justify-between">
                    <span>Key Ingredients Consolidation</span>
                    <span className="text-[11px] font-normal text-stone-400">
                      Auto-matched with Pantry & Shopping List
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMeal.ingredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-stone-50 border border-stone-200/70 rounded-lg flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-stone-800">
                          {ing.name}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-stone-600 font-medium">
                            {ing.qty}
                          </span>
                          <span>·</span>
                          <span className={ing.status === 'in-pantry' ? 'text-[#2D6A4F] font-semibold' : 'text-stone-700'}>
                            {ing.status === 'in-pantry' ? 'Pantry' : 'In Cart'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <ChefHat className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>
                    Respects all household allergy & kid-mild restrictions
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                  {onOpenCookingView && (
                    <button
                      type="button"
                      onClick={onOpenCookingView}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#233F33] bg-[#EEF4F0] hover:bg-[#DCE9E1] rounded-lg transition-colors"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      Open Cooking View
                    </button>
                  )}

                  {onToggleLockDay && (
                    <button
                      onClick={() => onToggleLockDay(selectedMeal.day)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                        selectedMeal.isLocked
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {selectedMeal.isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-stone-400" />
                          <span>Lock Meal</span>
                        </>
                      )}
                    </button>
                  )}

                  {onSwapMeal && (
                    <button
                      onClick={() => onSwapMeal(selectedMeal.day)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      Swap Recipe
                    </button>
                  )}

                  <button
                    onClick={onViewShoppingList}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#233F33] hover:bg-[#192F26] rounded-lg shadow-2xs transition-colors"
                  >
                    Check Ingredients
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NutriBalance MCP Nutrient-Deficiency Guidance Panel */}
      {nutriProfile && nutriProfile.deficiencyGuidance && (
        <div className="bg-white border border-stone-200/80 rounded-xl p-5 mb-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#233F33]" />
              <h3 className="font-editorial text-lg font-bold text-stone-900">
                NutriBalance MCP · Nutrient-Deficiency Guidance & Daily Eating Score ({nutriProfile.dailyEatingScore}/100)
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-500">
              Mode: {nutriProfile.modeLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nutriProfile.deficiencyGuidance.map((def, idx) => (
              <div key={idx} className="p-3.5 bg-[#FAFBF9] border border-stone-200/70 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-stone-900">{def.nutrient}</span>
                  <span className="font-mono text-[11px] text-[#233F33] font-semibold">{def.status}</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{def.recommendation}</p>
                <p className="text-[11px] font-mono text-stone-500">
                  Food sources: <strong className="text-stone-700">{def.foodFix}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Schedule Overview Table */}
      <div className="bg-white border border-stone-200/80 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-[#FAFBF9] border-b border-stone-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-600" />
            <h3 className="font-semibold text-sm text-[#1F3329]">
              Full 7-Day Dinner Calendar & Macro Summary
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            {lockedCount > 0 ? `${lockedCount} day(s) locked` : 'All 7 days customizable'}
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {menuItems.map((item) => {
            const m = item.macros || { calories: getSampleDinnerCalories(item), protein: 36, carbs: 30, fat: 22 };
            return (
              <div
                key={item.id}
                onClick={() => setSelectedDay(item.day)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                  selectedDay === item.day ? 'bg-[#FAFBF9]' : 'hover:bg-stone-50/60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-24 text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    {item.day}
                    {item.isLocked && <Lock className="w-3 h-3 text-[#233F33]" />}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-stone-800">
                      {item.mealName}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5 font-mono">
                      {item.cuisine} · {item.prepTimeMinutes}m · {m.calories} kcal ({m.protein}g P / {m.carbs}g C / {m.fat}g F)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center font-mono text-xs">
                  <span className="text-stone-600">
                    {item.votes ?? 2} votes · {item.ingredients.length} ing
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
