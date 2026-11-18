import express from 'express';
import { Organisation } from './organisation.model.js';
import { Membership, ROLES, MEMBERSHIP_STATUS } from '../members/membership.model.js';
import { User } from '../auth/user.model.js';
import { verifyFirebaseToken } from '../../middleware/verifyFirebaseToken.js';
import { requireWorkspaceRole } from '../../middleware/requireWorkspaceRole.js';
import { generateToken } from '../../middleware/auth.js';
import { validateObjectIdParam } from '../../middleware/security.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

function createSlug(name) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `workspace-${Date.now()}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/workspaces - List all workspaces user is an active member of
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', verifyFirebaseToken, async (req, res, next) => {
  try {
    const memberships = await Membership.find({
      userId: req.user._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
    })
      .populate('organisationId')
      .sort({ updatedAt: -1 });

    const workspaces = memberships
      .filter((m) => m.organisationId)
      .map((m) => {
        const org = m.organisationId.toJSON ? m.organisationId.toJSON() : m.organisationId;
        return {
          ...org,
          role: m.role,
          membershipId: m._id,
          status: m.status,
        };
      });

    res.json({
      success: true,
      workspaces,
      organisations: workspaces,
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /api/workspaces - Create a new workspace (user becomes ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', verifyFirebaseToken, async (req, res, next) => {
  try {
    const { name, settings } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Workspace name is required.', statusCode: 400 },
      });
    }

    const baseSlug = createSlug(name);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Organisation.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const organisation = await Organisation.create({
      name: name.trim(),
      slug: uniqueSlug,
      createdBy: req.user._id,
      settings: settings || {},
    });

    const membership = await Membership.create({
      organisationId: organisation._id,
      userId: req.user._id,
      role: ROLES.ADMIN,
      status: MEMBERSHIP_STATUS.ACTIVE,
    });

    res.status(201).json({
      success: true,
      workspace: {
        ...organisation.toJSON(),
        role: membership.role,
        membershipId: membership._id,
      },
      organisation,
      membership,
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/workspaces/:organisationId/invite - Invite collaborator (ADMIN only)
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:organisationId/invite',
  verifyFirebaseToken,
  requireWorkspaceRole([ROLES.ADMIN]),
  async (req, res, next) => {
    try {
      const { email, role = ROLES.CREATOR } = req.body;
      const { organisationId } = req.params;

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invitee email address is required.', statusCode: 400 },
        });
      }

      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid role. Allowed roles are: ${Object.values(ROLES).join(', ')}`,
            statusCode: 400,
          },
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists in User collection
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        // Check if membership already exists for this user in this workspace
        let membership = await Membership.findOne({
          organisationId,
          userId: existingUser._id,
        });

        if (membership) {
          if (membership.status === MEMBERSHIP_STATUS.ACTIVE) {
            return res.status(409).json({
              success: false,
              error: {
                message: `${normalizedEmail} is already an active member of this workspace.`,
                statusCode: 409,
              },
            });
          }
          // Reactivate suspended or previously invited membership
          membership.status = MEMBERSHIP_STATUS.ACTIVE;
          membership.role = role;
          await membership.save();
        } else {
          membership = await Membership.create({
            organisationId,
            userId: existingUser._id,
            role,
            status: MEMBERSHIP_STATUS.ACTIVE,
          });
        }

        const populated = await Membership.findById(membership._id)
          .populate('userId', 'name email avatarUrl')
          .populate('organisationId', 'name slug');

        return res.status(201).json({
          success: true,
          membership: populated,
          status: 'ACTIVE',
          message: `Active membership created for ${normalizedEmail}.`,
        });
      }

      // User does not exist yet: create or update an INVITED membership
      let pendingMembership = await Membership.findOne({
        organisationId,
        invitedEmail: normalizedEmail,
      });

      if (pendingMembership) {
        pendingMembership.role = role;
        pendingMembership.status = MEMBERSHIP_STATUS.INVITED;
        await pendingMembership.save();
      } else {
        pendingMembership = await Membership.create({
          organisationId,
          invitedEmail: normalizedEmail,
          userId: null,
          role,
          status: MEMBERSHIP_STATUS.INVITED,
        });
      }

      res.status(201).json({
        success: true,
        membership: pendingMembership,
        status: 'INVITED',
        message: `Invitation sent to ${normalizedEmail}. Workspace access will activate upon sign up.`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. PATCH /api/workspaces/:organisationId/members/:memberId - Update member role/status
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  '/:organisationId/members/:memberId',
  verifyFirebaseToken,
  requireWorkspaceRole([ROLES.ADMIN]),
  validateObjectIdParam('memberId'),
  async (req, res, next) => {
    try {
      const { organisationId, memberId } = req.params;
      const { role, status } = req.body;

      const membership = await Membership.findOne({
        _id: memberId,
        organisationId,
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          error: { message: 'Workspace membership record not found.', statusCode: 404 },
        });
      }

      if (role) {
        if (!Object.values(ROLES).includes(role)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}`,
              statusCode: 400,
            },
          });
        }
        membership.role = role;
      }

      if (status) {
        if (!Object.values(MEMBERSHIP_STATUS).includes(status)) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Invalid status. Allowed statuses: ${Object.values(MEMBERSHIP_STATUS).join(', ')}`,
              statusCode: 400,
            },
          });
        }
        membership.status = status;
      }

      await membership.save();

      const populated = await Membership.findById(membership._id).populate('userId', 'name email avatarUrl');

      res.json({
        success: true,
        membership: populated,
        message: 'Member updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/workspaces/:organisationId/members - List members of workspace
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/:organisationId/members',
  verifyFirebaseToken,
  requireWorkspaceRole(),
  async (req, res, next) => {
    try {
      const { organisationId } = req.params;
      const members = await Membership.find({ organisationId })
        .populate('userId', 'name email avatarUrl isActive')
        .sort({ createdAt: 1 });

      res.json({
        success: true,
        members,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST /api/workspaces/demo-login - 1-Click Demo Login for Hackathon Judges
// ─────────────────────────────────────────────────────────────────────────────
router.post('/demo-login', authRateLimiter, async (req, res, next) => {
  try {
    const { role = 'ADMIN' } = req.body;
    const normalizedRole = typeof role === 'string' ? role.toUpperCase().trim() : '';

    if (!Object.values(ROLES).includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid demo role: ${role}`, statusCode: 400 },
      });
    }

    const email = `${normalizedRole.toLowerCase()}@novatech.demo`;
    const name = `NovaTech ${normalizedRole.charAt(0) + normalizedRole.slice(1).toLowerCase()}`;

    // 1. Ensure NovaTech Global organisation exists
    let org = await Organisation.findOne({ slug: 'novatech-global' });
    if (!org) {
      org = await Organisation.create({
        name: 'NovaTech Global',
        slug: 'novatech-global',
        settings: { defaultLanguage: 'en', retentionDays: 90 },
      });
    }

    // 2. Ensure user exists
    let user = await User.findOne({ email });
    if (!user) {
      const defaultPasswordHash = await User.hashPassword('NovaTechDemo2026!');
      user = await User.create({
        firebaseUid: `demo_${normalizedRole.toLowerCase()}`,
        name,
        email,
        passwordHash: defaultPasswordHash,
        avatarUrl: '',
      });
    }

    // 3. Ensure membership exists
    let membership = await Membership.findOne({
      organisationId: org._id,
      userId: user._id,
    });

    if (!membership) {
      membership = await Membership.create({
        organisationId: org._id,
        userId: user._id,
        role: normalizedRole,
        status: MEMBERSHIP_STATUS.ACTIVE,
      });
    } else if (membership.role !== normalizedRole || membership.status !== MEMBERSHIP_STATUS.ACTIVE) {
      membership.role = normalizedRole;
      membership.status = MEMBERSHIP_STATUS.ACTIVE;
      await membership.save();
    }

    // Generate signed token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
      },
      workspace: {
        _id: org._id,
        name: org.name,
        slug: org.slug,
        role: normalizedRole,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
