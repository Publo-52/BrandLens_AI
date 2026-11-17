import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import { connectDB, getDatabaseHealth } from './config/db.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import organisationRoutes from './modules/organisations/organisation.routes.js';
import workspaceRoutes from './modules/organisations/workspace.routes.js';
import membershipRoutes from './modules/members/membership.routes.js';
import guidelineRoutes from './modules/guidelines/guideline.routes.js';
import factRoutes from './modules/facts/fact.routes.js';
import terminologyRoutes from './modules/terminology/terminology.routes.js';
import assetRoutes from './modules/assets/asset.routes.js';
import knowledgeRoutes from './modules/brand-knowledge/knowledge.routes.js';
import contentRoutes from './modules/contents/content.routes.js';
import approvalRoutes from './modules/approvals/approval.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

const app = express();

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  config.frontendOrigin,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // Permissive in dev; tighten in prod if needed
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-organisation-id', 'X-Organisation-Id'],
}));

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (config.env !== 'test') {
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
}

// ── Root service endpoint ─────────────────────────────────────────────────────
app.get(['/', '/api'], (req, res) => {
  res.json({
    name: 'BrandLens AI Application API',
    tagline: 'Intelligent brand governance, before you publish.',
    version: '1.0.0',
    team: 'ALGO_X',
    status: 'operational',
    documentation: '/docs',
    healthCheck: '/api/health',
  });
});

// ── Health Checks ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbHealth = getDatabaseHealth();
  res.status(200).json({
    status: 'healthy',
    service: 'backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.env,
    database: dbHealth,
  });
});

app.get('/api/health/ai', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const targetUrl = new URL('health', config.aiServiceUrl.endsWith('/') ? config.aiServiceUrl : `${config.aiServiceUrl}/`).toString();
    const aiResponse = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!aiResponse.ok) throw new Error(`AI service responded with HTTP ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    res.json({ success: true, aiServiceUrl: config.aiServiceUrl, aiServiceStatus: 'reachable', details: aiData });
  } catch (error) {
    res.status(503).json({ success: false, aiServiceUrl: config.aiServiceUrl, aiServiceStatus: 'unreachable', error: error.message });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/organisations/:organisationId/members', membershipRoutes);
app.use('/api/organisations', organisationRoutes);

app.use('/api/organisations/:organisationId/guidelines', guidelineRoutes);
app.use('/api/organisations/:organisationId/facts', factRoutes);
app.use('/api/organisations/:organisationId/terminology', terminologyRoutes);
app.use('/api/organisations/:organisationId/assets', assetRoutes);
app.use('/api/organisations/:organisationId/knowledge', knowledgeRoutes);

app.use('/api/organisations/:organisationId/contents/:contentId', approvalRoutes);
app.use('/api/organisations/:organisationId/contents', contentRoutes);
app.use('/api/organisations/:organisationId', auditRoutes);

// ── Error Handlers ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
