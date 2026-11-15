import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { getDatabaseHealth } from './config/db.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import organisationRoutes from './modules/organisations/organisation.routes.js';
import membershipRoutes from './modules/members/membership.routes.js';

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendOrigin === '*' ? true : [config.frontendOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Root service endpoint
app.get('/', (req, res) => {
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

// Primary backend health check
app.get('/api/health', (req, res) => {
  const dbHealth = getDatabaseHealth();
  const isHealthy = true; // Service is running; DB status reported transparently

  res.status(200).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.env,
    database: dbHealth,
  });
});

// AI Service proxy health check
app.get('/api/health/ai', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const aiResponse = await fetch(`${config.aiServiceUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      throw new Error(`AI service responded with HTTP ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    res.json({
      success: true,
      aiServiceUrl: config.aiServiceUrl,
      aiServiceStatus: 'reachable',
      details: aiData,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      aiServiceUrl: config.aiServiceUrl,
      aiServiceStatus: 'unreachable',
      error: error.message,
    });
  }
});

// Milestone 2 Authentication, Organisations & RBAC Routes
app.use('/api/auth', authRoutes);
app.use('/api/organisations/:organisationId/members', membershipRoutes);
app.use('/api/organisations', organisationRoutes);

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
