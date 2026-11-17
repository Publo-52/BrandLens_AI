import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

describe('BrandLens AI — Improvement 3: Multi-Role RBAC, Separation of Duties & Live Governance Insights', () => {
  let server;
  let baseUrl;
  let adminToken;
  let creatorToken;
  let managerToken;
  let reviewerToken;
  let orgId;
  let creatorContentId;
  let creatorReview;
  let adminContentId;

  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });

    // Register fresh workspace admin
    const adminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Imp3 Workspace Owner',
        email: `imp3_owner_${Date.now()}@imp3-test.local`,
        password: 'Password123!',
        organisationName: `Governance Org ${Date.now()}`,
      }),
    });
    const adminData = await adminRes.json();
    assert.strictEqual(adminRes.status, 201);
    adminToken = adminData.token;
    orgId = adminData.organisation._id;

    // Seed NovaTech rules & facts so findings are reliably triggered
    await fetch(`${baseUrl}/api/organisations/${orgId}/knowledge/seed-demo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  test('1. Quick Demo Role Switcher provisions distinct real server-side RBAC personas', async () => {
    const roles = ['CREATOR', 'REVIEWER', 'MANAGER', 'ADMIN'];
    const tokens = {};
    const userIds = new Set();

    for (const role of roles) {
      const res = await fetch(`${baseUrl}/api/auth/demo-switch-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role, organisationId: orgId }),
      });

      assert.strictEqual(res.status, 200, `Expected 200 for switching to ${role}`);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.token, `Expected JWT token for ${role}`);
      assert.strictEqual(data.activeRole, role);

      tokens[role] = data.token;
      userIds.add(String(data.user._id));
    }

    assert.strictEqual(userIds.size, 4, 'Each role persona must have a distinct user identity');
    creatorToken = tokens.CREATOR;
    reviewerToken = tokens.REVIEWER;
    managerToken = tokens.MANAGER;
  });

  test('2. Creator submits content and cannot approve their own draft (RBAC blocks CREATOR)', async () => {
    const subRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        title: 'Q4 Launch Release Notes',
        channel: 'Blog',
        audience: 'Enterprise Customers',
        text: 'Try Nova Cloud today! We guarantee 100% risk-free performance with zero downtime.',
      }),
    });
    assert.strictEqual(subRes.status, 201);
    const subData = await subRes.json();
    creatorContentId = subData.content._id;
    creatorReview = subData.review;
    assert.ok(creatorReview?.findings?.length > 0, 'Expected compliance findings');

    // Creator attempts to approve their own draft -> blocked by RBAC (403)
    const approveRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${creatorContentId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({ decision: 'APPROVED', reason: 'Self-approving as creator' }),
    });
    assert.strictEqual(approveRes.status, 403);
  });

  test('3. Separation of Duties: Even an Admin/Manager cannot approve a draft they authored themselves', async () => {
    // Admin authors a draft
    const subRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Admin Authored Announcement',
        channel: 'Press Release',
        audience: 'Public',
        text: 'NovaTech Cloud delivers enterprise reliability and transparent compliance.',
      }),
    });
    assert.strictEqual(subRes.status, 201);
    const subData = await subRes.json();
    adminContentId = subData.content._id;

    // Same Admin tries to approve their own submission -> 403 Separation of Duties violation
    const selfApproveRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${adminContentId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ decision: 'APPROVED', reason: 'Trying to self-approve' }),
    });
    assert.strictEqual(selfApproveRes.status, 403);
    const selfApproveData = await selfApproveRes.json();
    assert.match(selfApproveData.error?.message || '', /Separation of duties/i);
  });

  test('4. Independent Manager can approve Creator submission and records approver metadata for Certificate', async () => {
    const approveRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${creatorContentId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        reason: 'Independent manager sign-off verified against SLA docs.',
      }),
    });
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.content.status, 'APPROVED');
    assert.ok(approveData.content.approvedBy, 'Expected approvedBy to be recorded');
    assert.ok(approveData.content.approvedAt, 'Expected approvedAt timestamp');

    // Fetch content detail and verify populated approvedBy + latestReview for certificate export
    const detailRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${creatorContentId}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.strictEqual(detailRes.status, 200);
    const detailData = await detailRes.json();
    assert.strictEqual(detailData.content.approvedBy?.name, 'Marcus Vance (Manager)');
    assert.strictEqual(detailData.content.approvalNotes, 'Independent manager sign-off verified against SLA docs.');
    assert.ok(detailData.latestReview, 'Expected latestReview for certificate findings disclosure');
  });

  test('5. Live Governance Insights flags overridden findings as ambiguous guidelines for Admin rewrite', async () => {
    const targetFinding = creatorReview.findings[0];
    assert.ok(targetFinding, 'Expected at least one finding to override');

    // Reviewer overrides the finding with an explicit justification
    const overrideRes = await fetch(
      `${baseUrl}/api/organisations/${orgId}/contents/${creatorContentId}/findings/${targetFinding._id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${reviewerToken}`,
        },
        body: JSON.stringify({
          reviewStatus: 'OVERRIDDEN',
          overrideReason: 'Approved by legal for Q4 legacy migration context.',
        }),
      }
    );
    assert.strictEqual(overrideRes.status, 200);

    // Query live governance insights endpoint
    const insightsRes = await fetch(`${baseUrl}/api/organisations/${orgId}/insights`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(insightsRes.status, 200);
    const insightsData = await insightsRes.json();
    assert.strictEqual(insightsData.success, true);

    const { metrics } = insightsData;
    assert.ok(metrics.overriddenCount >= 1, 'Expected at least 1 overridden finding in live metrics');
    assert.ok(Array.isArray(metrics.ambiguousGuidelines), 'Expected ambiguousGuidelines array');
    assert.ok(metrics.ambiguousGuidelines.length >= 1, 'Expected flagged ambiguous guideline');

    const flagged = metrics.ambiguousGuidelines.find((g) =>
      g.reasons.includes('Approved by legal for Q4 legacy migration context.')
    );
    assert.ok(flagged, 'Expected live override reason to appear in ambiguousGuidelines');
    assert.ok(flagged.recommendation && flagged.recommendation.length > 10, 'Expected concrete admin rewrite recommendation');
  });
});
