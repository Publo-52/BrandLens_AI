import express from 'express';
import { Membership, ROLES, MEMBERSHIP_STATUS } from './membership.model.js';
import { User } from '../auth/user.model.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';
import { validateObjectIdParam } from '../../middleware/security.js';

const router = express.Router({ mergeParams: true });

// GET /api/organisations/:organisationId/members
router.get('/', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const members = await Membership.find({
      organisationId: req.params.organisationId,
      status: { $ne: MEMBERSHIP_STATUS.SUSPENDED },
    })
      .populate('userId', 'name email firebaseUid isActive')
      .sort({ createdAt: -1 });

    const serializedMembers = members.map((m) => {
      const obj = m.toJSON ? m.toJSON() : m.toObject ? m.toObject({ virtuals: true }) : { ...m };
      const invName = m.invitedName || obj.invitedName || '';
      return {
        ...obj,
        invitedName: invName,
        fullName: obj.fullName || invName || obj.userId?.name || '',
        name: obj.name || invName || obj.fullName || obj.userId?.name || '',
      };
    });

    res.json({
      success: true,
      members: serializedMembers,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/organisations/:organisationId/members - Add or invite member by email
router.post('/', authenticate, requireOrgAccess([ROLES.ADMIN, ROLES.MANAGER]), async (req, res, next) => {
  try {
    const { email, role = ROLES.CREATOR, name, fullName, invitedName } = req.body;
    const enteredName = (invitedName || fullName || name || '').trim();

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'User email is required.', statusCode: 400 },
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

    // Managers cannot assign ADMIN role (only ADMIN can grant ADMIN)
    if (req.membership.role === ROLES.MANAGER && role === ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        error: { message: 'Managers cannot assign the ADMIN role.', statusCode: 403 },
      });
    }

    // Find or create placeholder user
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      const defaultPasswordHash = await User.hashPassword('WelcomeBrandLens123!');
      user = await User.create({
        name: enteredName || email.split('@')[0],
        email: email.toLowerCase().trim(),
        passwordHash: defaultPasswordHash,
      });
    } else if (enteredName && (!user.name || user.name === email.split('@')[0])) {
      user.name = enteredName;
      await user.save();
    }

    // Check if membership already exists
    let membership = await Membership.findOne({
      organisationId: req.params.organisationId,
      userId: user._id,
    });

    if (membership) {
      if (membership.status === MEMBERSHIP_STATUS.ACTIVE) {
        return res.status(409).json({
          success: false,
          error: { message: 'User is already an active member of this organisation.', statusCode: 409 },
        });
      }
      // Re-activate suspended or invited membership
      membership.status = MEMBERSHIP_STATUS.ACTIVE;
      membership.role = role;
      if (enteredName) membership.invitedName = enteredName;
      membership.invitedEmail = email.toLowerCase().trim();
      await membership.save();
    } else {
      membership = await Membership.create({
        organisationId: req.params.organisationId,
        userId: user._id,
        role,
        status: MEMBERSHIP_STATUS.ACTIVE,
        invitedName: enteredName,
        invitedEmail: email.toLowerCase().trim(),
      });
    }

    const populated = await Membership.findById(membership._id).populate('userId', 'name email');

    res.status(201).json({
      success: true,
      membership: {
        ...populated.toJSON(),
        invitedName: enteredName || populated.invitedName,
        fullName: enteredName || populated.fullName || populated.invitedName,
        name: enteredName || populated.name || populated.invitedName,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/organisations/:organisationId/members/:memberId - Update member role or status (ADMIN only)
router.patch('/:memberId', authenticate, requireOrgAccess([ROLES.ADMIN]), validateObjectIdParam('memberId'), async (req, res, next) => {
  try {
    const { role, status } = req.body;
    const updates = {};

    if (role) {
      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid role. Allowed roles are: ${Object.values(ROLES).join(', ')}`,
            statusCode: 400,
          },
        });
      }
      updates.role = role;
    }

    if (status) {
      if (!Object.values(MEMBERSHIP_STATUS).includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid status. Allowed statuses are: ${Object.values(MEMBERSHIP_STATUS).join(', ')}`,
            statusCode: 400,
          },
        });
      }
      updates.status = status;
    }

    const existingMembership = await Membership.findOne({
      _id: req.params.memberId,
      organisationId: req.params.organisationId,
    });

    if (!existingMembership) {
      return res.status(404).json({
        success: false,
        error: { message: 'Membership not found in this organisation.', statusCode: 404 },
      });
    }

    const isDemotingOrDeactivatingAdmin =
      existingMembership.role === ROLES.ADMIN &&
      existingMembership.status === MEMBERSHIP_STATUS.ACTIVE &&
      ((updates.role && updates.role !== ROLES.ADMIN) ||
        (updates.status && updates.status !== MEMBERSHIP_STATUS.ACTIVE));

    if (isDemotingOrDeactivatingAdmin) {
      const activeAdminCount = await Membership.countDocuments({
        organisationId: req.params.organisationId,
        role: ROLES.ADMIN,
        status: MEMBERSHIP_STATUS.ACTIVE,
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              'Cannot demote or deactivate the last active workspace Admin. Promote another member to Admin first.',
            statusCode: 400,
          },
        });
      }
    }

    const membership = await Membership.findOneAndUpdate(
      { _id: req.params.memberId, organisationId: req.params.organisationId },
      { $set: updates },
      { new: true }
    ).populate('userId', 'name email firebaseUid');

    res.json({
      success: true,
      membership,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
