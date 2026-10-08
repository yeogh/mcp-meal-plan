export type TabType = 'menu' | 'shopping' | 'cooking' | 'agent-chef' | 'preferences' | 'subscription' | 'admin';

export type SubscriptionTier = 'free' | 'individual' | 'family';

export type DietaryMode = 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'high-protein';

export interface MacroProfile {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealFeedback {
  id: string;
  memberName: string;
  comment: string;
  timestamp: string;
  vote: 'up' | 'down';
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantityNote: string;
  calcNote?: string;
  inPantryNote?: string;
  pantryDeducted?: boolean;
  price?: number;
  savedPrice?: number;
  isChecked: boolean;
  storeName?: string;
  subCategory?: string;
  warningNote?: string;
  checkedNote?: string;
}

export interface CategoryGroup {
  id: string;
  title: string;
  iconName: string;
  items: ShoppingItem[];
}

export interface HouseholdMember {
  id: string;
  initial: string;
  name: string;
  badge?: string;
  badgeColor?: 'orange' | 'green' | 'default';
  roleDescription: string;
  appetite: 'Small' | 'Normal' | 'Big';
  multiplier: number;
  dailyCalorieTarget?: number;
}

export interface RecurringItem {
  id: string;
  name: string;
  frequency: string;
  icon: string;
}

export interface TrackedPantryItem {
  id: string;
  name: string;
  location: string;
  quantity: string;
  reorderSoon?: boolean;
}

export interface HouseholdPreferences {
  adults: number;
  children: number;
  members: HouseholdMember[];
  preferredFruits: string[];
  recurringItems: RecurringItem[];
  primaryCuisines: { name: string; isDefault?: boolean; active: boolean }[];
  dietaryRestrictions: string[];
  dislikedIngredients: { name: string; byWhom: string }[];
  maxCookingTime: number;
  weeklyBudget: number;
  showBudgetTracking: boolean;
  showPantryDeductionsMath: boolean;
  evergreenStaples: { name: string; inStock: boolean }[];
  trackedInventory: TrackedPantryItem[];
}

export interface MenuItem {
  id: string;
  recipeId?: string;
  day: string;
  mealName: string;
  subName: string;
  description: string;
  prepTimeMinutes: number;
  cuisine: string;
  dietaryMode?: DietaryMode;
  image: string;
  tags: string[];
  servings: number;
  isLocked?: boolean;
  macros?: MacroProfile;
  eatingScore?: number;
  nutrientHighlight?: string;
  votes?: number;
  votedBy?: string[];
  feedback?: MealFeedback[];
  cookingSteps?: string[];
  ingredients: { name: string; qty: string; status: 'in-pantry' | 'buy' }[];
}

export interface NutriBalanceDeficiency {
  nutrient: string;
  status: string;
  recommendation: string;
  foodFix: string;
}

export interface NutriBalanceProfile {
  provider: string;
  endpoint: string;
  origin: string;
  dietaryMode: DietaryMode;
  modeLabel: string;
  dailyEatingScore: number;
  memberProfiles: {
    id: string;
    name: string;
    appetite: string;
    portionMultiplier: number;
    tdee: number;
    dinnerTargetCalories: number;
    dailyMacros: MacroProfile;
  }[];
  deficiencyGuidance: NutriBalanceDeficiency[];
}

export interface ReferralOrderRecord {
  id: string;
  vendorName: string;
  orderSubtotal: number;
  deliveryFee: number;
  orderTotal: number;
  referralCommission: number;
  timestamp: string;
  itemCount: number;
}

export interface ApiProviderHealth {
  status: 'ok' | 'degraded' | 'error' | 'not_configured';
  responseTimeMs: number | null;
  upstreamHttpStatus?: number | null;
  authVerified?: boolean;
  generationVerified?: boolean;
  message?: string | null;
  model?: string;
  endpoint?: string;
  error: string | null;
}

export interface ApiHealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  providers: {
    spoonacular: ApiProviderHealth;
    gemini: ApiProviderHealth;
    nutribalance?: ApiProviderHealth;
  };
}

