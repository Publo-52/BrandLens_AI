import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/modules/auth/user.model.js';
import { Organisation } from '../src/modules/organisations/organisation.model.js';
import { Content } from '../src/modules/contents/content.model.js';
import { ContentVersion } from '../src/modules/contents/contentVersion.model.js';
import { Review } from '../src/modules/reviews/review.model.js';

describe('BrandLens AI — Milestones 4, 5, 6: End-to-End Review, Workflow & Audit Tests', () => {
  let server;
  let baseUrl;
  let adminToken;
  let creatorToken;
  let orgId;

  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });

    // 1. Register Admin
    const adminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Workflow Admin',
        email: `wf_admin_${Date.now()}@wf-test.local`,
        password: 'Password123!',
        organisationName: `Workflow Org ${Date.now()}`,
      }),
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;
    orgId = adminData.organisation._id;

    // 2. Seed NovaTech brand guidelines & facts
    await fetch(`${baseUrl}/api/organisations/${orgId}/knowledge/seed-demo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // 3. Invite Creator
    const creatorEmail = `wf_creator_${Date.now()}@wf-test.local`;
    await fetch(`${baseUrl}/api/organisations/${orgId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: creatorEmail,
        name: 'Workflow Creator',
        role: 'CREATOR',
      }),
    });

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: creatorEmail,
        password: 'WelcomeBrandLens123!',
      }),
    });
    const loginData = await loginRes.json();
    creatorToken = loginData.token;
  });

  after(async () => {
    try {
      await User.deleteMany({ email: { $regex: /@wf-test\.local$/ } });
      await Organisation.deleteMany({ slug: { $regex: /^workflow-org-/ } });
      await Content.deleteMany({ organisationId: orgId });
      await ContentVersion.deleteMany({ organisationId: orgId });
      await Review.deleteMany({ organisationId: orgId });
    } catch {}

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  let contentId;
  let initialReview;

  test('1. Creator submits draft containing intentional brand violations', async () => {
    const draftText = 'Experience Nova Cloud today! We provide a 100% risk-free guarantee and automated scheduled backups across regions.';

    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/contents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        title: 'Launch Social Campaign',
        channel: 'Social Media',
        audience: 'Enterprise Decision Makers',
        text: draftText,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.content._id);
    assert.strictEqual(body.content.status, 'AUTO_CHECKED');
    assert.ok(body.review.findings.length >= 2);

    contentId = body.content._id;
    initialReview = body.review;
  });

  test('2. Review Engine catches terminology, tone, and supported claims with exact citations', () => {
    const findings = initialReview.findings;

    // Check for deterministic terminology finding
    const termFinding = findings.find((f) => f.type === 'TERMINOLOGY' && f.originalText === 'Nova Cloud');
    assert.ok(termFinding, 'Expected terminology finding for Nova Cloud');
    assert.strictEqual(termFinding.confidence, 1.0);
    assert.strictEqual(termFinding.checkMethod, 'DETERMINISTIC');
    assert.strictEqual(termFinding.suggestedCorrection, 'NovaTech Cloud');

    // Check for supported claim finding citing approved fact
    const supportedClaim = findings.find((f) => f.type === 'CLAIM_SUPPORTED');
    assert.ok(supportedClaim, 'Expected supported claim finding');
    assert.strictEqual(supportedClaim.sourceReferences[0].sourceType, 'APPROVED_FACT');
    assert.ok(supportedClaim.sourceReferences[0].quote.includes('scheduled backups'));
  });

  test('3. Reviewer records a justified override on a finding with mandatory reason', async () => {
    const findingToOverride = initialReview.findings[0];

    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/findings/${findingToOverride._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        reviewStatus: 'OVERRIDDEN',
        overrideReason: 'Pre-approved campaign copy authorized by VP of Marketing.',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.finding.reviewStatus, 'OVERRIDDEN');
    assert.strictEqual(body.finding.overrideReason, 'Pre-approved campaign copy authorized by VP of Marketing.');
  });

  test('4. Collaborator posts a review comment on the submission', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        body: 'Please double-check the SLA guarantee before final approval.',
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.comment.body, 'Please double-check the SLA guarantee before final approval.');
  });

  test('5. Creator creates a revised version (v2) addressing feedback', async () => {
    const revisedText = 'Experience NovaTech Cloud today! We deliver enterprise-grade reliability with 99.9% uptime SLA and automated scheduled backups across regions.';

    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        text: revisedText,
        changeSummary: 'Applied brand approved terminology and replaced absolute guarantee with verified SLA.',
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.version.versionNumber, 2);

    // Verify version 2 review has 0 terminology violations!
    const v2TermFindings = body.review.findings.filter((f) => f.type === 'TERMINOLOGY');
    assert.strictEqual(v2TermFindings.length, 0);
  });

  test('6. Creator routes content to review queue for formal sign-off (IN_REVIEW)', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/approval-request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creatorToken}` },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.content.status, 'IN_REVIEW');
  });

  test('7. Authorized Manager grants formal APPROVED sign-off and locks content', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        reason: 'All brand rules satisfied and claims verified against approved fact sheet.',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.content.status, 'APPROVED');

    // Verify locking: Attempting to submit a new version on approved content must fail (403)
    const lockCheckRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({ text: 'Trying to tamper with approved content' }),
    });
    assert.strictEqual(lockCheckRes.status, 403);
  });

  test('8. Governance Insights computes metrics from real review events', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/insights`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.metrics.totalSubmissions >= 1);
    assert.ok(body.metrics.totalReviewsRun >= 2);
    assert.strictEqual(body.metrics.overriddenCount, 1);
  });

  test('9. Audit Log contains immutable history of all governance actions', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.logs.length >= 2);
    assert.ok(body.logs.some((l) => l.action.includes('APPROVED')));
  });
});
