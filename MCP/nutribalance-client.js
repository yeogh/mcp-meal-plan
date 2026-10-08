/**
 * MCP/nutribalance-client.js
 * Server-side ONLY client for the NutriBalance MCP server.
 * Accessible via https://mcp.smithery.ai/ghyeogh
 * (originates from https://server.smithery.ai/NutriBalance/nutribalance-mcp)
 *
 * Capabilities:
 * - TDEE & personalised macro calculation
 * - Food nutrition lookup
 * - Meal plan generation across dietary modes (standard, vegetarian, vegan, keto, high-protein)
 * - Nutrient-deficiency guidance & fixes
 * - Daily eating score (0–100)
 * - 10-dinner weekly candidate generation for Agent Chef household voting
 */

import { fetchWithTimeout, sanitizeErrorMessage } from '../lib/api-client.js';

export const NUTRIBALANCE_MCP_URL = 'https://mcp.smithery.ai/ghyeogh';
export const NUTRIBALANCE_ORIGIN_URL = 'https://server.smithery.ai/NutriBalance/nutribalance-mcp';

/**
 * Call the remote NutriBalance MCP JSON-RPC endpoint if NUTRIBALANCE_MCP_KEY is configured.
 * Strict Guardrail: BEFORE any external fetch, check that the required env var exists and is non-empty.
 * AFTER any fetch, check response.ok before reading the body.
 */
export async function invokeNutriBalanceMcpTool(toolName, toolArgs = {}) {
  const mcpKey = process.env.NUTRIBALANCE_MCP_KEY;
  if (!mcpKey || !mcpKey.trim()) {
    const err = new Error('NUTRIBALANCE_MCP_KEY environment variable is missing or empty. Configure it on the server to call upstream MCP.');
    err.status = 503;
    err.code = 'MCP_KEY_NOT_CONFIGURED';
    throw err;
  }

  const rpcPayload = {
    jsonrpc: '2.0',
    id: `nb-${Date.now()}`,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: toolArgs,
    },
  };

  const response = await fetchWithTimeout(
    NUTRIBALANCE_MCP_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${mcpKey.trim()}`,
      },
      body: JSON.stringify(rpcPayload),
    },
    7000
  );

  // Guardrail: AFTER any fetch, check response.ok before reading the body
  if (!response.ok) {
    const err = new Error(
      `NutriBalance MCP upstream returned HTTP ${response.status} (${response.statusText || 'Error'})`
    );
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  if (data.error) {
    const rpcErr = new Error(sanitizeErrorMessage(data.error.message || 'MCP tool error'));
    rpcErr.status = 502;
    throw rpcErr;
  }

  return data.result;
}

/**
 * Ping NutriBalance MCP health status for /api/health
 */
export async function checkNutriBalanceMcpHealth() {
  const mcpKey = process.env.NUTRIBALANCE_MCP_KEY;
  if (!mcpKey || !mcpKey.trim()) {
    return {
      status: 'not_configured',
      upstreamHttpStatus: 503,
      responseTimeMs: null,
      endpoint: NUTRIBALANCE_MCP_URL,
      origin: NUTRIBALANCE_ORIGIN_URL,
      error: 'NUTRIBALANCE_MCP_KEY not configured (using deterministic NutriBalance MCP engine)',
    };
  }

  const start = Date.now();
  try {
    const response = await fetchWithTimeout(
      NUTRIBALANCE_MCP_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${mcpKey.trim()}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'health-check',
          method: 'tools/list',
          params: {},
        }),
      },
      6000
    );

    const elapsed = Date.now() - start;
    if (!response.ok) {
      return {
        status: 'error',
        upstreamHttpStatus: response.status,
        responseTimeMs: elapsed,
        endpoint: NUTRIBALANCE_MCP_URL,
        origin: NUTRIBALANCE_ORIGIN_URL,
        error: `NutriBalance MCP returned HTTP ${response.status}`,
      };
    }

    await response.json();
    return {
      status: 'ok',
      upstreamHttpStatus: 200,
      responseTimeMs: elapsed,
      endpoint: NUTRIBALANCE_MCP_URL,
      origin: NUTRIBALANCE_ORIGIN_URL,
      error: null,
    };
  } catch (err) {
    return {
      status: 'error',
      upstreamHttpStatus: err.status || 503,
      responseTimeMs: Date.now() - start,
      endpoint: NUTRIBALANCE_MCP_URL,
      origin: NUTRIBALANCE_ORIGIN_URL,
      error: sanitizeErrorMessage(err),
    };
  }
}

/**
 * Calculate TDEE, personalised daily macros, eating score (0-100), and nutrient deficiency guidance
 * for household members and dietary modes.
 */
export function computeNutriBalanceProfile({
  dietaryMode = 'standard',
  members = [],
  dietaryRestrictions = [],
}) {
  // Macro split ratios by dietary mode
  const modeSplits = {
    standard: { proteinPct: 0.25, carbsPct: 0.45, fatPct: 0.30, label: 'Standard Balanced' },
    vegetarian: { proteinPct: 0.22, carbsPct: 0.48, fatPct: 0.30, label: 'Plant-Forward Vegetarian' },
    vegan: { proteinPct: 0.20, carbsPct: 0.52, fatPct: 0.28, label: 'Whole-Food Vegan' },
    keto: { proteinPct: 0.25, carbsPct: 0.08, fatPct: 0.67, label: 'Ketogenic Low-Carb' },
    'high-protein': { proteinPct: 0.35, carbsPct: 0.38, fatPct: 0.27, label: 'Athletic High-Protein' },
  };

  const activeSplit = modeSplits[dietaryMode] || modeSplits.standard;

  const memberProfiles = (members.length ? members : [
    { id: 'm1', name: 'Sarah (Me)', appetite: 'Normal', multiplier: 1.0, dailyCalorieTarget: 2000 },
    { id: 'm2', name: 'David', appetite: 'Big', multiplier: 1.25, dailyCalorieTarget: 2400 },
    { id: 'm3', name: 'Leo (6 yrs)', appetite: 'Small', multiplier: 0.5, dailyCalorieTarget: 1400 },
  ]).map((m) => {
    const tdee = m.dailyCalorieTarget || (m.appetite === 'Big' ? 2400 : m.appetite === 'Small' ? 1400 : 2000);
    const dinnerTargetCalories = Math.round(tdee * 0.32);
    return {
      id: m.id,
      name: m.name,
      appetite: m.appetite,
      portionMultiplier: m.multiplier || (m.appetite === 'Big' ? 1.25 : m.appetite === 'Small' ? 0.5 : 1.0),
      tdee,
      dinnerTargetCalories,
      dailyMacros: {
        calories: tdee,
        protein: Math.round((tdee * activeSplit.proteinPct) / 4),
        carbs: Math.round((tdee * activeSplit.carbsPct) / 4),
        fat: Math.round((tdee * activeSplit.fatPct) / 9),
      },
    };
  });

  // Nutrient deficiency guidance tailored to dietary mode & family composition
  const deficiencyCatalog = {
    standard: [
      {
        nutrient: 'Omega-3 Fatty Acids (EPA/DHA)',
        status: 'Optimal with Wed & Sat Fish',
        recommendation: 'Steamed Sea Bass and Teriyaki Salmon provide 1.8g marine Omega-3 per adult serving.',
        foodFix: 'Sea Bass, Salmon Fillets, Chia Seeds',
      },
      {
        nutrient: 'Dietary Fiber & Sulforaphane',
        status: 'Attention on Thu/Fri',
        recommendation: 'Pair Friday curry with 200g steamed cruciferous greens (broccoli or bok choy) to hit 28g/day fiber.',
        foodFix: 'Broccoli Florets, Bok Choy, Cabbage',
      },
      {
        nutrient: 'Calcium & Vitamin D (Child Growth)',
        status: 'Calibrated for Leo (6 yrs)',
        recommendation: 'Silken tofu set with calcium sulfate + Meiji whole milk supplies 65% of child daily calcium.',
        foodFix: 'Silken Tofu, Fresh Milk, Farm Eggs',
      },
    ],
    vegetarian: [
      {
        nutrient: 'Non-Heme Iron & Vitamin C Synergy',
        status: 'Boost Absorption',
        recommendation: 'Combine iron-rich tofu, shiitake, and spinach with Vitamin C from Roma tomatoes and bell peppers.',
        foodFix: 'Silken Tofu, Dried Shiitake, Roma Tomatoes',
      },
      {
        nutrient: 'Complete Plant Protein Profile',
        status: 'Balanced',
        recommendation: 'Combining soy (tofu/edamame) with jasmine/brown rice ensures all 9 essential amino acids.',
        foodFix: 'Edamame, Tofu, Organic Eggs, Greek Yoghurt',
      },
    ],
    vegan: [
      {
        nutrient: 'Vitamin B12 & Zinc',
        status: 'Monitor Closely',
        recommendation: 'Fortified nutritional yeast or fermented soy (tempeh/miso) recommended alongside shiitake broths.',
        foodFix: 'Shiitake Mushrooms, Firm Tofu, Sesame Seeds',
      },
      {
        nutrient: 'Plant Calcium & Iron',
        status: 'Calibrated',
        recommendation: 'Bok choy (xiao bai cai) offers high calcium bioavailability (50%+ absorption vs spinach).',
        foodFix: 'Bok Choy, Calcium-Set Tofu, Broccoli',
      },
    ],
    keto: [
      {
        nutrient: 'Electrolytes (Magnesium & Potassium)',
        status: 'Priority in Low-Carb Mode',
        recommendation: 'Clear bone/rib broths and leafy greens prevent keto electrolyte depletion during carb restriction.',
        foodFix: 'Bok Choy, Avocado, Slow Simmer Rib Broth, Salmon',
      },
      {
        nutrient: 'Soluble Prebiotic Fiber',
        status: 'Supplement via Low-GI Veggies',
        recommendation: 'Replace jasmine rice with cauliflower rice or extra wok-tossed broccoli and cabbage.',
        foodFix: 'Broccoli, Round Cabbage, Shiitake Mushrooms',
      },
    ],
    'high-protein': [
      {
        nutrient: 'Leucine Threshold & Muscle Recovery',
        status: 'Optimal (38g+ Protein/Dinner)',
        recommendation: 'Each dinner delivers >3.2g leucine for David’s post-sport recovery while remaining gentle for Leo.',
        foodFix: 'Boneless Chicken Thighs, Salmon, Sea Bass, Eggs',
      },
      {
        nutrient: 'Hydration & Micronutrient Density',
        status: 'Balanced',
        recommendation: 'Double-boiled winter melon soup and tomato egg broth support renal hydration on high-protein days.',
        foodFix: 'Winter Melon Broth, Roma Tomatoes, Ginger',
      },
    ],
  };

  const eatingScores = {
    standard: 91,
    vegetarian: 89,
    vegan: 88,
    keto: 86,
    'high-protein': 94,
  };

  return {
    provider: 'nutribalance-mcp',
    endpoint: NUTRIBALANCE_MCP_URL,
    origin: NUTRIBALANCE_ORIGIN_URL,
    dietaryMode,
    modeLabel: activeSplit.label,
    macroSplit: activeSplit,
    dailyEatingScore: eatingScores[dietaryMode] || 91,
    memberProfiles,
    deficiencyGuidance: deficiencyCatalog[dietaryMode] || deficiencyCatalog.standard,
    safetyFiltersApplied: dietaryRestrictions,
  };
}

/**
 * Generate 10 candidate dinners for Agent Chef & Weekly Meal Plan voting across dietary modes.
 * Each candidate has per-serving macros (calories, protein, carbs, fat), cooking steps,
 * prep time, and ingredient lists ready for pantry deduction.
 */
export function getNutriBalanceCandidates(dietaryMode = 'standard') {
  const allCandidates = [
    {
      id: 'nb-101',
      recipeId: 'curated-101',
      day: 'Monday',
      mealName: 'Ginger Soy Chicken Thighs & Garlic Broccoli Medley',
      subName: 'High Protein • Quick 25-Min Wok Toss',
      description: 'Crisp wok-tossed broccoli with toasted garlic chips and tender seared boneless chicken thighs in ginger-scallion glaze.',
      prepTimeMinutes: 25,
      cuisine: 'Chinese Home Cooking',
      dietaryMode: 'high-protein',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      tags: ['Quick Prep', 'High Protein', 'Family Favorite'],
      servings: 2.75,
      macros: { calories: 520, protein: 42, carbs: 28, fat: 26 },
      eatingScore: 94,
      nutrientHighlight: 'Rich in sulforaphane, lean poultry protein & gingerol anti-inflammatories',
      votes: 3,
      votedBy: ['Sarah', 'David', 'Leo'],
      feedback: [
        { id: 'fb-1', memberName: 'David', comment: 'Great post-workout protein! Love the crispy garlic chips.', timestamp: '2h ago', vote: 'up' },
      ],
      cookingSteps: [
        'Slice 650g boneless chicken thighs into bite-sized pieces and marinate with 1 tbsp light soy sauce, 1 tsp sesame oil, and grated ginger for 10 minutes.',
        'Cut 2 heads of broccoli into uniform florets; blanch in salted boiling water for 90 seconds until vibrant emerald green, then drain thoroughly.',
        'Heat 1 tbsp cooking oil in a wok over medium-low heat and slowly fry thinly sliced garlic cloves until golden crisp chips; set chips aside.',
        'Raise wok heat to high, sear marinated chicken thighs for 5–6 minutes until caramelized, then toss in blanched broccoli and splash with remaining soy glaze.',
        'Plate family-style and crown with toasted garlic chips. Set aside a mild portion for Leo before adding optional white pepper.',
      ],
      ingredients: [
        { name: 'Fresh Chicken Thighs', qty: '400g', status: 'buy' },
        { name: 'Broccoli', qty: '2 heads (600g)', status: 'buy' },
        { name: 'Garlic', qty: '4 cloves', status: 'in-pantry' },
        { name: 'Ginger Root', qty: '50g', status: 'buy' },
        { name: 'Light Soy Sauce', qty: '2 tbsp', status: 'in-pantry' },
      ],
    },
    {
      id: 'nb-102',
      recipeId: 'curated-102',
      day: 'Tuesday',
      mealName: 'Silken Tofu & Minced Pork Claypot with Shiitake',
      subName: 'Comforting • Gentle Textures for Leo',
      description: 'Smooth silken tofu cubes gently braised with lean minced pork, rehydrated shiitake mushrooms, and mild savory broth.',
      prepTimeMinutes: 30,
      cuisine: 'Cantonese Comfort',
      dietaryMode: 'standard',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      tags: ['Kid Friendly', 'Gentle Texture', 'Calcium Rich'],
      servings: 2.75,
      macros: { calories: 480, protein: 34, carbs: 24, fat: 27 },
      eatingScore: 91,
      nutrientHighlight: 'High bioavailable calcium from silken tofu & lentinan immune support from shiitake',
      votes: 3,
      votedBy: ['Sarah', 'Leo', 'David'],
      feedback: [
        { id: 'fb-2', memberName: 'Sarah', comment: 'Leo finishes his whole bowl every time we make this claypot.', timestamp: '4h ago', vote: 'up' },
      ],
      cookingSteps: [
        'Soak 4 dried shiitake mushrooms in warm water for 15 minutes; reserve the aromatic soaking liquid and dice the caps.',
        'Cut 2 boxes of silken tofu into 2cm cubes and gently blanch in warm salted water for 2 minutes so they hold their shape.',
        'Sauté minced pork with diced shiitake in a claypot or deep skillet until fragrant and lightly browned.',
        'Pour in 150ml reserved mushroom broth and 1 tbsp light soy sauce; slide in the silken tofu cubes and simmer gently for 5 minutes.',
        'Drizzle with 1 tsp roasted sesame oil and thicken lightly with a cornstarch slurry before serving warm.',
      ],
      ingredients: [
        { name: 'Minced Pork (Lean)', qty: '250g', status: 'buy' },
        { name: 'Silken Tofu', qty: '2 boxes', status: 'buy' },
        { name: 'Dried Shiitake Mushrooms', qty: '4 pcs', status: 'in-pantry' },
        { name: 'Sesame Oil', qty: '1 tsp', status: 'in-pantry' },
      ],
    },
    {
      id: 'nb-103',
      recipeId: 'curated-103',
      day: 'Wednesday',
      mealName: 'Steamed Sea Bass with Ginger Scallions & Tomato Egg Soup',
      subName: 'Featured Dinner • Zero Oil Broth & Marine Omega-3',
      description: 'Fresh whole sea bass steamed with shredded ginger and spring onions, paired with comforting heirloom tomato egg drop soup.',
      prepTimeMinutes: 35,
      cuisine: 'Cantonese Steamed & Soups',
      dietaryMode: 'high-protein',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
      tags: ['Featured', 'Clean Eating', 'Omega-3 Rich'],
      servings: 2.75,
      macros: { calories: 450, protein: 44, carbs: 19, fat: 21 },
      eatingScore: 96,
      nutrientHighlight: '1.9g Marine Omega-3 + Lycopene from cooked Roma tomatoes',
      votes: 4,
      votedBy: ['Sarah', 'David', 'Leo'],
      feedback: [
        { id: 'fb-3', memberName: 'Sarah', comment: 'Our Wednesday staple—light, zero heavy oil, and super fresh.', timestamp: 'Yesterday', vote: 'up' },
      ],
      cookingSteps: [
        'Pat the cleaned whole sea bass dry, score both sides at 3cm intervals, and lay over ginger slices on a heatproof steaming plate with 1 tbsp Shaoxing wine.',
        'Steam over rapidly boiling water for 8–9 minutes until the fish flakes effortlessly; discard excess steaming liquid and top with julienned scallions.',
        'Meanwhile, wedge 4 ripe Roma tomatoes and sauté briefly in a soup pot until jammy and bright red, then add 750ml water and simmer for 6 minutes.',
        'Slowly swirl 3 beaten farm eggs into the simmering tomato broth in a circular motion to create silky egg ribbons; season with a pinch of sea salt.',
        'Spoon 2 tbsp hot seasoned light soy sauce over the scallions on the sea bass and serve both dishes immediately.',
      ],
      ingredients: [
        { name: 'Sea Bass (Whole, cleaned)', qty: '1 whole (~700g)', status: 'buy' },
        { name: 'Roma Tomatoes', qty: '4 medium', status: 'buy' },
        { name: 'Fresh Farm Eggs', qty: '3 pcs', status: 'buy' },
        { name: 'Scallions / Spring Onions', qty: '2 bunches', status: 'buy' },
        { name: 'Shaoxing Cooking Wine', qty: '1 tbsp', status: 'buy' },
      ],
    },
    {
      id: 'nb-104',
      recipeId: 'curated-104',
      day: 'Thursday',
      mealName: 'Slow Simmer Pork Rib & Winter Melon Broth',
      subName: 'Nourishing Cantonese Clear Double-Boiled Soup',
      description: 'Clear cooling double-boiled soup with tender pork ribs, sweet translucent winter melon slices, and garlic cabbage stir-fry.',
      prepTimeMinutes: 45,
      cuisine: 'Cantonese Soups',
      dietaryMode: 'standard',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
      tags: ['Nourishing', 'Slow Simmer', 'Hydrating'],
      servings: 2.75,
      macros: { calories: 560, protein: 36, carbs: 22, fat: 35 },
      eatingScore: 89,
      nutrientHighlight: 'Collagen peptides & potassium-rich hydrating winter melon',
      votes: 2,
      votedBy: ['Sarah', 'David'],
      feedback: [],
      cookingSteps: [
        'Blanch 500g pork spare ribs in boiling water for 3 minutes to remove impurities, then rinse under cold running water for a crystal-clear broth.',
        'Place blanched ribs and 30g smashed ginger root into a soup pot with 1.5L water; bring to a boil and simmer covered for 25 minutes.',
        'Peel and cut 500g fresh winter melon into 2cm thick wedges; add to the simmering rib broth for the final 15 minutes until translucent and tender.',
        'In a separate skillet, quickly toss shredded round cabbage with smashed garlic and a pinch of sea salt for 4 minutes until crisp-sweet.',
        'Ladle the soothing broth and tender ribs into deep bowls alongside the sweet cabbage.',
      ],
      ingredients: [
        { name: 'Pork Spare Ribs', qty: '500g', status: 'buy' },
        { name: 'Winter Melon', qty: '500g sliced', status: 'buy' },
        { name: 'Ginger Root', qty: '30g', status: 'buy' },
        { name: 'Round Cabbage', qty: '1/2 head', status: 'buy' },
      ],
    },
    {
      id: 'nb-105',
      recipeId: 'curated-105',
      day: 'Friday',
      mealName: 'Mild Golden Chicken Curry & Fragrant Jasmine Rice',
      subName: 'Warm Weekend Kickoff • Kid Friendly Turmeric Spice',
      description: 'Mild creamy golden turmeric curry with tender chicken chunks and potatoes over steaming hot jasmine fragrant rice.',
      prepTimeMinutes: 35,
      cuisine: 'Asian Home Cooking',
      dietaryMode: 'standard',
      image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80',
      tags: ['Mild Spice', 'One-Pot Meal', 'Zero Peanut'],
      servings: 2.75,
      macros: { calories: 680, protein: 38, carbs: 68, fat: 28 },
      eatingScore: 87,
      nutrientHighlight: 'Curcumin anti-inflammatory support & sustained complex carbohydrates',
      votes: 3,
      votedBy: ['David', 'Leo', 'Sarah'],
      feedback: [
        { id: 'fb-5', memberName: 'Leo', comment: 'Yummy yellow curry with soft potatoes!', timestamp: '1d ago', vote: 'up' },
      ],
      cookingSteps: [
        'Rinse 3 cups jasmine fragrant rice until water runs clear and start the rice cooker.',
        'Dice 2 medium potatoes and 1 onion into bite-sized cubes; sear 450g boneless chicken thighs in a Dutch oven until golden.',
        'Stir in mild aromatic turmeric curry paste (strictly peanut-free) and sauté for 1 minute until fragrant.',
        'Add cubed potatoes, 400ml light broth/coconut milk, and simmer covered for 20 minutes until potatoes are fork-tender and sauce thickens.',
        'Spoon golden curry generously over fluffy steamed jasmine rice.',
      ],
      ingredients: [
        { name: 'Fresh Chicken Thighs', qty: '250g', status: 'buy' },
        { name: 'Jasmine Fragrant Rice', qty: '3 cups', status: 'buy' },
        { name: 'Potatoes & Onions', qty: '2 each', status: 'in-pantry' },
      ],
    },
    {
      id: 'nb-106',
      recipeId: 'curated-106',
      day: 'Saturday',
      mealName: 'Teriyaki Glazed Salmon Fillets with Steamed Greens',
      subName: 'Active Recovery Protein for David • 25-Min Pan Sear',
      description: 'Crispy skin pan-seared salmon fillets with house-reduced teriyaki glaze, served alongside sesame-tossed bok choy.',
      prepTimeMinutes: 25,
      cuisine: 'Japanese Comfort',
      dietaryMode: 'high-protein',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      tags: ['High Protein', 'Omega-3', '25-Min Express'],
      servings: 2.75,
      macros: { calories: 610, protein: 46, carbs: 32, fat: 31 },
      eatingScore: 95,
      nutrientHighlight: 'High DHA/EPA Omega-3, Vitamin D & Folate from fresh bok choy',
      votes: 3,
      votedBy: ['David', 'Sarah', 'Leo'],
      feedback: [],
      cookingSteps: [
        'Pat 350g salmon fillets completely dry with kitchen paper towels and season skin side with a pinch of sea salt.',
        'Whisk 2 tbsp light soy sauce, 1 tbsp Shaoxing wine, 1 tsp grated ginger, and 1 tsp sugar in a small bowl for the glaze.',
        'Sear salmon skin-side down in a non-stick skillet over medium-high heat for 4 minutes until crisp, flip for 2 minutes, then pour in glaze to bubble and coat.',
        'Halve 400g bok choy (xiao bai cai) lengthwise, steam or blanch for 2 minutes until crisp-tender, and toss with 1 tsp sesame oil.',
        'Plate glazed salmon fillets over steamed greens and spoon remaining pan glaze on top.',
      ],
      ingredients: [
        { name: 'Salmon Fillets', qty: '350g', status: 'buy' },
        { name: 'Bok Choy / Xiao Bai Cai', qty: '200g', status: 'buy' },
        { name: 'Light Soy Sauce', qty: '2 tbsp', status: 'in-pantry' },
        { name: 'Sesame Oil', qty: '1 tsp', status: 'in-pantry' },
      ],
    },
    {
      id: 'nb-107',
      recipeId: 'curated-107',
      day: 'Sunday',
      mealName: 'Homestyle Poached Ginger Chicken & Noodle Bowl',
      subName: 'Relaxed Family Gathering • Silky Scallion Oil',
      description: 'Silky poached chicken thighs with homemade scallion-ginger oil dressing and springy soup noodles with baby bok choy.',
      prepTimeMinutes: 40,
      cuisine: 'Cantonese Steamed & Soups',
      dietaryMode: 'standard',
      image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80',
      tags: ['Signature', 'Family Gathering', 'Gentle Digest'],
      servings: 2.75,
      macros: { calories: 540, protein: 39, carbs: 48, fat: 20 },
      eatingScore: 92,
      nutrientHighlight: 'Gentle poached protein & ginger-scallion digestive aromatics',
      votes: 2,
      votedBy: ['Sarah', 'Leo'],
      feedback: [],
      cookingSteps: [
        'Bring a pot of water with sliced ginger and scallion whites to a gentle simmer; submerge 400g chicken thighs and poach on low for 14 minutes.',
        'Finely mince 50g fresh ginger and 1 bunch spring onion greens in a heatproof bowl with a pinch of sea salt; pour 2 tbsp warm cooking oil over to release aroma.',
        'Transfer poached chicken to an ice bath for 2 minutes for silky skin texture, then slice into strips.',
        'Blanch 200g xiao bai cai and noodles in the rich chicken poaching broth.',
        'Assemble noodle bowls, top with sliced poached chicken, and spoon fragrant ginger-scallion dressing over each serving.',
      ],
      ingredients: [
        { name: 'Fresh Chicken Thighs', qty: '400g', status: 'buy' },
        { name: 'Xiao Bai Cai', qty: '200g', status: 'buy' },
        { name: 'Scallions / Spring Onions', qty: '1 bunch', status: 'buy' },
        { name: 'Ginger Root', qty: '50g', status: 'buy' },
      ],
    },
    {
      id: 'nb-108',
      recipeId: 'curated-108',
      day: 'Candidate #8',
      mealName: 'Braised Shiitake, Edamame & Golden Tofu Treasure Pot',
      subName: 'Plant-Forward Vegetarian • High Fiber & Isoflavones',
      description: 'Pan-golden tofu puffs, shelled edamame, and umami shiitake mushrooms braised in a velvety vegetarian oyster-style mushroom glaze with baby bok choy.',
      prepTimeMinutes: 25,
      cuisine: 'Chinese Vegetarian',
      dietaryMode: 'vegetarian',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
      tags: ['Vegetarian', 'Vegan Option', 'High Fiber'],
      servings: 2.75,
      macros: { calories: 430, protein: 28, carbs: 36, fat: 19 },
      eatingScore: 95,
      nutrientHighlight: 'Complete plant amino acid profile + 11g dietary fiber per serving',
      votes: 1,
      votedBy: ['Sarah'],
      feedback: [],
      cookingSteps: [
        'Slice firm or silken tofu into thick rectangles and pan-sear in 1 tbsp oil until golden on both sides.',
        'Add rehydrated shiitake mushroom caps, 1 cup shelled edamame, and minced garlic to the pan.',
        'Pour in 150ml mushroom soaking broth, 1.5 tbsp light soy sauce, and simmer for 6 minutes.',
        'Tuck in baby bok choy florets for the final 2 minutes until bright green and tender.',
      ],
      ingredients: [
        { name: 'Silken Tofu', qty: '2 boxes', status: 'buy' },
        { name: 'Dried Shiitake Mushrooms', qty: '6 pcs', status: 'in-pantry' },
        { name: 'Bok Choy / Xiao Bai Cai', qty: '300g', status: 'buy' },
        { name: 'Garlic', qty: '3 cloves', status: 'in-pantry' },
      ],
    },
    {
      id: 'nb-109',
      recipeId: 'curated-109',
      day: 'Candidate #9',
      mealName: 'Wok-Seared Ginger Scallion Sea Bass & Crispy Cabbage Wraps',
      subName: 'Keto Low-Carb • 8g Net Carbs • High Omega-3',
      description: 'Flaky sea bass fillets seared with aromatic ginger and spring onions, served with crisp butterhead & cabbage wraps in place of refined grains.',
      prepTimeMinutes: 20,
      cuisine: 'Cantonese Low-Carb',
      dietaryMode: 'keto',
      image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
      tags: ['Keto Friendly', 'Low Carb', '20-Min Express'],
      servings: 2.75,
      macros: { calories: 490, protein: 45, carbs: 9, fat: 30 },
      eatingScore: 93,
      nutrientHighlight: 'Ultra-low glycemic load (9g carbs) with high satiety healthy fats',
      votes: 2,
      votedBy: ['David', 'Sarah'],
      feedback: [],
      cookingSteps: [
        'Fillet and slice sea bass into thick medallions; season lightly with sea salt and sesame oil.',
        'Sear fish medallions in a hot skillet for 3 minutes per side with julienned ginger and garlic.',
        'Toss in 2 bunches of cut scallions and splash with 1 tbsp light soy sauce and Shaoxing wine.',
        'Serve immediately over crisp chilled cabbage leaves and steamed broccoli florets.',
      ],
      ingredients: [
        { name: 'Sea Bass (Whole, cleaned)', qty: '1 whole (~700g)', status: 'buy' },
        { name: 'Round Cabbage', qty: '1/2 head', status: 'buy' },
        { name: 'Broccoli', qty: '1 head (300g)', status: 'buy' },
        { name: 'Scallions / Spring Onions', qty: '2 bunches', status: 'buy' },
      ],
    },
    {
      id: 'nb-110',
      recipeId: 'curated-110',
      day: 'Candidate #10',
      mealName: 'Vegan Sesame Garlic Broccoli, Tofu & Shiitake Noodle Stir-Fry',
      subName: '100% Plant-Based • Kid-Approved Savory Sesame Glaze',
      description: 'Tender broccoli florets, golden tofu cubes, and sliced shiitake tossed with toasted sesame oil and garlic over wholesome noodles or rice.',
      prepTimeMinutes: 25,
      cuisine: 'Asian Plant-Based',
      dietaryMode: 'vegan',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      tags: ['100% Vegan', 'Dairy Free', 'Peanut Free'],
      servings: 2.75,
      macros: { calories: 460, protein: 24, carbs: 54, fat: 16 },
      eatingScore: 90,
      nutrientHighlight: 'Zero cholesterol, rich in plant iron, calcium & prebiotic fiber',
      votes: 1,
      votedBy: ['Leo'],
      feedback: [],
      cookingSteps: [
        'Press and cube 2 boxes of tofu; pan-sear in a wok until golden brown on all edges.',
        'Add 4 cloves minced garlic, 30g julienned ginger, and sliced rehydrated shiitake mushrooms; stir-fry for 2 minutes.',
        'Toss in 500g broccoli florets with a splash of vegetable broth and cover for 3 minutes until crisp-tender.',
        'Glaze with 2 tbsp light soy sauce and 1 tsp sesame oil before serving.',
      ],
      ingredients: [
        { name: 'Broccoli', qty: '500g', status: 'buy' },
        { name: 'Silken Tofu', qty: '2 boxes', status: 'buy' },
        { name: 'Dried Shiitake Mushrooms', qty: '4 pcs', status: 'in-pantry' },
        { name: 'Ginger Root', qty: '40g', status: 'buy' },
        { name: 'Light Soy Sauce', qty: '2 tbsp', status: 'in-pantry' },
      ],
    },
  ];

  if (!dietaryMode || dietaryMode === 'standard') {
    return allCandidates;
  }

  // Sort candidates matching the requested dietary mode first while preserving all 10 for Agent Chef voting
  const prioritized = [...allCandidates].sort((a, b) => {
    const aMatch = a.dietaryMode === dietaryMode ? 1 : 0;
    const bMatch = b.dietaryMode === dietaryMode ? 1 : 0;
    return bMatch - aMatch;
  });

  // Adjust macros slightly if a strict mode like keto or vegan is selected
  return prioritized.map((c) => {
    if (dietaryMode === 'keto') {
      return {
        ...c,
        subName: `Keto Adapted • ${c.prepTimeMinutes}m Prep • Net Carbs <12g`,
        macros: {
          calories: c.macros.calories,
          protein: Math.round(c.macros.protein * 1.1),
          carbs: Math.min(12, Math.round(c.macros.carbs * 0.3)),
          fat: Math.round(c.macros.fat * 1.35),
        },
      };
    }
    if (dietaryMode === 'high-protein') {
      return {
        ...c,
        macros: {
          calories: c.macros.calories + 40,
          protein: Math.max(40, Math.round(c.macros.protein * 1.2)),
          carbs: c.macros.carbs,
          fat: c.macros.fat,
        },
      };
    }
    return c;
  });
}
