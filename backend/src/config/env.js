import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to current working directory if needed

const DEV_FALLBACK_JWT_SECRET = 'dev_secret_brandlens_algo_x';

const nodeEnv = (process.env.NODE_ENV || 'development').trim();
const isProduction = nodeEnv === 'production';

// Parse comma-separated allowed CORS origins from FRONTEND_ORIGIN and ALLOWED_ORIGINS
const rawOrigins = [process.env.FRONTEND_ORIGIN, process.env.ALLOWED_ORIGINS]
  .filter(Boolean)
  .join(',')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'];
const defaultProdOrigins = ['https://brand-lens-ai-ten.vercel.app'];

export const config = {
  env: nodeEnv,
  isProduction,
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: (process.env.MONGODB_URI || 'mongodb://localhost:27017/brandlens').trim(),
  jwtSecret: (process.env.JWT_SECRET || DEV_FALLBACK_JWT_SECRET).trim(),
  frontendOrigin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').trim(),
  allowedOrigins: Array.from(
    new Set([...rawOrigins, ...defaultProdOrigins, ...(isProduction ? [] : defaultDevOrigins)])
  ),
  allowDemoAuth:
    process.env.ALLOW_DEMO_AUTH !== undefined
      ? process.env.ALLOW_DEMO_AUTH === 'true'
      : !isProduction,
  get aiServiceUrl() {
    const rawUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    return rawUrl.replace(/\/+$/, '');
  },
  aiServiceApiKey: (process.env.AI_SERVICE_API_KEY || '').trim(),
  cloudinaryUrl: (process.env.CLOUDINARY_URL || '').trim(),
  cloudinaryCloudName: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  cloudinaryApiKey: (process.env.CLOUDINARY_API_KEY || '').trim(),
  cloudinaryApiSecret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
  firebaseServiceAccountPath: (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '').trim(),
};

// Startup security validation checks (non-fatal warning in dev, explicit warnings in prod)
if (config.isProduction) {
  if (!process.env.JWT_SECRET || config.jwtSecret === DEV_FALLBACK_JWT_SECRET || config.jwtSecret.length < 32) {
    console.error(
      '[SECURITY WARNING] JWT_SECRET is missing, weak, or using a development default in production. Set a strong 32+ character secret!'
    );
  }
  if (!process.env.MONGODB_URI) {
    console.error('[SECURITY WARNING] MONGODB_URI is not explicitly set in production environment.');
  }
}
