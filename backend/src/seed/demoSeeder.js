import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Organisation } from '../modules/organisations/organisation.model.js';
import { User } from '../modules/auth/user.model.js';
import { Membership, ROLES, MEMBERSHIP_STATUS } from '../modules/members/membership.model.js';
import admin from '../config/firebaseAdmin.js';
import { logger } from '../utils/logger.js';

export const DEMO_USERS = [
  {
    email: 'admin@novatech.demo',
    name: 'NovaTech Admin',
    role: ROLES.ADMIN,
    firebaseUid: 'demo_admin',
    password: 'NovaTechDemo2026!',
  },
  {
    email: 'manager@novatech.demo',
    name: 'NovaTech Manager',
    role: ROLES.MANAGER,
    firebaseUid: 'demo_manager',
    password: 'NovaTechDemo2026!',
  },
  {
    email: 'reviewer@novatech.demo',
    name: 'NovaTech Reviewer',
    role: ROLES.REVIEWER,
    firebaseUid: 'demo_reviewer',
    password: 'NovaTechDemo2026!',
  },
  {
    email: 'creator@novatech.demo',
    name: 'NovaTech Creator',
    role: ROLES.CREATOR,
    firebaseUid: 'demo_creator',
    password: 'NovaTechDemo2026!',
  },
];

export async function seedDemoAccounts() {
  logger.info('--- Seeding NovaTech Global & 4 Demo Accounts ---');

  // 1. Ensure NovaTech Global workspace exists
  let org = await Organisation.findOne({ slug: 'novatech-global' });
  if (!org) {
    org = await Organisation.create({
      name: 'NovaTech Global',
      slug: 'novatech-global',
      settings: {
        defaultLanguage: 'en',
        retentionDays: 90,
      },
    });
    logger.info(`Created organisation: ${org.name} (${org.slug})`);
  } else {
    logger.info(`Found existing organisation: ${org.name} (${org.slug})`);
  }

  // 2. Seed or update each demo user & membership
  for (const demoUser of DEMO_USERS) {
    // Optional Firebase Auth user creation if admin SDK is configured
    if (admin.apps.length) {
      try {
        await admin.auth().getUserByEmail(demoUser.email);
        logger.info(`Firebase Auth user exists: ${demoUser.email}`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          try {
            await admin.auth().createUser({
              uid: demoUser.firebaseUid,
              email: demoUser.email,
              displayName: demoUser.name,
              password: demoUser.password,
            });
            logger.info(`Created Firebase Auth user: ${demoUser.email}`);
          } catch (createErr) {
            logger.warn(`Could not create Firebase user for ${demoUser.email}: ${createErr.message}`);
          }
        }
      }
    }

    // Upsert in MongoDB
    let user = await User.findOne({ email: demoUser.email });
    if (!user) {
      const passwordHash = await User.hashPassword(demoUser.password);
      user = await User.create({
        firebaseUid: demoUser.firebaseUid,
        email: demoUser.email,
        name: demoUser.name,
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(demoUser.name)}`,
      });
      logger.info(`Created MongoDB user: ${user.email} (${user.name})`);
    } else {
      user.firebaseUid = demoUser.firebaseUid;
      user.name = demoUser.name;
      user.passwordHash = await User.hashPassword(demoUser.password);
      if (!user.avatarUrl) {
        user.avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(demoUser.name)}`;
      }
      await user.save();
      logger.info(`Updated MongoDB user: ${user.email}`);
    }

    // Link createdBy on org if first user
    if (!org.createdBy && demoUser.role === ROLES.ADMIN) {
      org.createdBy = user._id;
      await org.save();
    }

    // Upsert Membership
    let membership = await Membership.findOne({
      organisationId: org._id,
      userId: user._id,
    });

    if (!membership) {
      membership = await Membership.create({
        organisationId: org._id,
        userId: user._id,
        role: demoUser.role,
        status: MEMBERSHIP_STATUS.ACTIVE,
      });
      logger.info(`Created membership: ${user.email} -> ${demoUser.role}`);
    } else {
      membership.role = demoUser.role;
      membership.status = MEMBERSHIP_STATUS.ACTIVE;
      await membership.save();
      logger.info(`Updated membership: ${user.email} -> ${demoUser.role}`);
    }
  }

  logger.info('--- Seeding completed successfully ---');
  return { org, users: DEMO_USERS };
}

// Standalone execution support
if (process.argv[1]?.endsWith('demoSeeder.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDemoAccounts();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      logger.error('Error during demo seeding:', err);
      process.exit(1);
    }
  })();
}
