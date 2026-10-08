/**
 * server.ts
 * Express server for AI Studio preview and full-stack deployment.
 * Registers the shared Vercel API handlers (/api/health, /api/meal-plan,
 * /api/recipes, /api/nutribalance) without duplicating business logic,
 * and mounts Vite middleware in development or static dist in production.
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import healthHandler from './api/health.js';
import mealPlanHandler from './api/meal-plan.js';
import recipesHandler from './api/recipes.js';
import nutribalanceHandler from './api/nutribalance.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Register shared serverless handlers
  app.all(['/api/health', '/api/health.js'], async (req, res) => {
    try {
      await healthHandler(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Health API error' });
    }
  });

  app.all(['/api/meal-plan', '/api/meal-plan.js'], async (req, res) => {
    try {
      await mealPlanHandler(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Meal plan API error' });
    }
  });

  app.all(['/api/recipes', '/api/recipes.js'], async (req, res) => {
    try {
      await recipesHandler(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Recipes API error' });
    }
  });

  app.all(['/api/nutribalance', '/api/nutribalance.js'], async (req, res) => {
    try {
      await nutribalanceHandler(req, res);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'NutriBalance MCP API error' });
    }
  });

  // Vite middleware for development; static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Heirloom Table server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
