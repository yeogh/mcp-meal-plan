/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  TabType,
  ShoppingItem,
  CategoryGroup,
  HouseholdPreferences,
  MenuItem,
  ApiHealthResponse,
  SubscriptionTier,
  DietaryMode,
  NutriBalanceProfile,
  ReferralOrderRecord,
} from './types';
import {
  initialCategories,
  initialPreferences,
  initialWeeklyMenu,
  extraAgentCandidates,
} from './data/initialData';
import { Header } from './components/Header';
import { ShoppingListScreen } from './components/ShoppingListScreen';
import { PreferencesScreen } from './components/PreferencesScreen';
import { WeeklyMenuScreen } from './components/WeeklyMenuScreen';
import { DailyCookingScreen } from './components/DailyCookingScreen';
import { AgentChefScreen } from './components/AgentChefScreen';
import { SubscriptionScreen } from './components/SubscriptionScreen';
import { AdminMetricsScreen } from './components/AdminMetricsScreen';
import { Footer } from './components/Footer';
import { AddCustomItemModal } from './components/AddCustomItemModal';
import { EditQtyModal } from './components/EditQtyModal';
import { GenerateMenuModal } from './components/GenerateMenuModal';
import { OrderGroceriesModal } from './components/OrderGroceriesModal';
import { ApiHealthModal } from './components/ApiHealthModal';
import { Toast } from './components/Toast';
import { consolidateShoppingList } from '../lib/grocery-calculator.js';

function resolveInitialTab(): TabType {
  const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const queryTab = (params.get('tab') || '').toLowerCase();
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();

  const candidate = queryTab || hash || path;
  const validTabs: TabType[] = [
    'menu',
    'shopping',
    'cooking',
    'agent-chef',
    'preferences',
    'subscription',
    'admin',
  ];
  if (validTabs.includes(candidate as TabType)) {
    return candidate as TabType;
  }
  return 'menu';
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<TabType>(resolveInitialTab);

  const setActiveTab = useCallback((nextTab: TabType) => {
    setActiveTabState(nextTab);
    try {
      const nextUrl = nextTab === 'admin' ? '/admin' : `/?tab=${nextTab}`;
      window.history.pushState({ tab: nextTab }, '', nextUrl);
    } catch {
      // ignore in restricted iframe contexts
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setActiveTabState(resolveInitialTab());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Persistence in localStorage
  const [categories, setCategories] = useState<CategoryGroup[]>(() => {
    const saved = localStorage.getItem('heirloom_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialCategories;
  });

  const [preferences, setPreferences] = useState<HouseholdPreferences>(() => {
    const saved = localStorage.getItem('heirloom_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialPreferences;
  });

  const [weeklyMenu, setWeeklyMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('heirloom_menu');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].macros) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialWeeklyMenu;
  });

  // 10 Candidate Dinners for Agent Chef & Household Voting
  const [agentCandidates, setAgentCandidates] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('heirloom_agent_candidates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [...initialWeeklyMenu, ...extraAgentCandidates];
  });

  // Subscription Tier state ('free' | 'individual' | 'family')
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(() => {
    const saved = localStorage.getItem('heirloom_subscription_tier');
    if (saved === 'free' || saved === 'individual' || saved === 'family') {
      return saved;
    }
    return 'free'; // Default to Free Trial so contextual ads & gating are immediately visible
  });

  // NutriBalance MCP state
  const [dietaryMode, setDietaryMode] = useState<DietaryMode>('standard');
  const [nutriProfile, setNutriProfile] = useState<NutriBalanceProfile | null>(null);
  const [isRefreshingMcp, setIsRefreshingMcp] = useState(false);

  // Connected Delivery Platform 2% Referral Orders Ledger
  const [referralOrders, setReferralOrders] = useState<ReferralOrderRecord[]>([
    {
      id: 'ORD-8421',
      vendorName: 'NTUC FairPrice Express',
      orderSubtotal: 96.5,
      deliveryFee: 3.99,
      orderTotal: 100.49,
      referralCommission: 1.93,
      timestamp: 'Sun 10:15 AM',
      itemCount: 14,
    },
    {
      id: 'ORD-8490',
      vendorName: 'Sheng Siong AllForYou',
      orderSubtotal: 84.0,
      deliveryFee: 5.0,
      orderTotal: 89.0,
      referralCommission: 1.68,
      timestamp: 'Wed 05:40 PM',
      itemCount: 11,
    },
  ]);

  // Modal and dialog states
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // API Generation states
  const [isGeneratingMenu, setIsGeneratingMenu] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // API Health states
  const [healthStatus, setHealthStatus] = useState<ApiHealthResponse | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('heirloom_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('heirloom_preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('heirloom_menu', JSON.stringify(weeklyMenu));
  }, [weeklyMenu]);

  useEffect(() => {
    localStorage.setItem('heirloom_agent_candidates', JSON.stringify(agentCandidates));
  }, [agentCandidates]);

  useEffect(() => {
    localStorage.setItem('heirloom_subscription_tier', subscriptionTier);
  }, [subscriptionTier]);

  // Fetch NutriBalance MCP profile & 10 candidates
  const handleRefreshNutriBalance = useCallback(
    async (targetMode: DietaryMode, silent = false) => {
      setDietaryMode(targetMode);
      setIsRefreshingMcp(true);
      try {
        const res = await fetch('/api/nutribalance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dietaryMode: targetMode,
            members: preferences.members,
            dietaryRestrictions: preferences.dietaryRestrictions,
          }),
        });

        const data = await res.json();
        if (data.profile) {
          setNutriProfile(data.profile);
        }
        if (Array.isArray(data.candidates) && data.candidates.length > 0) {
          setAgentCandidates(data.candidates);
          // Also update unlocked days in weeklyMenu with mode-calibrated macros
          const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          setWeeklyMenu((prev) =>
            daysOfWeek.map((dayName, idx) => {
              const existing = prev.find((m) => m.day === dayName);
              if (existing?.isLocked) return existing;
              const cand = data.candidates[idx % data.candidates.length];
              return {
                ...cand,
                id: `menu-${dayName.toLowerCase().slice(0, 3)}`,
                day: dayName,
                isLocked: false,
              };
            })
          );
        }
        if (!silent) {
          setToastMessage(
            `NutriBalance MCP calibrated TDEE, macros & 10 dinners for ${targetMode.toUpperCase()} mode!`
          );
        }
      } catch (err: any) {
        if (!silent) {
          setToastMessage(`NutriBalance MCP notice: ${err.message || 'Using cached profile'}`);
        }
      } finally {
        setIsRefreshingMcp(false);
      }
    },
    [preferences.members, preferences.dietaryRestrictions]
  );

  // Load initial NutriBalance MCP profile on mount
  useEffect(() => {
    handleRefreshNutriBalance('standard', true);
  }, []);

  // Check APIs health endpoint
  const handleCheckApis = async () => {
    setIsHealthLoading(true);
    setIsHealthOpen(true);
    try {
      const res = await fetch('/api/health');
      const contentType = res.headers.get('content-type') || '';

      if (res.status === 404) {
        const notFoundMsg = 'API route not found (/api/health returned 404).';
        setHealthStatus({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          providers: {
            spoonacular: { status: 'error', responseTimeMs: null, error: notFoundMsg },
            gemini: { status: 'error', responseTimeMs: null, error: notFoundMsg },
          },
        });
        setToastMessage(notFoundMsg);
        return;
      }

      if (!contentType.includes('application/json')) {
        const htmlMsg = `Backend returned non-JSON content (${res.status}).`;
        setHealthStatus({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          providers: {
            spoonacular: { status: 'error', responseTimeMs: null, error: htmlMsg },
            gemini: { status: 'error', responseTimeMs: null, error: htmlMsg },
          },
        });
        setToastMessage(htmlMsg);
        return;
      }

      const data: ApiHealthResponse = await res.json();
      setHealthStatus(data);

      const geminiProv = data.providers?.gemini;
      const spoonProv = data.providers?.spoonacular;
      const nbProv = data.providers?.nutribalance;

      const diagnostics: string[] = [];
      if (geminiProv) {
        diagnostics.push(geminiProv.status === 'ok' ? 'Gemini OK' : `Gemini: ${geminiProv.status}`);
      }
      if (spoonProv) {
        diagnostics.push(spoonProv.status === 'ok' ? 'Spoonacular OK' : `Spoonacular: ${spoonProv.status}`);
      }
      if (nbProv) {
        diagnostics.push(nbProv.status === 'ok' ? 'NutriBalance MCP OK' : `NutriBalance MCP: ${nbProv.status}`);
      }
      setToastMessage(diagnostics.join(' · '));
    } catch (networkErr: any) {
      const netMsg = `Network connection error: ${networkErr.message || 'Server unreachable'}`;
      setHealthStatus({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        providers: {
          spoonacular: { status: 'error', responseTimeMs: null, error: netMsg },
          gemini: { status: 'error', responseTimeMs: null, error: netMsg },
        },
      });
      setToastMessage(netMsg);
    } finally {
      setIsHealthLoading(false);
    }
  };

  // Generate Weekly Menu from /api/meal-plan
  const handleGenerateMealPlan = async (swapDay?: string) => {
    setIsGeneratingMenu(true);
    setGenerationError(null);

    try {
      const lockedDays = weeklyMenu
        .filter((m) => m.isLocked && m.day !== swapDay)
        .map((m) => m.day);

      const payload = {
        householdSize: { adults: preferences.adults, children: preferences.children },
        appetiteSettings: preferences.members,
        dietaryRestrictions: preferences.dietaryRestrictions,
        dislikedIngredients: preferences.dislikedIngredients,
        cookingTimePreferences: preferences.maxCookingTime,
        primaryCuisines: preferences.primaryCuisines.filter((c) => c.active).map((c) => c.name),
        lockedDays,
        existingMenu: weeklyMenu,
        swapDay: swapDay || null,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON (${response.status}).`);
      }

      const data = await response.json();

      if (data.menu && Array.isArray(data.menu)) {
        const nextMenu: MenuItem[] = data.menu.map((m: MenuItem) => {
          const oldMeal = weeklyMenu.find((o) => o.day === m.day);
          return {
            ...m,
            isLocked: oldMeal?.isLocked || false,
          };
        });

        setWeeklyMenu(nextMenu);

        const customItems = categories
          .flatMap((c) => c.items)
          .filter((i) => i.id.startsWith('item-custom-'));

        const newConsolidated = consolidateShoppingList(nextMenu, preferences, categories);

        if (customItems.length > 0) {
          customItems.forEach((custom) => {
            const cat = newConsolidated.find((c: CategoryGroup) => c.id === custom.category);
            if (cat) cat.items.unshift(custom);
          });
        }

        setCategories(newConsolidated);
        setIsDemoMode(Boolean(data.isDemo));
        setToastMessage(
          swapDay
            ? `Replaced ${swapDay}'s dinner and updated consolidated grocery list!`
            : 'Weekly menu generated and consolidated with pantry stock!'
        );
        setIsGenerateOpen(false);
      } else {
        throw new Error(data.error || 'Failed to assemble weekly menu');
      }
    } catch (err: any) {
      const errMsg = err.name === 'AbortError' ? 'Request timed out after 20s' : (err.message || 'Service unavailable');
      setGenerationError(errMsg);
      setToastMessage(`Notice: ${errMsg}. Current menu kept safely.`);
    } finally {
      setIsGeneratingMenu(false);
    }
  };

  // Vote on a meal in WeeklyMenuScreen
  const handleVoteMeal = (dayName: string, voterName: string) => {
    setWeeklyMenu((prev) =>
      prev.map((m) => {
        if (m.day !== dayName) return m;
        const votedBy = m.votedBy || [];
        const alreadyVoted = votedBy.includes(voterName);
        const nextVotedBy = alreadyVoted
          ? votedBy.filter((v) => v !== voterName)
          : [...votedBy, voterName];
        const nextVotes = Math.max(0, (m.votes ?? 2) + (alreadyVoted ? -1 : 1));
        return { ...m, votes: nextVotes, votedBy: nextVotedBy };
      })
    );
    setToastMessage(`Recorded ${voterName}'s vote for ${dayName}'s dinner!`);
  };

  // Add feedback comment on a meal in WeeklyMenuScreen
  const handleAddMealFeedback = (dayName: string, voterName: string, comment: string) => {
    setWeeklyMenu((prev) =>
      prev.map((m) => {
        if (m.day !== dayName) return m;
        const nextFeedback = [
          ...(m.feedback || []),
          {
            id: `fb-${Date.now()}`,
            memberName: voterName,
            comment,
            timestamp: 'Just now',
            vote: 'up' as const,
          },
        ];
        return { ...m, feedback: nextFeedback };
      })
    );
    setToastMessage(`Added ${voterName}'s feedback on ${dayName}'s dinner!`);
  };

  // Vote on a candidate in AgentChefScreen (10 candidates)
  const handleVoteCandidate = (candidateId: string, voterName: string) => {
    setAgentCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const votedBy = c.votedBy || [];
        const hasVoted = votedBy.includes(voterName);
        const nextVotedBy = hasVoted
          ? votedBy.filter((v) => v !== voterName)
          : [...votedBy, voterName];
        const nextVotes = Math.max(0, (c.votes || 0) + (hasVoted ? -1 : 1));
        return { ...c, votes: nextVotes, votedBy: nextVotedBy };
      })
    );
    setToastMessage(`Updated ${voterName}'s vote on candidate dinner!`);
  };

  // Add feedback on a candidate in AgentChefScreen
  const handleAddCandidateFeedback = (candidateId: string, voterName: string, comment: string) => {
    setAgentCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        return {
          ...c,
          feedback: [
            ...(c.feedback || []),
            {
              id: `cfb-${Date.now()}`,
              memberName: voterName,
              comment,
              timestamp: 'Just now',
              vote: 'up' as const,
            },
          ],
        };
      })
    );
    setToastMessage(`Saved ${voterName}'s note on candidate recipe!`);
  };

  // Finalize Top 7 voted candidates from Agent Chef -> Weekly Menu -> Consolidated Grocery List
  const handleFinalizeTopSeven = () => {
    const sorted = [...agentCandidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const winners: MenuItem[] = daysOfWeek.map((dayName, idx) => {
      const winner = sorted[idx % sorted.length];
      return {
        ...winner,
        id: `menu-${dayName.toLowerCase().slice(0, 3)}`,
        day: dayName,
        isLocked: true,
      };
    });

    setWeeklyMenu(winners);
    const recomputed = consolidateShoppingList(winners, preferences, categories);
    setCategories(recomputed);
    setToastMessage(
      'Locked top 7 voted dinners and auto-consolidated grocery cart minus pantry stock!'
    );
  };

  // Record 2% referral order from connected delivery platform
  const handleOrderConfirmed = (record: ReferralOrderRecord) => {
    setReferralOrders((prev) => [record, ...prev]);
    setToastMessage(
      `Order sent to ${record.vendorName}! Earned SGD $${record.referralCommission.toFixed(2)} (2% referral) toward $30k EOY target.`
    );
  };

  // Toggle lock status on a meal
  const handleToggleLockDay = (dayName: string) => {
    setWeeklyMenu((prev) =>
      prev.map((item) =>
        item.day === dayName ? { ...item, isLocked: !item.isLocked } : item
      )
    );
    const target = weeklyMenu.find((m) => m.day === dayName);
    setToastMessage(
      target?.isLocked
        ? `Unlocked ${dayName}'s dinner for regeneration.`
        : `Locked ${dayName}'s dinner.`
    );
  };

  // Shopping list item toggling
  const handleToggleItem = (itemId: string) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item) =>
          item.id === itemId
            ? { ...item, isChecked: !item.isChecked }
            : item
        ),
      }))
    );
  };

  // Edit quantity & price
  const handleSaveEditQty = (
    itemId: string,
    updatedQty: string,
    updatedPrice?: number,
    updatedCalc?: string
  ) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantityNote: updatedQty,
                price: updatedPrice,
                calcNote: updatedCalc,
              }
            : item
        ),
      }))
    );
    setToastMessage('Item quantity and pricing updated!');
  };

  // Add custom grocery item
  const handleAddCustomItem = (newItem: ShoppingItem, categoryId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: [newItem, ...cat.items] }
          : cat
      )
    );
    setToastMessage(`Added "${newItem.name}" to shopping list!`);
  };

  // Copy plain text list
  const handleCopyList = () => {
    const lines: string[] = [
      'HEIRLOOM TABLE • CONSOLIDATED GROCERY LIST',
      `Calculated for Oct 21 – Oct 27 (${preferences.adults} Adults + ${preferences.children} Child)\n`,
    ];

    categories.forEach((cat) => {
      const activeItems = cat.items.filter((i) => !i.isChecked);
      if (activeItems.length > 0) {
        lines.push(`\n${cat.title}:`);
        activeItems.forEach((i) => {
          const priceStr = i.price ? ` [SGD $${i.price.toFixed(2)}]` : '';
          lines.push(`  • ${i.name} (${i.quantityNote})${priceStr}`);
          if (i.calcNote) lines.push(`    ↳ ${i.calcNote}`);
        });
      }
    });

    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    setToastMessage('Shopping list copied to clipboard!');
  };

  // Export to WhatsApp format (copies to clipboard without calling window.open)
  const handleExportWhatsApp = () => {
    const lines: string[] = [
      '*HEIRLOOM TABLE • GROCERY RUN*',
      '_Oct 21 – Oct 27 (Household Yield 2.75x)_\n',
    ];

    categories.forEach((cat) => {
      const toBuy = cat.items.filter((i) => !i.isChecked && !i.pantryDeducted);
      if (toBuy.length > 0) {
        lines.push(`*${cat.title.toUpperCase()}*`);
        toBuy.forEach((i) => {
          const price = i.price ? ` ~ SGD $${i.price.toFixed(2)}` : '';
          lines.push(`• ${i.name} - *${i.quantityNote}*${price}`);
        });
        lines.push('');
      }
    });

    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    setToastMessage('WhatsApp formatted grocery list copied to clipboard!');
  };

  // Print list
  const handlePrintList = () => {
    window.print();
  };

  // Toggle pantry math
  const handleTogglePantryMath = () => {
    setPreferences((prev) => ({
      ...prev,
      showPantryDeductionsMath: !prev.showPantryDeductionsMath,
    }));
  };

  // Update preferences & auto-recalculate grocery list
  const handleUpdatePreferences = (updated: HouseholdPreferences) => {
    setPreferences(updated);
    const customItems = categories
      .flatMap((c) => c.items)
      .filter((i) => i.id.startsWith('item-custom-'));

    const recomputed = consolidateShoppingList(weeklyMenu, updated, categories);
    if (customItems.length > 0) {
      customItems.forEach((custom) => {
        const cat = recomputed.find((c: CategoryGroup) => c.id === custom.category);
        if (cat) cat.items.unshift(custom);
      });
    }
    setCategories(recomputed);
  };

  // Reset to original defaults
  const handleResetDefaults = () => {
    setCategories(initialCategories);
    setPreferences(initialPreferences);
    setWeeklyMenu(initialWeeklyMenu);
    setAgentCandidates([...initialWeeklyMenu, ...extraAgentCandidates]);
    setToastMessage('Restored kitchen blueprint defaults!');
  };

  const handleSavePreferences = () => {
    setToastMessage('Preferences & household multipliers saved!');
  };

  const allItems = categories.flatMap((c) => c.items);
  const activeCartCount = allItems.filter((i) => !i.isChecked).length;
  const totalEstimatedCost = allItems
    .filter((i) => i.price && !i.pantryDeducted)
    .reduce((sum, i) => sum + (i.price || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col font-sans selection:bg-[#233F33] selection:text-white">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onGenerateClick={() => setIsGenerateOpen(true)}
        onRefreshClick={() => {
          const recomputed = consolidateShoppingList(weeklyMenu, preferences, categories);
          setCategories(recomputed);
          setToastMessage('Pantry inventory & recipe math synchronized!');
        }}
        onCheckApisClick={handleCheckApis}
        cartCount={activeCartCount}
        subscriptionTier={subscriptionTier}
      />

      {/* Screen View Switcher */}
      <main className="flex-1">
        {activeTab === 'menu' && (
          <WeeklyMenuScreen
            menuItems={weeklyMenu}
            preferences={preferences}
            dietaryMode={dietaryMode}
            nutriProfile={nutriProfile}
            subscriptionTier={subscriptionTier}
            onGenerateClick={() => setIsGenerateOpen(true)}
            onViewShoppingList={() => setActiveTab('shopping')}
            onOpenCookingView={() => setActiveTab('cooking')}
            onSwapMeal={(dayName) => handleGenerateMealPlan(dayName)}
            onToggleLockDay={handleToggleLockDay}
            onRegenerateUnlocked={() => handleGenerateMealPlan()}
            onRefreshNutriBalance={(mode) => handleRefreshNutriBalance(mode)}
            onVoteMeal={handleVoteMeal}
            onAddMealFeedback={handleAddMealFeedback}
            onUpgradeClick={() => setActiveTab('subscription')}
            onNotify={(msg) => setToastMessage(msg)}
            isLoading={isGeneratingMenu || isRefreshingMcp}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListScreen
            categories={categories}
            preferences={preferences}
            subscriptionTier={subscriptionTier}
            onToggleItem={handleToggleItem}
            onEditQty={(item) => setEditingItem(item)}
            onAddItem={() => setIsAddCustomOpen(true)}
            onCopyList={handleCopyList}
            onExportWhatsApp={handleExportWhatsApp}
            onPrintList={handlePrintList}
            onTogglePantryMath={handleTogglePantryMath}
            onOrderConfirmed={handleOrderConfirmed}
            onUpgradeClick={() => setActiveTab('subscription')}
          />
        )}

        {activeTab === 'cooking' && (
          <DailyCookingScreen
            menuItems={weeklyMenu}
            preferences={preferences}
            subscriptionTier={subscriptionTier}
            onUpgradeClick={() => setActiveTab('subscription')}
            onViewShoppingList={() => setActiveTab('shopping')}
            onNotify={(msg) => setToastMessage(msg)}
          />
        )}

        {activeTab === 'agent-chef' && (
          <AgentChefScreen
            candidates={agentCandidates}
            weeklyMenu={weeklyMenu}
            categories={categories}
            preferences={preferences}
            dietaryMode={dietaryMode}
            subscriptionTier={subscriptionTier}
            isRefreshingMcp={isRefreshingMcp}
            onChangeDietaryMode={(mode) => handleRefreshNutriBalance(mode)}
            onVoteCandidate={handleVoteCandidate}
            onAddCandidateFeedback={handleAddCandidateFeedback}
            onFinalizeTopSeven={handleFinalizeTopSeven}
            onOpenOrderModal={() => setIsOrderOpen(true)}
            onUpgradeClick={() => setActiveTab('subscription')}
            onNotify={(msg) => setToastMessage(msg)}
          />
        )}

        {activeTab === 'preferences' && (
          <PreferencesScreen
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onSavePreferences={handleSavePreferences}
            onResetDefaults={handleResetDefaults}
          />
        )}

        {activeTab === 'subscription' && (
          <SubscriptionScreen
            currentTier={subscriptionTier}
            onSelectTier={(tier) => {
              setSubscriptionTier(tier);
              setToastMessage(
                tier === 'free'
                  ? 'Switched to Free 1-Week Trial (Contextual sponsor ads enabled).'
                  : `Switched to ${tier === 'family' ? 'Family ($19/mo)' : 'Individual ($9/mo)'} Plan (Ad-free mode active)!`
              );
            }}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'admin' && (
          <AdminMetricsScreen
            subscriptionTier={subscriptionTier}
            referralOrders={referralOrders}
            onSelectTier={(tier) => {
              setSubscriptionTier(tier);
              setToastMessage(`Simulated user tier changed to: ${tier.toUpperCase()}`);
            }}
          />
        )}
      </main>

      {/* Mandatory Licence Attribution & SMU Course Disclaimer Footer */}
      <Footer
        subscriptionTier={subscriptionTier}
        onNavigate={setActiveTab}
      />

      {/* Modals & Dialogs */}
      <AddCustomItemModal
        isOpen={isAddCustomOpen}
        onClose={() => setIsAddCustomOpen(false)}
        categories={categories}
        onAdd={handleAddCustomItem}
      />

      <EditQtyModal
        isOpen={Boolean(editingItem)}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEditQty}
      />

      <GenerateMenuModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        preferences={preferences}
        onGenerate={() => handleGenerateMealPlan()}
        isGenerating={isGeneratingMenu}
        error={generationError}
        isDemo={isDemoMode}
      />

      <OrderGroceriesModal
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
        listSubtotal={totalEstimatedCost}
        itemCount={allItems.filter((i) => i.price && !i.pantryDeducted).length}
        onOrderConfirmed={handleOrderConfirmed}
      />

      <ApiHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
        health={healthStatus}
        isLoading={isHealthLoading}
        onCheck={handleCheckApis}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
