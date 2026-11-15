import mongoose from 'mongoose';
import dns from 'node:dns';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

// Ensure reliable SRV DNS resolution on Windows environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // fallback to system default if restricted
}

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      logger.warn(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB connection lost / disconnected.');
    });

    // Set serverSelectionTimeoutMS to 5000 so app doesn't hang indefinitely if DB is offline during dev
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    logger.warn(`Initial MongoDB connection failed (${error.message}). The server will run in degraded mode until MongoDB is reachable.`);
  }
}

export function getDatabaseHealth() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const stateCode = mongoose.connection.readyState;
  return {
    status: stateCode === 1 ? 'connected' : 'disconnected',
    state: states[stateCode] || 'unknown',
    uri: config.mongoUri.replace(/:([^:@]+)@/, ':****@'), // redact password in logs/health if present
  };
}
