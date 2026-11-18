import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import { connectDB, getDatabaseHealth } from './config/db.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { sanitizeMongoInput } from './middleware/security.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
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
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ── Strict Allowlist CORS & Preflight ─────────────────────────────────────────
const LOCAL_DEV_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isOriginAllowed(origin) {
  if (!origin) return true;
  const normalized = origin.replace(/\/+$/, '');
  if (config.allowedOrigins.includes(normalized)) return true;
  if (!config.isProduction && LOCAL_DEV_ORIGIN_RE.test(normalized)) return true;
  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || isOriginAllowed(origin)) {
      return callback(null, true);
    }
    if (config.frontendOrigin === '*') {
      // Wildcard mode: allow request without reflecting untrusted origin with credentials
      return callback(null, false);
    }
    return callback(null, false);
  },
  credentials: config.frontendOrigin !== '*',
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-organisation-id',
    'X-Organisation-Id',
    'x-workspace-id',
    'X-Workspace-Id',
  ],
  maxAge: 86400,
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Vary', 'Origin');
  } else if (origin && config.frontendOrigin === '*') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-organisation-id, X-Organisation-Id, x-workspace-id, X-Workspace-Id'
    );
    if (req.method === 'OPTIONS') return res.status(204).end();
  }
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ── Body Parsing & NoSQL Input Sanitization ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeMongoInput);

// ── Global API Rate Limiting ─────────────────────────────────────────────────
app.use('/api/', apiRateLimiter);

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
