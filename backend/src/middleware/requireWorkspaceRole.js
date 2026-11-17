import mongoose from 'mongoose';
import { Membership } from '../modules/members/membership.model.js';

export function requireWorkspaceRole(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const organisationId =
        req.headers['x-organisation-id'] ||
        req.params.organisationId ||
        req.body?.organisationId ||
        req.query?.organisationId;

      if (!organisationId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Missing x-organisation-id header', statusCode: 400 },
        });
      }

      if (!mongoose.Types.ObjectId.isValid(organisationId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid workspace ID: "${organisationId}". Expected a 24-character hexadecimal ObjectId.`,
            statusCode: 400,
          },
        });
      }

      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          error: { message: 'Authentication required before checking workspace role', statusCode: 401 },
        });
      }

      const membership = await Membership.findOne({
        organisationId,
        userId: req.user._id,
        status: 'ACTIVE',
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied: Not an active member of this workspace', statusCode: 403 },
        });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          error: {
            message: `Role ${membership.role} is not permitted for this action`,
            statusCode: 403,
            requiredRoles: allowedRoles,
            currentRole: membership.role,
          },
        });
      }

      req.organisationId = organisationId;
      req.membership = membership;
      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { message: 'Workspace authorisation check failed', statusCode: 500 },
      });
    }
  };
}

export default requireWorkspaceRole;
