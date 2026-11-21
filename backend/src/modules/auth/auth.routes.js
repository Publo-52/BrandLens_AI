import express from 'express';
import mongoose from 'mongoose';
import { User } from './user.model.js';
import { Organisation } from '../organisations/organisation.model.js';
import { Membership, ROLES, MEMBERSHIP_STATUS } from '../members/membership.model.js';
import { generateToken, authenticate } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createSlug(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `org-${Date.now()}`;
}

// POST /api/auth/register
router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const { name, email, password, organisationName } = req.body;

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Name, email, and password must be valid text strings.', statusCode: 400 },
      });
    }

    if (!name.trim() || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name, email, and password are required.', statusCode: 400 },
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide a valid email address.', statusCode: 400 },
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 8 characters long.', statusCode: 400 },
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password cannot exceed 128 characters.', statusCode: 400 },
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
      name: name.trim().slice(0, 100),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    // Create default workspace if provided, or fallback to User's default workspace
    const orgName =
      (typeof organisationName === 'string' && organisationName.trim()) || `${user.name}'s Workspace`;
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
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required.', statusCode: 400 },
      });
    }

    if (password.length > 128) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password.', statusCode: 401 },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
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

// POST /api/auth/google - Requires a verified Firebase ID token via Authorization Bearer header
router.post('/google', authRateLimiter, authenticate, async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !user.isActive) {
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

    // If an existing verified user has no active workspace yet, provision one
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
