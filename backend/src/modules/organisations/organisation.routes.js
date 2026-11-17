import express from 'express';
import { Organisation } from './organisation.model.js';
import { Membership, ROLES, MEMBERSHIP_STATUS } from '../members/membership.model.js';
import { authenticate, requireOrgAccess } from '../../middleware/auth.js';

const router = express.Router();

function createSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `org-${Date.now()}`;
}

// GET /api/organisations - List all workspaces user is a member of
router.get('/', authenticate, async (req, res, next) => {
  try {
    const memberships = await Membership.find({
      userId: req.user._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
    }).populate('organisationId');

    const organisations = memberships
      .filter((m) => m.organisationId)
      .map((m) => ({
        ...m.organisationId.toJSON(),
        role: m.role,
        membershipId: m._id,
      }));

    res.json({
      success: true,
      workspaces: organisations,
      organisations,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/organisations - Create a new workspace
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, settings } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Organisation name is required.', statusCode: 400 },
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
      organisation,
      membership,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/organisations/:organisationId - Get workspace details (requires membership)
router.get('/:organisationId', authenticate, requireOrgAccess(), async (req, res, next) => {
  try {
    const organisation = await Organisation.findById(req.params.organisationId);
    if (!organisation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Organisation not found.', statusCode: 404 },
      });
    }

    res.json({
      success: true,
      organisation,
      currentRole: req.membership.role,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/organisations/:organisationId - Update workspace details (requires ADMIN role)
router.patch('/:organisationId', authenticate, requireOrgAccess([ROLES.ADMIN]), async (req, res, next) => {
  try {
    const { name, settings } = req.body;
    const updates = {};

    if (name && name.trim()) {
      updates.name = name.trim();
    }
    if (settings) {
      updates.settings = settings;
    }

    const organisation = await Organisation.findByIdAndUpdate(
      req.params.organisationId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      organisation,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
