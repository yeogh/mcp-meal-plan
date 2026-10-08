import React from 'react';
import { SubscriptionTier } from '../types';
import { Sparkles, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface ContextualAdBannerProps {
  tier: SubscriptionTier;
  context: 'menu' | 'shopping' | 'cooking' | 'agent';
  onUpgradeClick: () => void;
}

const AD_PLACEMENTS = {
  menu: {
    sponsor: 'Organic Island Harvest • Sponsored Partner',
    headline: 'Fresh Kid-Safe Organic Produce Box — $15 Off First Family Delivery',
    subtext: 'Zero-peanut certified packhouse • Sustainably grown baby bok choy, Roma tomatoes & Fuji apples delivered every Sunday.',
    cta: 'Claim $15 Voucher',
  },
  shopping: {
    sponsor: 'Cold Storage & FairPrice Express • Merchant Partner',
    headline: 'Free Same-Day Chilled Delivery on Consolidated Carts Over SGD $80',
    subtext: 'Directly sync your Heirloom Table pantry-deducted list with zero cold-chain surcharge this week.',
    cta: 'Apply Free Delivery',
  },
  cooking: {
    sponsor: 'Lee Kum Kee Culinary Partner • Sponsored',
    headline: 'Double-Fermented First Draw Light Soy & Pure Roasted Sesame Oil',
    subtext: 'Crafted for authentic Cantonese steamed sea bass and 25-minute weekday wok stir-fries.',
    cta: 'Add to Next Week Cart',
  },
  agent: {
    sponsor: 'NutriBalance Dietician Network • Sponsored',
    headline: '1-on-1 Pediatric & Sports Family Macro Calibration Session',
    subtext: 'Personalise your household TDEE and micronutrient targets with a registered Singapore nutritionist.',
    cta: 'Book Free 15-Min Consult',
  },
};

export function ContextualAdBanner({ tier, context, onUpgradeClick }: ContextualAdBannerProps) {
  if (tier !== 'free') {
    return null;
  }

  const ad = AD_PLACEMENTS[context] || AD_PLACEMENTS.menu;

  return (
    <div className="mb-6 bg-[#FAFBF9] border border-stone-200/90 rounded-xl p-4 shadow-2xs no-print">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono">
            <span>Sponsored Placement · Free Trial Tier</span>
            <span>·</span>
            <span>{ad.sponsor}</span>
          </div>
          <h3 className="text-sm font-bold text-[#1E3027]">
            {ad.headline}
          </h3>
          <p className="text-xs text-stone-600 max-w-2xl">
            {ad.subtext}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={onUpgradeClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#233F33]" />
            Remove Ads ($9/mo)
          </button>
          <button
            type="button"
            onClick={onUpgradeClick}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#233F33] hover:bg-[#192F26] rounded-lg transition-colors whitespace-nowrap"
          >
            <span>{ad.cta}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
