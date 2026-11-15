import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../modules/auth/user.model.js';
import { Membership, MEMBERSHIP_STATUS } from '../modules/members/membership.model.js';

export function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: '7d',
  });
}

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required. No token provided.', statusCode: 401 },
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired authentication token.', statusCode: 401 },
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { message: 'User account not found or has been deactivated.', statusCode: 401 },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Ensures user is an active member of the specified organisation,
 * and optionally validates required roles.
 * @param {string[]} allowedRoles - optional array of allowed roles (e.g. ['ADMIN', 'MANAGER'])
 */
export function requireOrgAccess(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const organisationId =
        req.params.organisationId ||
        req.headers['x-organisation-id'] ||
        req.body.organisationId ||
        req.query.organisationId;

      if (!organisationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Organisation ID is required for this operation.', statusCode: 400 },
        });
      }

      const membership = await Membership.findOne({
        organisationId,
        userId: req.user._id,
      });

      if (!membership || membership.status !== MEMBERSHIP_STATUS.ACTIVE) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied: You are not an active member of this organisation workspace.',
            statusCode: 403,
          },
        });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          error: {
            message: `Forbidden: Requires role '${allowedRoles.join(' or ')}'. Your current role is '${membership.role}'.`,
            statusCode: 403,
          },
        });
      }

      req.membership = membership;
      req.organisationId = organisationId;
      next();
    } catch (error) {
      next(error);
    }
  };
}
