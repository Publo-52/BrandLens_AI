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

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 8 characters long.', statusCode: 400 },
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

// POST /api/auth/demo-login - 1-Click Judge Demo Role Login
router.post('/demo-login', async (req, res, next) => {
  try {
    const { role = 'ADMIN' } = req.body;
    const normalizedRole = role.toUpperCase();

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
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
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

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
        avatarUrl: user.avatarUrl,
      },
      workspace: {
        _id: org._id,
        name: org.name,
        slug: org.slug,
        role: normalizedRole,
      },
      role: normalizedRole,
      membership,
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
