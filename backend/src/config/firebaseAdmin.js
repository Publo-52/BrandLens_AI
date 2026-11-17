import './env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { logger } from '../utils/logger.js';

let isFirebaseInitialized = false;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let serviceAccount = null;

// 1. Check for service account JSON files in workspace root or backend
const potentialJsonPaths = [
  path.resolve(__dirname, '../../../brandlens-ai-7de68-firebase-adminsdk-fbsvc-a956b4e375.json'),
  path.resolve(__dirname, '../../brandlens-ai-7de68-firebase-adminsdk-fbsvc-a956b4e375.json'),
  path.resolve(__dirname, '../../../firebase-service-account.json'),
  path.resolve(__dirname, '../../firebase-service-account.json'),
];

for (const p of potentialJsonPaths) {
  if (fs.existsSync(p)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
      logger.info(`Loaded Firebase service account credentials from file: ${path.basename(p)}`);
      break;
    } catch (e) {
      logger.warn(`Failed reading service account JSON at ${p}: ${e.message}`);
    }
  }
}

// 2. Fallback to environment variables
const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || serviceAccount?.client_email;
let privateKey = process.env.FIREBASE_PRIVATE_KEY || serviceAccount?.private_key;

if (privateKey) {
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    try {
      privateKey = JSON.parse(privateKey);
    } catch (e) {
      privateKey = privateKey.slice(1, -1);
    }
  }
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (getApps().length === 0) {
  if (serviceAccount) {
    try {
      initializeApp({ credential: cert(serviceAccount) });
      isFirebaseInitialized = true;
      logger.info('Firebase Admin SDK initialized successfully with service account JSON file.');
    } catch (err) {
      logger.warn(`Firebase Admin SDK init with file error: ${err.message}`);
    }
  }

  if (!isFirebaseInitialized && projectId && clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      isFirebaseInitialized = true;
      logger.info('Firebase Admin SDK initialized successfully with environment credentials.');
    } catch (err) {
      logger.warn(`Firebase Admin SDK credential error: ${err.message}. Initializing fallback.`);
      try {
        initializeApp({ projectId });
      } catch (e) {
        // Fallback initialized
      }
    }
  } else if (!isFirebaseInitialized && projectId) {
    try {
      initializeApp({ projectId });
      isFirebaseInitialized = true;
      logger.info(`Firebase Admin SDK initialized with project ID: ${projectId}`);
    } catch (err) {
      logger.warn(`Firebase Admin SDK project init: ${err.message}`);
    }
  } else if (!isFirebaseInitialized) {
    logger.warn('FIREBASE_PROJECT_ID / FIREBASE_PRIVATE_KEY not set. Falling back to test verification mode.');
  }
} else {
  isFirebaseInitialized = true;
}

// Create a compatibility object supporting both default admin.auth() and admin.apps
const admin = {
  get apps() {
    return getApps();
  },
  auth(app) {
    return getApps().length > 0 ? (app ? getAuth(app) : getAuth()) : null;
  },
  initializeApp,
  getApps,
  getApp,
  cert,
};

export { isFirebaseInitialized, getAuth, getApps, initializeApp, cert };
export default admin;
