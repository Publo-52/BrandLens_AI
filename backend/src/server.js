import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';

async function startServer() {
  // Connect to database (graceful fallback if DB is not yet running)
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info(`BrandLens AI Backend running on port ${config.port} (${config.env})`);
    logger.info(`Health check accessible at http://localhost:${config.port}/api/health`);
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
