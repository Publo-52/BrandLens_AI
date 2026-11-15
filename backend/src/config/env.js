import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/brandlens',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_brandlens_algo_x',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  get aiServiceUrl() {
    const rawUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    return rawUrl.replace(/\/+$/, '');
  },
  aiServiceApiKey: process.env.AI_SERVICE_API_KEY || 'local_dev_key',
};
