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

describe('BrandLens AI — Improvement 2: Accept/Edit/Reject Findings & Version Locking Tests', () => {
  let server;
  let baseUrl;
  let adminToken;
  let creatorToken;
  let orgId;
  let contentId;
  let initialReview;

  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });

    // Register Admin & workspace
    const adminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Improvement 2 Admin',
        email: `imp2_admin_${Date.now()}@imp2-test.local`,
        password: 'Password123!',
        organisationName: `Version Workflow Org ${Date.now()}`,
      }),
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;
    orgId = adminData.organisation._id;

    // Seed NovaTech guidelines & facts
    await fetch(`${baseUrl}/api/organisations/${orgId}/knowledge/seed-demo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Create Creator user
    const creatorEmail = `imp2_creator_${Date.now()}@imp2-test.local`;
    await fetch(`${baseUrl}/api/organisations/${orgId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: creatorEmail,
        name: 'Improvement 2 Creator',
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

    // Initial content submission
    const draftText = 'Sign up for Nova Cloud today! We guarantee 100% risk-free performance with automated scheduled backups across regions.';
    const subRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        title: 'Cloud Launch Campaign v1',
        channel: 'Social Media',
        audience: 'Enterprise Decision Makers',
        text: draftText,
      }),
    });
    const subData = await subRes.json();
    contentId = subData.content._id;
    initialReview = subData.review;
  });

  after(async () => {
    try {
      await User.deleteMany({ email: { $regex: /@imp2-test\.local$/ } });
      await Organisation.deleteMany({ _id: orgId });
      await Content.deleteMany({ organisationId: orgId });
      await ContentVersion.deleteMany({ organisationId: orgId });
      await Review.deleteMany({ organisationId: orgId });
    } catch {}

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  test('1. Accept Finding: records ACCEPTED status in backend review record', async () => {
    const finding = initialReview.findings.find((f) => f.type === 'TERMINOLOGY');
    assert.ok(finding, 'Expected a TERMINOLOGY finding');

    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/findings/${finding._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        reviewStatus: 'ACCEPTED',
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.finding.reviewStatus, 'ACCEPTED');
  });

  test('2. Edit Finding: records EDITED status with customized replacement text', async () => {
    const finding = initialReview.findings.find((f) => f.type === 'TONE_MISMATCH') || initialReview.findings[0];
    const customFix = 'We deliver enterprise reliability with automated scheduled backups';

    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/findings/${finding._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        reviewStatus: 'EDITED',
        editedText: customFix,
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.finding.reviewStatus, 'EDITED');
    assert.strictEqual(data.finding.editedText, customFix);
  });

  test('3. Reject Finding: enforces mandatory rejection reason', async () => {
    const finding = initialReview.findings[initialReview.findings.length - 1];

    // Rejection without reason must fail (400)
    const failRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/findings/${finding._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        reviewStatus: 'REJECTED',
      }),
    });
    assert.strictEqual(failRes.status, 400);

    // Rejection with reason succeeds
    const successRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/findings/${finding._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        reviewStatus: 'REJECTED',
        rejectionReason: 'Phrase is specifically required by marketing campaign guidelines.',
      }),
    });
    assert.strictEqual(successRes.status, 200);
    const data = await successRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.finding.reviewStatus, 'REJECTED');
    assert.strictEqual(data.finding.rejectionReason, 'Phrase is specifically required by marketing campaign guidelines.');
  });

  test('4. Immutable Versioning: creating v2 and v3 preserves all previous version records', async () => {
    // Submit revision v2
    const v2Text = 'Sign up for NovaTech Cloud today! We deliver high availability with automated scheduled backups across regions.';
    const v2Res = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        text: v2Text,
        changeSummary: 'Applied NovaTech Cloud branding and softened guarantee claim.',
      }),
    });
    assert.strictEqual(v2Res.status, 201);
    const v2Data = await v2Res.json();
    assert.strictEqual(v2Data.version.versionNumber, 2);

    // Submit revision v3
    const v3Text = 'Sign up for NovaTech Cloud today! We deliver high availability with verified 99.9% uptime and automated scheduled backups across regions.';
    const v3Res = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        text: v3Text,
        changeSummary: 'Added verified 99.9% uptime SLA citation.',
      }),
    });
    assert.strictEqual(v3Res.status, 201);
    const v3Data = await v3Res.json();
    assert.strictEqual(v3Data.version.versionNumber, 3);

    // Verify all 3 versions are stored and intact in MongoDB
    const allVersions = await ContentVersion.find({ contentId }).sort({ versionNumber: 1 });
    assert.strictEqual(allVersions.length, 3);
    assert.strictEqual(allVersions[0].versionNumber, 1);
    assert.strictEqual(allVersions[1].versionNumber, 2);
    assert.strictEqual(allVersions[2].versionNumber, 3);
    assert.ok(allVersions[0].text.includes('Nova Cloud'));
    assert.ok(allVersions[1].text.includes('NovaTech Cloud'));
    assert.ok(allVersions[2].text.includes('99.9% uptime'));
  });

  test('5. Version Locking: Content approval locks content and blocks revisions (403)', async () => {
    // Approve content
    const approveRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        reason: 'Passed all compliance gates on version 3.',
      }),
    });
    assert.strictEqual(approveRes.status, 200);

    const content = await Content.findById(contentId);
    assert.strictEqual(content.status, 'APPROVED');

    // Attempting to submit a new version on approved content must be rejected with 403
    const editRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        text: 'Tampering attempt with locked version',
        changeSummary: 'Unauthorized edit',
      }),
    });
    assert.strictEqual(editRes.status, 403);
    const editData = await editRes.json();
    assert.ok(editData.error?.message?.includes('locked'));
  });
});
