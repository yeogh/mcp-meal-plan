/**
 * /api/nutribalance.js
 * Serverless API route for NutriBalance MCP tools:
 * - TDEE & personalised macros calculation
 * - Meal plan generation across dietary modes (standard, vegetarian, vegan, keto, high-protein)
 * - Nutrient-deficiency guidance & daily eating score (0–100)
 * - 10-dinner Agent Chef candidate proposal
 *
 * Strict Guardrails:
 * - Calls MCP exclusively via MCP/nutribalance-client.js on the server side.
 * - Checks process.env.NUTRIBALANCE_MCP_KEY before any upstream fetch; if missing and strict upstream
 *   mode is requested, returns 503 without calling upstream.
 * - Sets sensible Cache-Control headers on all responses.
 */

import {
  invokeNutriBalanceMcpTool,
  computeNutriBalanceProfile,
  getNutriBalanceCandidates,
  NUTRIBALANCE_MCP_URL,
  NUTRIBALANCE_ORIGIN_URL,
} from '../MCP/nutribalance-client.js';
import { sanitizeErrorMessage } from '../lib/api-client.js';

export default async function handler(req, res) {
  if (typeof res.status !== 'function') {
    res.status = function (code) {
      res.statusCode = code;
      return res;
    };
  }
  if (typeof res.json !== 'function') {
    res.json = function (data) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
  }

  // Set sensible Cache-Control headers on API responses
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  let body = req.body || {};
  if (req.method === 'POST' && (!body || Object.keys(body).length === 0) && typeof req.on === 'function') {
    try {
      const raw = await readRequestBody(req);
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      body = {};
    }
  }

  const url = new URL(req.url || '/api/nutribalance', `http://${req.headers?.host || 'localhost'}`);
  const dietaryMode = body.dietaryMode || url.searchParams.get('dietaryMode') || 'standard';
  const strictUpstream = body.strictUpstream === true || url.searchParams.get('strict') === 'true';
  const members = body.members || [];
  const dietaryRestrictions = body.dietaryRestrictions || ['No Peanuts (Allergy)', 'Mild Spice Only'];

  const mcpKey = process.env.NUTRIBALANCE_MCP_KEY;

  // Guardrail: BEFORE any external fetch, check that the required env var exists and is non-empty.
  // If missing and strict upstream check is requested, return 503 with a clear error message and do not call upstream.
  if (!mcpKey || !mcpKey.trim()) {
    const profile = computeNutriBalanceProfile({
      dietaryMode,
      members,
      dietaryRestrictions,
    });
    const candidates = getNutriBalanceCandidates(dietaryMode);

    if (strictUpstream) {
      return res.status(503).json({
        success: false,
        status: 'not_configured',
        error: 'NUTRIBALANCE_MCP_KEY is not configured on the server. Upstream NutriBalance MCP call skipped per security policy.',
        mcpEndpoint: NUTRIBALANCE_MCP_URL,
        mcpOrigin: NUTRIBALANCE_ORIGIN_URL,
        profile,
        candidates,
      });
    }

    return res.status(200).json({
      success: true,
      isDemo: true,
      message: 'NUTRIBALANCE_MCP_KEY not set; computed TDEE, macros, eating score, and 10 candidate dinners via local NutriBalance MCP engine.',
      mcpEndpoint: NUTRIBALANCE_MCP_URL,
      mcpOrigin: NUTRIBALANCE_ORIGIN_URL,
      profile,
      candidates,
    });
  }

  // When NUTRIBALANCE_MCP_KEY is present, call upstream MCP inside MCP/nutribalance-client.js
  try {
    const upstreamResult = await invokeNutriBalanceMcpTool('generate_meal_plan', {
      dietaryMode,
      members,
      dietaryRestrictions,
    });

    const profile = computeNutriBalanceProfile({
      dietaryMode,
      members,
      dietaryRestrictions,
    });
    const candidates = getNutriBalanceCandidates(dietaryMode);

    return res.status(200).json({
      success: true,
      isDemo: false,
      mcpEndpoint: NUTRIBALANCE_MCP_URL,
      mcpOrigin: NUTRIBALANCE_ORIGIN_URL,
      upstreamResult,
      profile,
      candidates,
    });
  } catch (err) {
    const profile = computeNutriBalanceProfile({
      dietaryMode,
      members,
      dietaryRestrictions,
    });
    const candidates = getNutriBalanceCandidates(dietaryMode);

    return res.status(503).json({
      success: false,
      isDemo: true,
      error: sanitizeErrorMessage(err),
      mcpEndpoint: NUTRIBALANCE_MCP_URL,
      mcpOrigin: NUTRIBALANCE_ORIGIN_URL,
      profile,
      candidates,
    });
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}
