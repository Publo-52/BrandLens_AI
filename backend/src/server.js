// BrandLens AI Server Entrypoint
import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { migrateMembershipIndexes } from './modules/members/membership.model.js';

async function startServer() {
  // Connect to database (graceful fallback if DB is not yet running)
  await connectDB();
  await migrateMembershipIndexes();

  const server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`BrandLens AI Backend running on port ${config.port} on 0.0.0.0 (${config.env})`);
    logger.info(`Health check accessible at http://localhost:${config.port}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${config.port} is already in use by another running server instance.`);
      logger.info(`Run 'npx kill-port ${config.port}' to free it, or terminate other running Node processes.`);
    } else {
      logger.error('Server error:', err);
    }
    process.exit(1);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  logger.error('Fatal error starting server:', err);
  process.exit(1);
});

export default app;
