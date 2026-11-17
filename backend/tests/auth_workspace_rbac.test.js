import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/modules/auth/user.model.js';
import { Organisation } from '../src/modules/organisations/organisation.model.js';
import { Membership } from '../src/modules/members/membership.model.js';

describe('BrandLens AI — Firebase Auth, Multi-Tenant Workspaces & Server-Side RBAC Verification Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    try {
      await User.deleteMany({ email: { $regex: /@rbac-test\.local$/ } });
      await Organisation.deleteMany({ slug: { $regex: /^test-rbac-/ } });
    } catch (e) {
      // cleanup ignore
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  const timestamp = Date.now();
  const adminEmail = `alice_admin_${timestamp}@rbac-test.local`;
  const teammateEmail = `bob_teammate_${timestamp}@rbac-test.local`;
  const creatorEmail = `charlie_creator_${timestamp}@rbac-test.local`;

  const adminToken = `demo:${adminEmail}`;
  const teammateToken = `demo:${teammateEmail}`;
  const creatorToken = `demo:${creatorEmail}`;

  let createdWorkspaceId = null;
  let creatorMembershipId = null;

  // ───────────────────────────────────────────────────────────────────────────
  // TEST (a): New user sign-up + workspace creation
  // ───────────────────────────────────────────────────────────────────────────
  test('(a) New user sign-up + workspace creation', async () => {
    // 1. Initial workspace list for brand new user should be empty
    const listRes1 = await fetch(`${baseUrl}/api/workspaces`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(listRes1.status, 200, 'GET /api/workspaces must succeed');
    const listData1 = await listRes1.json();
    assert.strictEqual(listData1.success, true);
    assert.strictEqual(listData1.workspaces.length, 0, 'New user should have 0 workspaces initially');

    // 2. Create workspace via POST /api/workspaces
    const createRes = await fetch(`${baseUrl}/api/workspaces`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Test RBAC Workspace ${timestamp}`,
      }),
    });
    assert.strictEqual(createRes.status, 201, 'POST /api/workspaces must return 201 Created');
    const createData = await createRes.json();
    assert.strictEqual(createData.success, true);
    assert.ok(createData.workspace?._id, 'Created workspace must have an _id');
    assert.strictEqual(createData.workspace.role, 'ADMIN', 'Creator must have ADMIN role');

    createdWorkspaceId = createData.workspace._id;

    // 3. Verify user now has 1 active workspace with ADMIN role
    const listRes2 = await fetch(`${baseUrl}/api/workspaces`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData2 = await listRes2.json();
    assert.strictEqual(listData2.workspaces.length, 1, 'User should now have 1 active workspace');
    assert.strictEqual(listData2.workspaces[0]._id, createdWorkspaceId);
    assert.strictEqual(listData2.workspaces[0].role, 'ADMIN');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST (b): Admin inviting teammate email and teammate signing in to join
  // ───────────────────────────────────────────────────────────────────────────
  test('(b) Admin inviting a teammate email and teammate signing in to access the same workspace', async () => {
    assert.ok(createdWorkspaceId, 'Workspace must exist before inviting');

    // 1. Admin sends invitation for teammate (who has NOT registered yet)
    const inviteRes = await fetch(`${baseUrl}/api/workspaces/${createdWorkspaceId}/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-organisation-id': createdWorkspaceId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: teammateEmail,
        role: 'REVIEWER',
      }),
    });
    assert.strictEqual(inviteRes.status, 201, 'POST /invite must return 201');
    const inviteData = await inviteRes.json();
    assert.strictEqual(inviteData.success, true);
    assert.strictEqual(inviteData.status, 'INVITED', 'Pending teammate should have INVITED status');
    assert.strictEqual(inviteData.membership.invitedEmail, teammateEmail.toLowerCase());
    assert.strictEqual(inviteData.membership.role, 'REVIEWER');

    // 2. Teammate signs in with their token for the first time
    // verifyFirebaseToken auto-activates all pending INVITED memberships matching their email!
    const teammateListRes = await fetch(`${baseUrl}/api/workspaces`, {
      headers: {
        Authorization: `Bearer ${teammateToken}`,
      },
    });
    assert.strictEqual(teammateListRes.status, 200, 'Teammate GET /api/workspaces must succeed');
    const teammateListData = await teammateListRes.json();
    assert.strictEqual(teammateListData.workspaces.length, 1, 'Teammate must now be a member of 1 workspace');
    assert.strictEqual(teammateListData.workspaces[0]._id, createdWorkspaceId, 'Teammate joined the shared workspace');
    assert.strictEqual(teammateListData.workspaces[0].role, 'REVIEWER', 'Teammate has REVIEWER role');

    // Verify in database that status is now ACTIVE and userId is populated
    const dbMembership = await Membership.findOne({
      organisationId: createdWorkspaceId,
      invitedEmail: teammateEmail.toLowerCase(),
    });
    assert.strictEqual(dbMembership.status, 'ACTIVE', 'Membership in DB must be ACTIVE after sign-in');
    assert.ok(dbMembership.userId, 'Membership userId must be linked to teammate user');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST (c): Creator getting 403 on Approve/Brand Knowledge mutations
  // ───────────────────────────────────────────────────────────────────────────
  test('(c) Creator getting 403 on Approve/Brand Knowledge mutations', async () => {
    assert.ok(createdWorkspaceId, 'Workspace must exist');

    // 1. Admin invites Creator
    const inviteCreatorRes = await fetch(`${baseUrl}/api/workspaces/${createdWorkspaceId}/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-organisation-id': createdWorkspaceId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: creatorEmail,
        role: 'CREATOR',
      }),
    });
    assert.strictEqual(inviteCreatorRes.status, 201);
    const creatorInviteData = await inviteCreatorRes.json();
    creatorMembershipId = creatorInviteData.membership._id;

    // 2. Creator signs in (activates membership)
    const creatorWorkspacesRes = await fetch(`${baseUrl}/api/workspaces`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    const creatorWorkspacesData = await creatorWorkspacesRes.json();
    assert.strictEqual(creatorWorkspacesData.workspaces.length, 1);
    assert.strictEqual(creatorWorkspacesData.workspaces[0].role, 'CREATOR');

    // 3. Creator attempts to invite someone -> 403 Forbidden
    const creatorInviteAttempt = await fetch(`${baseUrl}/api/workspaces/${createdWorkspaceId}/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creatorToken}`,
        'x-organisation-id': createdWorkspaceId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'hacker@test.local', role: 'ADMIN' }),
    });
    assert.strictEqual(
      creatorInviteAttempt.status,
      403,
      'Creator must receive 403 Forbidden when trying to invite members'
    );

    // 4. Creator attempts to create a Guideline rule -> 403 Forbidden
    const creatorGuidelineAttempt = await fetch(`${baseUrl}/api/organisations/${createdWorkspaceId}/guidelines`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creatorToken}`,
        'x-organisation-id': createdWorkspaceId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Unauthorized Rule',
        category: 'TONE',
        ruleText: 'Creators should not be able to create rules.',
      }),
    });
    assert.strictEqual(
      creatorGuidelineAttempt.status,
      403,
      'Creator must receive 403 Forbidden on Guideline rule creation'
    );

    // 5. Creator attempts to create an Approved Fact -> 403 Forbidden
    const creatorFactAttempt = await fetch(`${baseUrl}/api/organisations/${createdWorkspaceId}/facts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creatorToken}`,
        'x-organisation-id': createdWorkspaceId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statement: 'Unauthorized brand fact',
      }),
    });
    assert.strictEqual(
      creatorFactAttempt.status,
      403,
      'Creator must receive 403 Forbidden on Approved Fact creation'
    );

    // 6. Creator attempts to create Terminology Rule -> 403 Forbidden
    const creatorTermAttempt = await fetch(`${baseUrl}/api/organisations/${createdWorkspaceId}/terminology`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creatorToken}`,
        'x-organisation-id': createdWorkspaceId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preferredTerm: 'Good',
        bannedTerms: ['Bad'],
      }),
    });
    assert.strictEqual(
      creatorTermAttempt.status,
      403,
      'Creator must receive 403 Forbidden on Terminology rule creation'
    );

    // 7. Creator attempts to approve content (Decision) -> 403 Forbidden
    const dummyContentId = new mongoose.Types.ObjectId();
    const creatorDecisionAttempt = await fetch(
      `${baseUrl}/api/organisations/${createdWorkspaceId}/contents/${dummyContentId}/decision`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creatorToken}`,
          'x-organisation-id': createdWorkspaceId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'APPROVED',
          reason: 'I want to approve this myself',
        }),
      }
    );
    assert.strictEqual(
      creatorDecisionAttempt.status,
      403,
      'Creator must receive 403 Forbidden on Content Approval Decision'
    );

    // 8. Creator attempts to update member roles -> 403 Forbidden
    const creatorRoleUpdateAttempt = await fetch(
      `${baseUrl}/api/workspaces/${createdWorkspaceId}/members/${creatorMembershipId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${creatorToken}`,
          'x-organisation-id': createdWorkspaceId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'ADMIN' }),
      }
    );
    assert.strictEqual(
      creatorRoleUpdateAttempt.status,
      403,
      'Creator must receive 403 Forbidden on Member Role updates'
    );

    // 9. Creator CAN read guidelines (read access permitted) -> 200 OK
    const creatorReadGuidelines = await fetch(`${baseUrl}/api/organisations/${createdWorkspaceId}/guidelines`, {
      headers: {
        Authorization: `Bearer ${creatorToken}`,
        'x-organisation-id': createdWorkspaceId,
      },
    });
    assert.strictEqual(creatorReadGuidelines.status, 200, 'Creator must be allowed to read guidelines');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST (d): 1-Click Demo Login endpoint for judges
  // ───────────────────────────────────────────────────────────────────────────
  test('(d) 1-Click Demo Login for NovaTech Global judges', async () => {
    const roles = ['ADMIN', 'MANAGER', 'REVIEWER', 'CREATOR'];
    for (const role of roles) {
      const demoRes = await fetch(`${baseUrl}/api/workspaces/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      assert.strictEqual(demoRes.status, 200, `Demo login for ${role} must return 200`);
      const demoData = await demoRes.json();
      assert.strictEqual(demoData.success, true);
      assert.strictEqual(demoData.user.role, role);
      assert.strictEqual(demoData.workspace.slug, 'novatech-global');
      assert.ok(demoData.token, 'Must return a valid auth token');
    }
  });
});
