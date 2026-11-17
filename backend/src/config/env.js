import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to current working directory if needed

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: (process.env.MONGODB_URI || 'mongodb://localhost:27017/brandlens').trim(),
  jwtSecret: (process.env.JWT_SECRET || 'dev_secret_brandlens_algo_x').trim(),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  get aiServiceUrl() {
    const rawUrl = process.env.AI_SERVICE_URL || 'https://brand-lens-ai-exlm.vercel.app';
    return rawUrl.replace(/\/+$/, '');
  },
  aiServiceApiKey: process.env.AI_SERVICE_API_KEY || 'local_dev_key',
  cloudinaryUrl: process.env.CLOUDINARY_URL || '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || 'kewdjwvy',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '729575224183126',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || 'jwg9Orh_jW3IkcIo_BPDXyt_nzA',
};
