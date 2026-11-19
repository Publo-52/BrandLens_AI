import test from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { Membership, migrateMembershipIndexes } from '../src/modules/members/membership.model.js';

if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {}
}

test('Membership collection indexes and multiple unregistered invites', async () => {
  await mongoose.connect(config.mongoUri);
  await migrateMembershipIndexes();

  const indexes = await Membership.collection.indexes();
  const orgUserIndex = indexes.find(
    (idx) => idx.key?.organisationId === 1 && idx.key?.userId === 1
  );

  assert.ok(orgUserIndex, 'Index on { organisationId: 1, userId: 1 } must exist');
  assert.equal(
    orgUserIndex.partialFilterExpression?.userId?.$type,
    'objectId',
    'Index must have partialFilterExpression { userId: { $type: "objectId" } }'
  );

  const testOrgId = new mongoose.Types.ObjectId();
  const email1 = `test_invite_a_${Date.now()}@example.com`;
  const email2 = `test_invite_b_${Date.now()}@example.com`;

  const inv1 = await Membership.create({
    organisationId: testOrgId,
    invitedEmail: email1,
    invitedName: 'Test Collaborator 1',
    userId: null,
    role: 'CREATOR',
    status: 'INVITED',
  });
  assert.equal(inv1.invitedName, 'Test Collaborator 1');

  // Second invited user with userId: null in the same workspace
  const inv2 = await Membership.create({
    organisationId: testOrgId,
    invitedEmail: email2,
    invitedName: 'Test Collaborator 2',
    userId: null,
    role: 'REVIEWER',
    status: 'INVITED',
  });
  assert.equal(inv2.invitedName, 'Test Collaborator 2');

  // Clean up test documents
  await Membership.deleteMany({ organisationId: testOrgId });
  await mongoose.disconnect();
});
