/**
 * BrandLens AI — Demo Data Seed Script
 * Run: node seed.mjs
 *
 * Creates:
 *  - Demo Admin user   → admin@novatech.com / DemoPass123!
 *  - Demo Manager user → manager@novatech.com / DemoPass123!
 *  - Organisation      → NovaTech Global
 *  - Memberships       → Admin + Manager roles
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

// ── Inline models (avoid ESM circular import issues in a standalone script) ──

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const User = mongoose.model('User', userSchema);

const organisationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
    settings: {
      defaultLanguage: { type: String, default: 'en' },
      retentionDays: { type: Number, default: 90 },
    },
  },
  { timestamps: true }
);
const Organisation = mongoose.model('Organisation', organisationSchema);

const membershipSchema = new mongoose.Schema(
  {
    organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['ADMIN', 'MANAGER', 'REVIEWER', 'CREATOR'], default: 'CREATOR' },
    status: { type: String, enum: ['INVITED', 'ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);
membershipSchema.index({ organisationId: 1, userId: 1 }, { unique: true });
const Membership = mongoose.model('Membership', membershipSchema);

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_USERS = [
  { name: 'NovaTech Admin',   email: 'admin@novatech.com',   password: 'DemoPass123!', role: 'ADMIN' },
  { name: 'NovaTech Manager', email: 'manager@novatech.com', password: 'DemoPass123!', role: 'MANAGER' },
];

const ORG = { name: 'NovaTech Global', slug: 'novatech-global' };

// ── Seed ─────────────────────────────────────────────────────────────────────

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI not set in .env');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('✅  Connected!\n');

  // 1. Upsert organisation
  let org = await Organisation.findOne({ slug: ORG.slug });
  if (org) {
    console.log(`ℹ️   Organisation already exists: ${org.name}`);
  } else {
    org = await Organisation.create(ORG);
    console.log(`✅  Organisation created: ${org.name}`);
  }

  // 2. Upsert users + memberships
  for (const demo of DEMO_USERS) {
    let user = await User.findOne({ email: demo.email });
    if (user) {
      console.log(`ℹ️   User already exists: ${demo.email}`);
    } else {
      const passwordHash = await hashPassword(demo.password);
      user = await User.create({ name: demo.name, email: demo.email, passwordHash });
      console.log(`✅  User created: ${demo.email}`);
    }

    const existing = await Membership.findOne({ organisationId: org._id, userId: user._id });
    if (existing) {
      console.log(`ℹ️   Membership already exists for ${demo.email} (${existing.role})`);
    } else {
      await Membership.create({ organisationId: org._id, userId: user._id, role: demo.role, status: 'ACTIVE' });
      console.log(`✅  Membership created: ${demo.email} → ${demo.role}`);
    }
  }

  console.log('\n🎉  Seed complete!\n');
  console.log('  Login credentials:');
  for (const u of DEMO_USERS) {
    console.log(`  [${u.role.padEnd(7)}]  ${u.email}  /  ${u.password}`);
  }
  console.log('');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
