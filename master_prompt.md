# Master Prompt: Heirloom Table — Smart Family Kitchen, Agent Chef & NutriBalance MCP Planner

## ROLE
You are a senior full-stack developer working in this existing Vite + React + Express/Vercel project (`Heirloom Table`).

## GOAL
Build out and integrate both the existing family kitchen capabilities and the core new screens of a family meal planning app that lets households coordinate dietary preferences, food allergies, portion multipliers, pantry stock, and calorie/macro targets across multiple family members:

1. **Weekly Meal Plan & Household Voting Screen (`/menu`)** — A dashboard where the household reviews and votes on proposed dinners for the week. Each meal card shows the recipe name, estimated prep time, cuisine, portion yield multiplier, and per-serving macros (`calories`, `protein`, `carbs`, `fat`). The household can leave feedback and votes on each meal via personal shareable links (e.g., `?voter=David` or member selector, no accounts needed). Top-voted picks win and flow into the consolidated grocery list. Refresh plan suggestions on demand by calling both the **nutribalance-mcp** tools (TDEE & personalised macros, meal plan generation for `standard`/`vegetarian`/`vegan`/`keto`/`high-protein` modes, nutrient-deficiency guidance, and daily eating score 0–100) and the existing **Gemini (`@google/genai`) + Spoonacular API** recipe rotation engine. Retain existing day-locking, single-day recipe swap, and per-member calorie calculators.
2. **Grocery List & Pantry Sync (`/shopping`)** — Once the weekly plan is locked or updated, auto-generate a consolidated grocery list (`lib/grocery-calculator.js`) that scales quantities by the household portion multiplier (`2.75x`), combines cross-day ingredients, adds standing fruit/weekly essentials, and deducts what is already in the household pantry (`evergreenStaples` & `trackedInventory`). Include a one-tap **"Order via Delivery Platform"** action (`OrderGroceriesModal`) that hands the list to a connected food delivery platform, explicitly tracking and earning the platform's **2% referral revenue** on each order, alongside existing WhatsApp export, plain-text copy, print view, custom item modal, and quantity/price editing.
3. **Daily Cooking View (`/cooking`)** — A stripped-down, distraction-free screen the family opens each day to see today's recipe, interactive step-by-step instructions with cooking timers, per-serving macro badges, daily eating score (0–100), and an interactive ingredient checklist showing pantry vs. fresh items. This is the primary daily touchpoint described in the business model.
4. **Subscription & Monetisation Hooks (`/subscription` & `/admin`)** — Wire up the subscription tiers (**Free Trial** with contextual ads, **Individual** at `$9/month`, **Family** at `$19/month`) with a clean gating mechanism in application state (no payment processor required). Show contextual ad placements on Free-tier screens to support the on-platform ad-revenue stream (`$1k/month` target). Surface the **"Achieve $30k/month by EOY"** recurring revenue goal, MRR breakdown (`$19k` Family + `$4.5k` Individual + `$4k` 2% Grocery Referral + `$1k` Ad Revenue), cost budget allocation (`$120k–$165k`), customer segments, key channels, and live session referral metrics on an internal admin dashboard at `/admin`.
5. **Agent Chef Integration (`/agent-chef`)** — Each week the AI Agent Chef proposes **ten candidate dinners** (combining `nutribalance-mcp`, Spoonacular, and Gemini curation), the household members vote and leave notes on their favourites, and the agent automatically selects the top 7 winners, locks the weekly schedule, and builds the final consolidated grocery list minus pantry stock. The agent pre-fills the delivery cart; the user reviews and approves checkout (recording the 2% platform referral commission).
6. **Household & Food Preferences (`/preferences`) & API Health Modal** — Preserve all existing household member appetite multipliers, calorie targets, allergy/sensory filters, evergreen pantry staples, tracked dry inventory, and live `/api/health` diagnostics for Gemini, Spoonacular, and NutriBalance MCP.

Leave all existing screens and features working seamlessly.

---

## EXISTING FEATURES & APIS INCORPORATED
- **Gemini AI Engine (`@google/genai` SDK)**: Server-side structured meal plan generation (`/api/meal-plan`) using `gemini-3.1-flash-lite` with automatic fallback to `gemini-3.8-flash`. Respects locked days, max weekday cooking time, household allergies (`No Peanuts`), and sensory dislikes (`Bittergourd`, `Cilantro`).
- **Spoonacular Recipe API (`/api/recipes` & `lib/api-client.js`)**: Complex recipe search (`complexSearch`) and detailed recipe lookup (`/recipes/{id}/information`) with automatic fallback to a curated Asian & Cantonese family recipe catalog when `SPOONACULAR_API_KEY` is unconfigured.
- **NutriBalance MCP (`MCP/nutribalance-client.js` & `/api/nutribalance.js`)**: Connects to `https://mcp.smithery.ai/ghyeogh` (originating from `https://server.smithery.ai/NutriBalance/nutribalance-mcp`) for TDEE & personalised macro calculation, food nutrition lookup, dietary mode meal generation (`standard`, `vegetarian`, `vegan`, `keto`, `high-protein`), nutrient-deficiency guidance, and daily eating score (`0–100`).
- **Smart Grocery Consolidation Engine (`lib/grocery-calculator.js`)**: Multiplies base recipe quantities by active household appetite weights (`Sarah 1.0x + David 1.25x + Leo 0.5x = 2.75x`), applies shared family-dish scaling (`0.85x` for multi-dish meals), deducts in-stock pantry items, and estimates Singapore supermarket benchmark prices (SGD).
- **Multi-Provider API Health Check (`/api/health`)**: Verifies upstream readiness, response latency, and configuration state for Spoonacular, Gemini, and NutriBalance MCP.

---

## OUTPUT & ARCHITECTURE REQUIREMENTS
Write all new screens and supporting logic in the two shapes this toolchain needs:
1. **(a) Vercel-ready serverless functions** — All serverless API routes reside in the project root under `/api/` as siblings of `package.json` (`/api/health.js`, `/api/meal-plan.js`, `/api/recipes.js`, `/api/nutribalance.js`), never inside `src/`. `package.json` contains `"type": "module"`.
2. **(b) Express dev server** — Register the exact same routes in `server.ts` at the project root (executed via `package.json` script `"dev": "tsx server.ts"`), importing the shared route handlers from `./api/*.js` and mounting Vite middleware so both AI Studio preview and Vercel deployments run identically.
3. **Frontend Routing & Navigation** — All React screens live in `src/components/` and are wired into both URL path/hash routing (`/menu`, `/shopping`, `/cooking`, `/agent-chef`, `/preferences`, `/subscription`, `/admin`) and the top navigation bar so users can reach every screen without editing code, while `/admin` is also accessible via URL or footer link.
4. **Upstream Security & Fetch Discipline** — Read all secrets via `process.env.*` on the server side only. BEFORE any external fetch, check that the required environment variable exists and is non-empty; if missing, return HTTP `503` (or structured fallback where appropriate) with a clear diagnostic message and do not call the upstream service with empty credentials. AFTER any fetch, check `response.ok` before reading the body. Set sensible `Cache-Control` headers (`Cache-Control: public, max-age=60, s-maxage=120` or `no-store` for health checks) on all API responses.
5. **Mandatory Footer Attribution** — In the footer of every screen, include the attribution line required by the data source licences used (NutriBalance MCP via Smithery, Spoonacular API, and Google Gemini), with working licence links (`https://smithery.ai/server/NutriBalance/nutribalance-mcp`, `https://spoonacular.com/food-api/terms`, `https://creativecommons.org/licenses/by/4.0/`), and an explicit notice: *"This application is an SMU course project and is not affiliated with or endorsed by NutriBalance, Smithery, Spoonacular, or any commercial data provider."*

---

## GUARDRAILS
- Never write any API key into any file, comment, or README.
- Never create an environment variable whose name starts with `VITE_`.
- Never call MCP or Gemini from browser code; every MCP call happens server-side inside `MCP/` (`MCP/nutribalance-client.js`) invoked by `/api/nutribalance.js`.
- Never print any key, or any substring of a key, in a response or server log (`sanitizeErrorMessage`).
- No new npm packages; no external database; no login/authentication wall.
- Do not use any organisation name or logo in a way that suggests this app is official or endorsed.

---

## BUSINESS & DOMAIN CONTEXT
- **Target Segments**:
  1. Family meal planners coordinating preferences, allergies, and calories for multiple household members.
  2. Commercial home-delivery meal providers.
  3. Advertisement sponsors reaching health-conscious households.
  4. Grocery merchants (supermarket chains & grocery delivery platforms) selling through the platform.
- **MCP Server**:
  - `nutribalance-mcp` — TDEE & macro calculation, food nutrition lookup, meal plan generation across dietary modes (`standard`, `vegetarian`, `vegan`, `keto`, `high-protein`), nutrient-deficiency fixes, daily eating score `0–100`.
  - Accessible via `https://mcp.smithery.ai/ghyeogh` (originating from `https://server.smithery.ai/NutriBalance/nutribalance-mcp`).
- **Key Channels**: Social media, contextual ads on grocery delivery platforms, booths at supermarkets, parenting groups, cooking communities, supermarket apps/roadshows, and a **Free 1-Week Trial** to generate a weekly meal plan, grocery list, and automated cart purchasing.
- **Cost Budget ($120k–$165k Total)**:
  - Ideation & Design: `$10k–$15k`
  - Development & MVP: `$30k–$50k` (calorie/food logging engine, AI & computer vision integration, MCP protocol testing)
  - Production & Scaling: `$30k–$50k` (SaaS middleware & cloud infrastructure)
  - Year 1 Marketing: `$50k+` (consumer acquisition via influencer B2C campaigns & supermarket roadshows)
- **Revenue Model (EOY Target: $30,000/month MRR)**:
  - Family Subscription (`$19/month`): `1,000 users = $19,000 MRR`
  - Individual Subscription (`$9/month`): `500 users = $4,500 MRR`
  - 2% Grocery / Delivery Platform Referral (`$100/week` spend across `500 users` = `$4,000/month`)
  - On-Platform Contextual Ad Revenue: `$1,000/month`
  - Commercial Home-Delivery & Sponsored Recipe Placements: `$1,500/month` (bringing total projected EOY run-rate to `$30,000/month`)
- **Key Resources**: Venture/seed funds, cloud & AI/MCP platforms, engineering & nutrition manpower, and structured datasets (recipes, age-calibrated nutrient tables).
- **Key Partners**: Supermarkets, families, restaurants, dieticians, and food delivery platforms.
