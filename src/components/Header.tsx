import { TabType, SubscriptionTier } from '../types';
import { RefreshCw, Sparkles, Activity } from 'lucide-react';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onGenerateClick: () => void;
  onRefreshClick: () => void;
  onCheckApisClick: () => void;
  cartCount: number;
  subscriptionTier?: SubscriptionTier;
}

export function Header({
  activeTab,
  setActiveTab,
  onGenerateClick,
  onRefreshClick,
  onCheckApisClick,
  cartCount,
  subscriptionTier = 'family',
}: HeaderProps) {
  const navItems: { id: TabType; label: string }[] = [
    { id: 'menu', label: 'Weekly Menu' },
    { id: 'shopping', label: `Shopping List (${cartCount})` },
    { id: 'cooking', label: 'Daily Cooking' },
    { id: 'agent-chef', label: 'Agent Chef' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'subscription', label: 'Plans' },
  ];

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          className="font-editorial font-bold text-xl text-[#1F3329] tracking-tight whitespace-nowrap focus:outline-none"
        >
          Heirloom Table
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`py-5 font-medium transition-colors relative whitespace-nowrap ${
                activeTab === item.id
                  ? 'text-[#233F33] font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {item.label}
              {activeTab === item.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#233F33]" />
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCheckApisClick}
            title="Check Spoonacular, Gemini & NutriBalance MCP health"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Check APIs</span>
          </button>

          <button
            type="button"
            onClick={onGenerateClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#233F33] hover:bg-[#1a3026] rounded-lg shadow-2xs transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Generate Menu</span>
            <span className="sm:hidden">Generate</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="flex md:hidden border-t border-stone-100 px-4 py-2 gap-2 overflow-x-auto bg-[#FBFBFA]">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
              activeTab === item.id
                ? 'bg-[#233F33] text-white font-medium'
                : 'text-stone-600 bg-stone-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}

