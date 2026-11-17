import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { verifyFirebaseToken } from './verifyFirebaseToken.js';
import { requireWorkspaceRole } from './requireWorkspaceRole.js';

export function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: '7d',
  });
}

// Delegate authenticate to verifyFirebaseToken (handles Firebase ID token, Demo tokens, and JWT fallback)
export const authenticate = verifyFirebaseToken;

// Delegate requireOrgAccess to requireWorkspaceRole (handles server-side RBAC on x-organisation-id or :organisationId)
export const requireOrgAccess = requireWorkspaceRole;

export { verifyFirebaseToken, requireWorkspaceRole };
