import express from 'express';
import { User } from './user.model.js';
import { Organisation } from '../organisations/organisation.model.js';
import { Membership, ROLES, MEMBERSHIP_STATUS } from '../members/membership.model.js';
import { generateToken, authenticate } from '../../middleware/auth.js';

const router = express.Router();

function createSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `org-${Date.now()}`;
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, organisationName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name, email, and password are required.', statusCode: 400 },
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters long.', statusCode: 400 },
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: 'An account with this email already exists.', statusCode: 409 },
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    // Create default workspace if provided, or fallback to User's default workspace
    const orgName = organisationName?.trim() || `${user.name}'s Workspace`;
    let baseSlug = createSlug(orgName);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Organisation.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const organisation = await Organisation.create({
      name: orgName,
      slug: uniqueSlug,
    });

    // Bind user as ADMIN of the newly created workspace
    const membership = await Membership.create({
      organisationId: organisation._id,
      userId: user._id,
      role: ROLES.ADMIN,
      status: MEMBERSHIP_STATUS.ACTIVE,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user,
      organisation,
      membership,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required.', statusCode: 400 },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password.', statusCode: 401 },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password.', statusCode: 401 },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: 'Your account is deactivated. Please contact an administrator.', statusCode: 403 },
      });
    }

    // Retrieve active memberships with populated organisation details
    const memberships = await Membership.find({
      userId: user._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
    }).populate('organisationId');

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user,
      memberships,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/google
router.post('/google', async (req, res, next) => {
  try {
    const { email, name, firebaseUid } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email is required from Google sign-in.', statusCode: 400 },
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Auto-create user with a secure generated password hash
      const randomPassword = `GAuth_${firebaseUid || Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const passwordHash = await User.hashPassword(randomPassword);

      user = await User.create({
        name: (name || cleanEmail.split('@')[0]).trim(),
        email: cleanEmail,
        passwordHash,
      });

      // Create a default workspace for this Google user
      const orgName = `${user.name}'s Workspace`;
      let baseSlug = createSlug(orgName);
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await Organisation.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${baseSlug}-${counter++}`;
      }

      const organisation = await Organisation.create({
        name: orgName,
        slug: uniqueSlug,
      });

      await Membership.create({
        organisationId: organisation._id,
        userId: user._id,
        role: ROLES.ADMIN,
        status: MEMBERSHIP_STATUS.ACTIVE,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: 'Your account is deactivated. Please contact an administrator.', statusCode: 403 },
      });
    }

    // Retrieve active memberships with populated organisation details
    let memberships = await Membership.find({
      userId: user._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
    }).populate('organisationId');

    // If an existing user has no active workspace yet, provision one
    if (!memberships || memberships.length === 0) {
      const orgName = `${user.name}'s Workspace`;
      let baseSlug = createSlug(orgName);
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await Organisation.findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${baseSlug}-${counter++}`;
      }

      const organisation = await Organisation.create({
        name: orgName,
        slug: uniqueSlug,
      });

      const newMembership = await Membership.create({
        organisationId: organisation._id,
        userId: user._id,
        role: ROLES.ADMIN,
        status: MEMBERSHIP_STATUS.ACTIVE,
      });
      newMembership.organisationId = organisation;
      memberships = [newMembership];
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user,
      memberships,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const memberships = await Membership.find({
      userId: req.user._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
    }).populate('organisationId');

    res.json({
      success: true,
      user: req.user,
      memberships,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export default router;
