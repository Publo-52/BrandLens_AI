import test from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { Membership, migrateMembershipIndexes } from '../src/modules/members/membership.model.js';
import { Organisation } from '../src/modules/organisations/organisation.model.js';
import { User } from '../src/modules/auth/user.model.js';

if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {}
}

test('Invite unregistered collaborator with Full Name "Test User" and verify table rendering', async () => {
  let testOrg;
  try {
    await mongoose.connect(config.mongoUri);
    await migrateMembershipIndexes();

    testOrg = await Organisation.create({
      name: 'Full Name Verification Org',
      slug: `fullname-test-${Date.now()}`,
      settings: {},
    });

    const testEmail = `test.user.${Date.now()}@example.com`;
    const enteredFullName = 'Test User';

    // 1. Simulate POST /invite payload with name, fullName, and invitedName
    const payload = {
      email: testEmail,
      name: enteredFullName.trim(),
      fullName: enteredFullName.trim(),
      invitedName: enteredFullName.trim(),
      role: 'CREATOR',
    };

    const enteredName = (payload.invitedName || payload.fullName || payload.name || '').trim();
    assert.equal(enteredName, 'Test User', 'Extracted name must be "Test User"');

    const pendingMembership = await Membership.create({
      organisationId: testOrg._id,
      invitedEmail: payload.email.toLowerCase().trim(),
      invitedName: enteredName,
      userId: null,
      role: payload.role,
      status: 'INVITED',
    });

    assert.equal(pendingMembership.invitedName, 'Test User');
    assert.equal(pendingMembership.userId, null);
    assert.equal(pendingMembership.status, 'INVITED');

    // 2. Fetch membership as returned by GET /members
    const found = await Membership.findById(pendingMembership._id)
      .populate('userId', 'name email firebaseUid avatarUrl isActive');

    const serialized = found.toJSON ? found.toJSON() : found.toObject({ virtuals: true });
    console.log('Serialized membership:', JSON.stringify(serialized, null, 2));
    assert.equal(serialized.invitedName, 'Test User');
    assert.equal(serialized.fullName, 'Test User');
    assert.equal(serialized.name, 'Test User');

    // 3. Test exact Collaborators table rendering expression:
    // member.userId?.name || member.invitedName || member.fullName || member.name || member.invitedEmail?.split('@')[0]
    const member = serialized;
    const nameDisplay =
      member.userId?.name ||
      member.invitedName ||
      member.fullName ||
      member.name ||
      member.invitedEmail?.split('@')[0] ||
      'Pending Teammate';

    assert.equal(nameDisplay, 'Test User', 'Roster table must render "Test User"');
    assert.notEqual(nameDisplay, 'test.user', 'Roster table must NOT fall back to email prefix');
  } catch (err) {
    console.error('Test failed with error:', err);
    throw err;
  } finally {
    if (testOrg) {
      await Membership.deleteMany({ organisationId: testOrg._id });
      await Organisation.deleteOne({ _id: testOrg._id });
    }
    await mongoose.disconnect();
  }
});
