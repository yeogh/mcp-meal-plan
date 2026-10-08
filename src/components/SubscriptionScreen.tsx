import React from 'react';
import { SubscriptionTier, TabType } from '../types';
import { Check, Sparkles, ShieldCheck, Users, User, Gift, Lock } from 'lucide-react';

interface SubscriptionScreenProps {
  currentTier: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier) => void;
  onNavigate: (tab: TabType) => void;
}

export function SubscriptionScreen({
  currentTier,
  onSelectTier,
  onNavigate,
}: SubscriptionScreenProps) {
  const tiers: {
    id: SubscriptionTier;
    name: string;
    audience: string;
    price: string;
    cadence: string;
    description: string;
    features: string[];
    adPolicy: string;
    memberLimit: string;
  }[] = [
    {
      id: 'free',
      name: '1-Week Free Trial',
      audience: 'For new households exploring smart meal consolidation',
      price: '$0',
      cadence: '7-day trial · Ad-supported',
      description: 'Generate your first weekly meal plan, consolidated grocery list, and test automated delivery checkout.',
      memberLimit: 'Up to 2 profiles',
      adPolicy: 'Includes contextual supermarket & sponsor banners',
      features: [
        'Weekly 7-day meal plan generation',
        'Pantry staple deduction & grocery consolidation',
        'One-tap grocery delivery checkout handoff',
        'Contextual sponsor promotions & grocery vouchers',
      ],
    },
    {
      id: 'individual',
      name: 'Individual Plan',
      audience: 'For solo cooks & single-person nutrition tracking',
      price: '$9',
      cadence: 'per month · Ad-free',
      description: 'Full NutriBalance MCP TDEE & macro calibration for one person with zero advertisements.',
      memberLimit: '1 individual profile',
      adPolicy: '100% Ad-Free workspace',
      features: [
        'All 5 NutriBalance MCP modes (Keto, High-Protein, Vegan, etc.)',
        'Daily Eating Score (0–100) & micronutrient deficiency fixes',
        'Distraction-free Daily Cooking View & timers',
        'Ad-free experience across all screens',
      ],
    },
    {
      id: 'family',
      name: 'Family Household Plan',
      audience: 'For multi-member households coordinating allergies & appetites',
      price: '$19',
      cadence: 'per month · Best Value',
      description: 'Complete Agent Chef 10-dinner household voting, multi-member portion scaling (2.75x), and priority delivery sync.',
      memberLimit: 'Up to 6 family members (Adults & Kids)',
      adPolicy: '100% Ad-Free + Priority Partner Slots',
      features: [
        'Multi-member appetite & TDEE calibration (Adults + Kids)',
        'Agent Chef 10-dinner weekly proposal & no-login family voting links',
        'Strict zero-allergen & sensory dislike safety enforcement',
        'Automated pantry stock tracking & 1-tap supermarket checkout',
      ],
    },
  ];

  return (
    <div className="pb-28 pt-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <span>Subscription & Monetisation</span>
            <span>·</span>
            <span>Instant State Gating (No Payment Processor Required)</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#1E3027] tracking-tight">
            Choose Your Household Plan
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            Switch tiers below to test state gating: selecting the <strong>Free Trial</strong> activates contextual sponsor banners across screens, while <strong>Individual ($9/mo)</strong> and <strong>Family ($19/mo)</strong> unlock an ad-free workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('admin')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors self-start lg:self-end font-mono"
        >
          <Lock className="w-3.5 h-3.5 text-[#233F33]" />
          Open /admin Revenue Metrics ($30k EOY Target)
        </button>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {tiers.map((tier) => {
          const isCurrent = currentTier === tier.id;
          return (
            <div
              key={tier.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'border-[#233F33] ring-2 ring-[#233F33]/15 shadow-xs'
                  : 'border-stone-200/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-2">
                  <span>{tier.audience}</span>
                  {isCurrent && (
                    <span className="font-mono font-bold text-[#233F33]">Active Tier</span>
                  )}
                </div>

                <h2 className="font-editorial text-2xl font-bold text-stone-900 mb-1">
                  {tier.name}
                </h2>

                <div className="flex items-baseline gap-2 my-4">
                  <span className="text-3xl font-bold text-[#1E3027] font-mono tabular-nums">
                    {tier.price}
                  </span>
                  <span className="text-xs text-stone-500">{tier.cadence}</span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mb-5">
                  {tier.description}
                </p>

                <div className="p-3 bg-[#FAFBF9] border border-stone-200/70 rounded-xl text-xs space-y-1.5 mb-5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Household Capacity:</span>
                    <span className="font-semibold text-stone-800">{tier.memberLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Ad Experience:</span>
                    <span className="font-semibold text-stone-800">{tier.adPolicy}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-stone-700">
                      <Check className="w-4 h-4 text-[#233F33] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSelectTier(tier.id)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-stone-100 text-stone-800 border border-stone-300'
                    : 'bg-[#233F33] text-white hover:bg-[#192F26]'
                }`}
              >
                {isCurrent ? `Current Plan: ${tier.name}` : `Switch to ${tier.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Concrete Comparison Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-6 py-4 bg-[#FAFBF9] border-b border-stone-200/70">
          <h3 className="font-editorial text-lg font-bold text-stone-900">
            Plan Capabilities & Monetisation Matrix
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 bg-stone-50/50">
                <th className="py-3 px-6 font-semibold">Feature / Capability</th>
                <th className="py-3 px-6 font-semibold">Free Trial ($0)</th>
                <th className="py-3 px-6 font-semibold">Individual ($9/mo)</th>
                <th className="py-3 px-6 font-semibold">Family ($19/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              <tr>
                <td className="py-3 px-6 font-sans font-medium text-stone-800">Household Members & Multipliers</td>
                <td className="py-3 px-6 text-stone-600">Up to 2 members</td>
                <td className="py-3 px-6 text-stone-600">1 Adult (1.0x)</td>
                <td className="py-3 px-6 text-[#233F33] font-bold">Unlimited (2.75x+ calibrated)</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-sans font-medium text-stone-800">NutriBalance MCP Dietary Modes</td>
                <td className="py-3 px-6 text-stone-600">Standard mode</td>
                <td className="py-3 px-6 text-stone-800">All 5 modes + TDEE</td>
                <td className="py-3 px-6 text-[#233F33] font-bold">All 5 modes + Kid Calcium/Omega-3</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-sans font-medium text-stone-800">Agent Chef 10-Dinner Voting Links</td>
                <td className="py-3 px-6 text-stone-600">7-day preview</td>
                <td className="py-3 px-6 text-stone-600">Solo queue</td>
                <td className="py-3 px-6 text-[#233F33] font-bold">Full household voting & auto-lock</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-sans font-medium text-stone-800">Contextual Sponsor Ads</td>
                <td className="py-3 px-6 text-amber-700">Displayed ($1k/mo stream)</td>
                <td className="py-3 px-6 text-emerald-700">None (Ad-Free)</td>
                <td className="py-3 px-6 text-emerald-700">None (Ad-Free)</td>
              </tr>
              <tr>
                <td className="py-3 px-6 font-sans font-medium text-stone-800">Connected Supermarket 2% Referral Handoff</td>
                <td className="py-3 px-6 text-stone-800">Included</td>
                <td className="py-3 px-6 text-stone-800">Included</td>
                <td className="py-3 px-6 text-[#233F33] font-bold">Priority Delivery Slots</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
