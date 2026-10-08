import React from 'react';
import { SubscriptionTier, TabType } from '../types';
import { ExternalLink, Shield, Lock } from 'lucide-react';

interface FooterProps {
  subscriptionTier: SubscriptionTier;
  onNavigate: (tab: TabType) => void;
}

export function Footer({ subscriptionTier, onNavigate }: FooterProps) {
  return (
    <footer className="bg-white border-t border-stone-200 mt-auto pb-20 sm:pb-8 pt-6 text-xs text-stone-500 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-stone-800">
              <span>Heirloom Table • Smart Family Kitchen & Agent Chef</span>
              <span>·</span>
              <span className="font-mono text-[11px] text-[#233F33]">
                Plan: {subscriptionTier === 'family' ? 'Family ($19/mo)' : subscriptionTier === 'individual' ? 'Individual ($9/mo)' : 'Free Trial (Ad-Supported)'}
              </span>
            </div>
            <p className="text-stone-500 leading-relaxed max-w-3xl">
              Data & AI Attribution: Powered by{' '}
              <a
                href="https://smithery.ai/server/NutriBalance/nutribalance-mcp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#233F33] underline hover:text-stone-900 inline-flex items-center gap-0.5 font-medium"
              >
                NutriBalance MCP (Smithery)
                <ExternalLink className="w-2.5 h-2.5" />
              </a>{' '}
              (licensed under{' '}
              <a
                href="https://opensource.org/licenses/MIT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#233F33] underline hover:text-stone-900 font-medium"
              >
                MIT / CC BY 4.0
              </a>
              ),{' '}
              <a
                href="https://spoonacular.com/food-api/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#233F33] underline hover:text-stone-900 inline-flex items-center gap-0.5 font-medium"
              >
                Spoonacular Food API Terms
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              , and{' '}
              <a
                href="https://ai.google.dev/gemini-api/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#233F33] underline hover:text-stone-900 inline-flex items-center gap-0.5 font-medium"
              >
                Google Gemini API
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              .
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap shrink-0">
            <button
              onClick={() => onNavigate('subscription')}
              className="text-stone-600 hover:text-stone-900 font-medium underline-offset-4 hover:underline"
            >
              Subscription & Pricing
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => onNavigate('agent-chef')}
              className="text-stone-600 hover:text-stone-900 font-medium underline-offset-4 hover:underline"
            >
              Agent Chef (10-Dinner Vote)
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => onNavigate('admin')}
              className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 font-mono text-[11px]"
              title="Internal Revenue & Unit Economics Admin Console (/admin)"
            >
              <Lock className="w-3 h-3" />
              /admin
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-stone-400">
          <p className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>
              Academic Disclaimer: This application is an <strong>SMU course project</strong> and is not affiliated with, sponsored by, or endorsed by NutriBalance, Smithery, Spoonacular, or any commercial supermarket or delivery provider.
            </span>
          </p>
          <span className="font-mono shrink-0">MCP: mcp.smithery.ai/ghyeogh</span>
        </div>
      </div>
    </footer>
  );
}
