import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/modules/auth/user.model.js';
import { Organisation } from '../src/modules/organisations/organisation.model.js';
import { Guideline } from '../src/modules/guidelines/guideline.model.js';
import { ApprovedFact } from '../src/modules/facts/fact.model.js';
import { TerminologyRule } from '../src/modules/terminology/terminology.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';

describe('BrandLens AI — Milestone 3: Brand Knowledge Base Tests', () => {
  let server;
  let baseUrl;
  let token;
  let orgId;

  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });

    // Create a fresh test user and organisation
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'KB Test Admin',
        email: `kb_admin_${Date.now()}@kb-test.local`,
        password: 'Password123!',
        organisationName: `KB Workspace ${Date.now()}`,
      }),
    });
    const regData = await regRes.json();
    token = regData.token;
    orgId = regData.organisation._id;
  });

  after(async () => {
    try {
      await User.deleteMany({ email: { $regex: /@kb-test\.local$/ } });
      await Organisation.deleteMany({ slug: { $regex: /^kb-workspace-/ } });
      await Guideline.deleteMany({ organisationId: orgId });
      await ApprovedFact.deleteMany({ organisationId: orgId });
      await TerminologyRule.deleteMany({ organisationId: orgId });
      await Asset.deleteMany({ organisationId: orgId });
    } catch {}

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  let createdGuidelineId;

  test('1. Admin creates a Tone Guideline successfully', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/guidelines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Confident & Transparent Voice',
        category: 'TONE',
        ruleText: 'Speak directly with clarity and confidence. Do not use hyperbolic promises.',
        severity: 'HIGH',
        sourceLocation: 'Brand Manual v1, p. 12',
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.guideline.title, 'Confident & Transparent Voice');
    assert.strictEqual(body.guideline.version, 1);
    createdGuidelineId = body.guideline._id;
  });

  test('2. Updating guideline ruleText increments version to 2', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/guidelines/${createdGuidelineId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ruleText: 'Speak directly with clarity and confidence. Do not use hyperbolic promises or unverified testimonials.',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.guideline.version, 2);
  });

  test('3. Admin creates an Approved Fact with source reference', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/facts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        statement: 'Our cloud platform maintains 99.9% uptime according to published SLA.',
        sourceReference: 'Service Level Agreement 2026, Section 2',
        applicability: { product: 'Cloud Platform', region: 'Global', channel: 'All' },
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.fact._id);
    assert.strictEqual(body.fact.version, 1);
  });

  test('4. Admin creates a Terminology rule with banned and preferred terms', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/terminology`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        preferredTerm: 'NovaTech Cloud',
        bannedTerms: ['Nova Cloud', 'Novatech Cloud Platform'],
        replacement: 'NovaTech Cloud',
        explanation: 'Always use the standard brand name.',
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.rule.preferredTerm, 'NovaTech Cloud');
    assert.strictEqual(body.rule.bannedTerms.length, 2);
  });

  test('5. Admin registers a Brand Asset (Color Palette)', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Brand Primary Palette',
        type: 'PALETTE',
        metadata: {
          hexColors: ['#0c8ee9', '#0259a1', '#072849'],
        },
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.asset.type, 'PALETTE');
    assert.strictEqual(body.asset.metadata.hexColors.length, 3);
  });

  test('6. Seeding the NovaTech Demo Brand Pack succeeds', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgId}/knowledge/seed-demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.seeded.guidelines >= 2);
    assert.ok(body.seeded.terminology >= 1);
    assert.ok(body.seeded.facts >= 2);
  });
});
