import React from 'react';
import { ReferralOrderRecord, SubscriptionTier } from '../types';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Megaphone,
  Layers,
  Target,
  Share2,
  Handshake,
  Cpu,
} from 'lucide-react';

interface AdminMetricsScreenProps {
  subscriptionTier: SubscriptionTier;
  referralOrders: ReferralOrderRecord[];
  onSelectTier: (tier: SubscriptionTier) => void;
}

export function AdminMetricsScreen({
  subscriptionTier,
  referralOrders,
  onSelectTier,
}: AdminMetricsScreenProps) {
  // Base EOY target breakdown from business case
  const familyMrr = 19000; // 1,000 users @ $19/mo
  const individualMrr = 4500; // 500 users @ $9/mo
  const referralBaseMrr = 4000; // 2% referral on $100/wk across 500 users = $4,000/mo
  const adRevenueMrr = 1000; // On-platform contextual ad revenue = $1,000/mo
  const merchantSponsorMrr = 1500; // Commercial home-delivery & supermarket booth partnerships

  const sessionReferralCommission = referralOrders.reduce(
    (sum, o) => sum + o.referralCommission,
    0
  );
  const sessionGrossGmv = referralOrders.reduce((sum, o) => sum + o.orderTotal, 0);

  const projectedMrr =
    familyMrr + individualMrr + referralBaseMrr + adRevenueMrr + merchantSponsorMrr + sessionReferralCommission;
  const eoyTargetMrr = 30000;
  const targetProgressPct = Math.min(100, Math.round((projectedMrr / eoyTargetMrr) * 100));

  const budgetAllocation = [
    {
      phase: '01. Ideation & UI/UX Design',
      range: '$10,000 – $15,000',
      midpoint: 12500,
      details: 'Household ethnography, multi-member portion UX, family voting wireframes',
    },
    {
      phase: '02. Development & MVP Engineering',
      range: '$30,000 – $50,000',
      midpoint: 40000,
      details: 'Calorie/food logging engine, AI & computer vision integration, NutriBalance MCP protocol testing',
    },
    {
      phase: '03. Production & SaaS Scaling',
      range: '$30,000 – $50,000',
      midpoint: 40000,
      details: 'Serverless SaaS middleware, Spoonacular/Gemini orchestration, supermarket cart handoff APIs',
    },
    {
      phase: '04. Year 1 Consumer Marketing',
      range: '$50,000+',
      midpoint: 55000,
      details: 'Influencer B2C acquisition, supermarket roadshows, parenting group trials, delivery app ads',
    },
  ];

  return (
    <div className="pb-28 pt-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 font-mono mb-1">
            <span>INTERNAL EXECUTIVE TELEMETRY</span>
            <span>·</span>
            <span>ROUTE: /admin</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#1E3027] tracking-tight">
            North-Star Goal: Achieve $30,000/Month MRR by EOY
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Live unit economics, revenue stream decomposition, $120k–$165k capital allocation budget, and NutriBalance MCP partner ecosystem metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-2 text-xs">
          <span className="text-stone-500 px-2">Simulate Active User Tier:</span>
          {(['free', 'individual', 'family'] as SubscriptionTier[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSelectTier(t)}
              className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${
                subscriptionTier === t
                  ? 'bg-[#233F33] text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Primary EOY Revenue Progress Card */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 mb-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-semibold text-stone-500">
              EOY Recurring Revenue Run-Rate Target
            </span>
            <div className="flex items-baseline gap-3 mt-1 font-mono">
              <span className="text-3xl sm:text-4xl font-bold text-[#1E3027] tabular-nums">
                ${projectedMrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-stone-500 tabular-nums">
                / $30,000.00 monthly target ({targetProgressPct}%)
              </span>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-xs text-stone-500 block font-sans">Live Session 2% Referral Earned</span>
            <span className="text-lg font-bold text-emerald-700 tabular-nums">
              +SGD ${sessionReferralCommission.toFixed(2)} ({referralOrders.length} orders · GMV SGD ${sessionGrossGmv.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden mb-4">
          <div
            className="bg-[#233F33] h-full rounded-full transition-all duration-300"
            style={{ width: `${targetProgressPct}%` }}
          />
        </div>

        {/* 4 Core Revenue Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-[#FAFBF9] border border-stone-200/70 rounded-xl">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>Family Tier ($19/mo)</span>
              <Users className="w-4 h-4 text-[#233F33]" />
            </div>
            <p className="text-xl font-bold text-stone-900 font-mono tabular-nums">$19,000 / mo</p>
            <p className="text-[11px] text-stone-500 mt-1 font-mono">1,000 household subscribers</p>
          </div>

          <div className="p-4 bg-[#FAFBF9] border border-stone-200/70 rounded-xl">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>Individual Tier ($9/mo)</span>
              <DollarSign className="w-4 h-4 text-[#233F33]" />
            </div>
            <p className="text-xl font-bold text-stone-900 font-mono tabular-nums">$4,500 / mo</p>
            <p className="text-[11px] text-stone-500 mt-1 font-mono">500 solo subscribers</p>
          </div>

          <div className="p-4 bg-[#FAFBF9] border border-stone-200/70 rounded-xl">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>2% Delivery Platform Referral</span>
              <ShoppingBag className="w-4 h-4 text-[#B45309]" />
            </div>
            <p className="text-xl font-bold text-stone-900 font-mono tabular-nums">
              ${(referralBaseMrr + sessionReferralCommission).toFixed(2)} / mo
            </p>
            <p className="text-[11px] text-stone-500 mt-1 font-mono">$100/wk spend × 500 households</p>
          </div>

          <div className="p-4 bg-[#FAFBF9] border border-stone-200/70 rounded-xl">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>On-Platform Ads & B2B</span>
              <Megaphone className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="text-xl font-bold text-stone-900 font-mono tabular-nums">$2,500 / mo</p>
            <p className="text-[11px] text-stone-500 mt-1 font-mono">$1k contextual ads + $1.5k merchant placements</p>
          </div>
        </div>
      </div>

      {/* Cost Budget ($120k-$165k) & Business Model Canvas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Cost Budget Table */}
        <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="px-6 py-4 bg-[#FAFBF9] border-b border-stone-200/70 flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-lg font-bold text-stone-900">
                Capital & Cost Budget Allocation ($120k – $165k Total)
              </h2>
              <p className="text-xs text-stone-500">
                Year 1 engineering, MCP middleware, and B2C acquisition investment
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#233F33]">$120k–$165k</span>
          </div>

          <div className="divide-y divide-stone-100">
            {budgetAllocation.map((item) => (
              <div key={item.phase} className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">{item.phase}</h3>
                  <p className="text-xs text-stone-600 mt-0.5">{item.details}</p>
                </div>
                <div className="font-mono text-sm font-bold text-[#1E3027] shrink-0 tabular-nums">
                  {item.range}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ecosystem & GTM Channels */}
        <div className="lg:col-span-5 bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <h2 className="font-editorial text-lg font-bold text-stone-900">
            Customer Segments, Channels & Partners
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#FAFBF9] rounded-xl border border-stone-200/60">
              <div className="font-bold text-stone-900 flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-[#233F33]" />
                Customer Segments
              </div>
              <p className="text-stone-600 leading-relaxed">
                Family meal planners coordinating multi-member calories & allergies, commercial home-delivery meal providers, ad sponsors, and grocery merchants (supermarket chains & delivery platforms).
              </p>
            </div>

            <div className="p-3 bg-[#FAFBF9] rounded-xl border border-stone-200/60">
              <div className="font-bold text-stone-900 flex items-center gap-1.5 mb-1">
                <Share2 className="w-3.5 h-3.5 text-[#233F33]" />
                Key Acquisition Channels
              </div>
              <p className="text-stone-600 leading-relaxed">
                Social media, ads on grocery delivery platforms, booths & roadshows at supermarkets, parenting groups, cooking communities, and a <strong>Free 1-Week Trial</strong>.
              </p>
            </div>

            <div className="p-3 bg-[#FAFBF9] rounded-xl border border-stone-200/60">
              <div className="font-bold text-stone-900 flex items-center gap-1.5 mb-1">
                <Handshake className="w-3.5 h-3.5 text-[#233F33]" />
                Key Resources & Partners
              </div>
              <p className="text-stone-600 leading-relaxed">
                <strong>Partners:</strong> Supermarkets, families, restaurants, dieticians, food delivery platforms.{' '}
                <strong>Resources:</strong> Venture funds, NutriBalance MCP (`mcp.smithery.ai/ghyeogh`), age-group nutrient datasets.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Referral Orders Ledger */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-6 py-4 bg-[#FAFBF9] border-b border-stone-200/70 flex items-center justify-between">
          <div>
            <h3 className="font-editorial text-lg font-bold text-stone-900">
              Connected Delivery Platform Referral Ledger (2% Commission)
            </h3>
            <p className="text-xs text-stone-500">
              Orders placed via Shopping List or Agent Chef checkout immediately record 2% referral revenue here
            </p>
          </div>
          <span className="font-mono text-xs text-stone-600 tabular-nums">
            {referralOrders.length} order(s) logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 bg-stone-50/50">
                <th className="py-3 px-6 font-semibold">Order ID</th>
                <th className="py-3 px-6 font-semibold">Delivery Partner</th>
                <th className="py-3 px-6 font-semibold">Items</th>
                <th className="py-3 px-6 font-semibold text-right">Cart Subtotal</th>
                <th className="py-3 px-6 font-semibold text-right">2% Platform Referral</th>
                <th className="py-3 px-6 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {referralOrders.map((ord) => (
                <tr key={ord.id}>
                  <td className="py-3 px-6 text-stone-700">{ord.id}</td>
                  <td className="py-3 px-6 font-sans font-semibold text-stone-900">{ord.vendorName}</td>
                  <td className="py-3 px-6 text-stone-600 tabular-nums">{ord.itemCount} items</td>
                  <td className="py-3 px-6 text-right text-stone-800 tabular-nums">SGD ${ord.orderSubtotal.toFixed(2)}</td>
                  <td className="py-3 px-6 text-right font-bold text-emerald-700 tabular-nums">
                    +SGD ${ord.referralCommission.toFixed(2)}
                  </td>
                  <td className="py-3 px-6 text-right text-stone-400">{ord.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
