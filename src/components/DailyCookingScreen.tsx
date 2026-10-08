import React, { useState } from 'react';
import { MenuItem, HouseholdPreferences, SubscriptionTier } from '../types';
import { ImgWithFallback } from './ImgWithFallback';
import { ContextualAdBanner } from './ContextualAdBanner';
import {
  Clock,
  Check,
  ChefHat,
  Flame,
  Users,
  CheckCircle2,
  Play,
  RotateCcw,
  Utensils,
  Award,
  Sparkles,
} from 'lucide-react';

interface DailyCookingScreenProps {
  menuItems: MenuItem[];
  preferences: HouseholdPreferences;
  subscriptionTier: SubscriptionTier;
  onUpgradeClick: () => void;
  onViewShoppingList: () => void;
  onNotify: (msg: string) => void;
}

export function DailyCookingScreen({
  menuItems,
  preferences,
  subscriptionTier,
  onUpgradeClick,
  onViewShoppingList,
  onNotify,
}: DailyCookingScreenProps) {
  const [selectedDay, setSelectedDay] = useState<string>('Wednesday');
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [activeTimerMinutes, setActiveTimerMinutes] = useState<number | null>(null);

  const activeMeal = menuItems.find((m) => m.day === selectedDay) || menuItems[0];

  const totalMultiplier = preferences.members.reduce((acc, m) => {
    let mult = 1.0;
    if (m.appetite === 'Small') mult = m.name.includes('Leo') || m.name.includes('Child') ? 0.5 : 0.8;
    else if (m.appetite === 'Big') mult = 1.25;
    return acc + mult;
  }, 0);

  const steps = activeMeal?.cookingSteps && activeMeal.cookingSteps.length > 0
    ? activeMeal.cookingSteps
    : [
        'Prep and wash all fresh produce and aromatics (ginger, garlic, scallions) on a clean board.',
        'Portion protein according to household multiplier (2.75x) and season lightly with light soy sauce and sesame oil.',
        'Cook main protein over medium-high heat until tender and cooked through, keeping spice mild for child portions.',
        'Add crisp vegetables in the final 3–4 minutes so they retain vibrant color and nutrients.',
        'Plate family-style and serve warm with steamed jasmine rice or nourishing clear soup.',
      ];

  const macros = activeMeal?.macros || { calories: 510, protein: 38, carbs: 32, fat: 24 };
  const eatingScore = activeMeal?.eatingScore || 92;

  const toggleIngredient = (idx: number) => {
    const key = `${activeMeal.id}-ing-${idx}`;
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleStep = (idx: number) => {
    const key = `${activeMeal.id}-step-${idx}`;
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedStepsCount = steps.filter((_, idx) => completedSteps[`${activeMeal.id}-step-${idx}`]).length;
  const completedIngCount = (activeMeal?.ingredients || []).filter(
    (_, idx) => checkedIngredients[`${activeMeal.id}-ing-${idx}`]
  ).length;

  const resetProgress = () => {
    const nextIng = { ...checkedIngredients };
    const nextSteps = { ...completedSteps };
    (activeMeal?.ingredients || []).forEach((_, idx) => delete nextIng[`${activeMeal.id}-ing-${idx}`]);
    steps.forEach((_, idx) => delete nextSteps[`${activeMeal.id}-step-${idx}`]);
    setCheckedIngredients(nextIng);
    setCompletedSteps(nextSteps);
    setActiveTimerMinutes(null);
    onNotify(`Reset cooking checklist for ${activeMeal.day}'s dinner.`);
  };

  return (
    <div className="pb-24 pt-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <ContextualAdBanner
        tier={subscriptionTier}
        context="cooking"
        onUpgradeClick={onUpgradeClick}
      />

      {/* Top Day Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <span>Daily Kitchen Touchpoint</span>
            <span>·</span>
            <span>Distraction-Free Cooking Mode</span>
            <span>·</span>
            <span className="font-mono text-[#233F33] font-semibold">Yield: {totalMultiplier.toFixed(2)}x</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#1E3027] tracking-tight">
            Today's Cooking View
          </h1>
        </div>

        {/* Day selector */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl overflow-x-auto">
          {menuItems.map((m) => (
            <button
              key={m.day}
              type="button"
              onClick={() => setSelectedDay(m.day)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedDay === m.day
                  ? 'bg-[#233F33] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {m.day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {activeMeal && (
        <div className="space-y-6">
          {/* Recipe Header Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-5 relative min-h-[220px]">
                <ImgWithFallback
                  src={activeMeal.image}
                  alt={activeMeal.mealName}
                  className="w-full h-full object-cover"
                  fallbackText={activeMeal.mealName}
                />
                <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs font-mono">
                  {activeMeal.day} · {activeMeal.prepTimeMinutes} mins · Eating Score {eatingScore}/100
                </div>
              </div>

              <div className="md:col-span-7 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-2">
                    <span>{activeMeal.cuisine}</span>
                    <button
                      type="button"
                      onClick={resetProgress}
                      className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Checklist
                    </button>
                  </div>

                  <h2 className="font-editorial text-2xl font-bold text-[#1E3027] mb-1.5">
                    {activeMeal.mealName}
                  </h2>
                  <p className="text-xs font-semibold text-[#B45309] mb-3">
                    {activeMeal.subName}
                  </p>
                  <p className="text-sm text-stone-600 leading-relaxed mb-4">
                    {activeMeal.description}
                  </p>
                </div>

                {/* Per-Serving Macros Bar */}
                <div className="pt-4 border-t border-stone-100 grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-2 bg-[#FAFBF9] rounded-lg border border-stone-200/60">
                    <span className="block text-[10px] text-stone-500 font-sans">Calories</span>
                    <span className="text-sm font-bold text-stone-900 tabular-nums">{macros.calories} kcal</span>
                  </div>
                  <div className="p-2 bg-[#FAFBF9] rounded-lg border border-stone-200/60">
                    <span className="block text-[10px] text-stone-500 font-sans">Protein</span>
                    <span className="text-sm font-bold text-[#233F33] tabular-nums">{macros.protein}g</span>
                  </div>
                  <div className="p-2 bg-[#FAFBF9] rounded-lg border border-stone-200/60">
                    <span className="block text-[10px] text-stone-500 font-sans">Carbs</span>
                    <span className="text-sm font-bold text-stone-800 tabular-nums">{macros.carbs}g</span>
                  </div>
                  <div className="p-2 bg-[#FAFBF9] rounded-lg border border-stone-200/60">
                    <span className="block text-[10px] text-stone-500 font-sans">Fat</span>
                    <span className="text-sm font-bold text-stone-800 tabular-nums">{macros.fat}g</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main 2-Column Cooking Workspace: Ingredient Checklist + Step-by-Step Instructions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Ingredient Checklist */}
            <div className="lg:col-span-5 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
                  <div>
                    <h3 className="font-editorial text-lg font-bold text-stone-900">
                      1. Ingredient Mise en Place
                    </h3>
                    <p className="text-xs text-stone-500">
                      Scaled for {preferences.adults} Adults + {preferences.children} Child ({totalMultiplier.toFixed(2)}x)
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#233F33] tabular-nums">
                    {completedIngCount}/{activeMeal.ingredients.length} ready
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeMeal.ingredients.map((ing, idx) => {
                    const isChecked = Boolean(checkedIngredients[`${activeMeal.id}-ing-${idx}`]);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleIngredient(idx)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors ${
                          isChecked
                            ? 'bg-stone-50 border-stone-200 text-stone-400'
                            : 'bg-white border-stone-200/80 hover:border-[#233F33]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? 'bg-[#233F33] text-white'
                                : 'border border-stone-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className={`text-sm font-medium truncate ${isChecked ? 'line-through' : 'text-stone-800'}`}>
                            {ing.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                          <span className="text-stone-700 font-semibold tabular-nums">{ing.qty}</span>
                          <span className="text-stone-400">·</span>
                          <span className={ing.status === 'in-pantry' ? 'text-emerald-700' : 'text-amber-700'}>
                            {ing.status === 'in-pantry' ? 'Pantry' : 'Fresh'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Safety & Kid-Portion Reminder */}
              <div className="mt-6 p-3.5 bg-[#FAFBF9] border border-stone-200/70 rounded-xl text-xs text-stone-600 space-y-1">
                <div className="font-bold text-stone-800 flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-[#233F33]" />
                  Household Prep Note
                </div>
                <p>
                  Active safety filters: <strong>{preferences.dietaryRestrictions.join(', ') || 'None'}</strong>.
                  Portion out Leo's 0.5x serving before adding optional table chili.
                </p>
              </div>
            </div>

            {/* Right Column: Step-by-Step Instructions */}
            <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
                  <div>
                    <h3 className="font-editorial text-lg font-bold text-stone-900">
                      2. Step-by-Step Cooking Instructions
                    </h3>
                    <p className="text-xs text-stone-500">
                      Tap each step as you complete it in the kitchen
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTimerMinutes(activeMeal.prepTimeMinutes);
                        onNotify(`Started ${activeMeal.prepTimeMinutes}-minute kitchen timer for ${activeMeal.mealName}!`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#233F33] bg-[#EEF4F0] hover:bg-[#DCE9E1] rounded-lg transition-colors font-mono"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {activeTimerMinutes ? `${activeTimerMinutes}m Timer Active` : `Start ${activeMeal.prepTimeMinutes}m Timer`}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {steps.map((stepText, idx) => {
                    const isDone = Boolean(completedSteps[`${activeMeal.id}-step-${idx}`]);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleStep(idx)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                          isDone
                            ? 'bg-stone-50 border-stone-200 text-stone-400'
                            : 'bg-white border-stone-200/80 hover:border-[#233F33]'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 transition-colors ${
                            isDone
                              ? 'bg-[#233F33] text-white'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm leading-relaxed ${isDone ? 'line-through' : 'text-stone-800'}`}>
                            {stepText}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Completion Footer */}
              <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-stone-600 font-mono">
                  Progress: <strong className="text-stone-900">{completedStepsCount} of {steps.length}</strong> steps completed
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const allDone: Record<string, boolean> = { ...completedSteps };
                    steps.forEach((_, i) => {
                      allDone[`${activeMeal.id}-step-${i}`] = true;
                    });
                    setCompletedSteps(allDone);
                    onNotify(`Dinner complete! Logged ${activeMeal.mealName} (${macros.calories} kcal/serving, Eating Score ${eatingScore}/100).`);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#233F33] hover:bg-[#192F26] rounded-lg transition-colors whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Mark Dinner Cooked & Log Nutrition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
