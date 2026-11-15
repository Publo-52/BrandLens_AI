import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/modules/auth/user.model.js';
import { Organisation } from '../src/modules/organisations/organisation.model.js';
import { Membership, ROLES } from '../src/modules/members/membership.model.js';

describe('BrandLens AI — Milestone 2: Auth, Multi-Tenancy & RBAC Tests', () => {
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
    // Clean up test records created during this test run safely without purging entire collections
    try {
      await User.deleteMany({ email: { $regex: /@test-brandlens\.local$/ } });
      await Organisation.deleteMany({ slug: { $regex: /^test-/ } });
    } catch {}
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  const testUserA = {
    name: 'Alice Admin',
    email: `alice_${Date.now()}@test-brandlens.local`,
    password: 'Password123!',
    organisationName: `Test Org Alpha ${Date.now()}`,
  };

  const testUserB = {
    name: 'Bob External',
    email: `bob_${Date.now()}@test-brandlens.local`,
    password: 'Password123!',
    organisationName: `Test Org Beta ${Date.now()}`,
  };

  let tokenA;
  let orgAId;
  let tokenB;
  let orgBId;

  test('1. User A registers successfully and receives ADMIN role in workspace A', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserA),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.token);
    assert.strictEqual(body.user.email, testUserA.email.toLowerCase());
    assert.strictEqual(body.membership.role, ROLES.ADMIN);
    assert.ok(body.organisation._id);

    tokenA = body.token;
    orgAId = body.organisation._id;
  });

  test('2. Registration rejects duplicate email with 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserA),
    });

    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.message.includes('already exists'));
  });

  test('3. User A logs in successfully with valid password and receives JWT', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserA.email,
        password: testUserA.password,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.token);
    assert.ok(body.memberships.length > 0);
  });

  test('4. Login rejects invalid password with 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserA.email,
        password: 'WrongPassword!',
      }),
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  test('5. Authenticated GET /api/auth/me returns user profile and workspace memberships', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.email, testUserA.email.toLowerCase());
  });

  test('6. User B registers in Workspace B', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserB),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    tokenB = body.token;
    orgBId = body.organisation._id;
  });

  test('7. Multi-Tenant Isolation: User B CANNOT access Workspace A (returns 403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error.message.includes('Access denied'));
  });

  test('8. Admin A invites a collaborator to Workspace A as CREATOR', async () => {
    const collaboratorEmail = `collab_${Date.now()}@test-brandlens.local`;
    const res = await fetch(`${baseUrl}/api/organisations/${orgAId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        email: collaboratorEmail,
        name: 'Charlie Creator',
        role: ROLES.CREATOR,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.membership.role, ROLES.CREATOR);

    // Login as the newly created creator
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: collaboratorEmail,
        password: 'WelcomeBrandLens123!',
      }),
    });
    assert.strictEqual(loginRes.status, 200);
    const loginBody = await loginRes.json();
    const creatorToken = loginBody.token;

    // RBAC check: CREATOR cannot update organisation settings (requires ADMIN)
    const patchRes = await fetch(`${baseUrl}/api/organisations/${orgAId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({ name: 'Hacked Name' }),
    });
    assert.strictEqual(patchRes.status, 403);
  });

  test('9. Admin A can update Workspace A settings successfully', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgAId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ name: 'Renamed Alpha Workspace' }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.organisation.name, 'Renamed Alpha Workspace');
  });
});
