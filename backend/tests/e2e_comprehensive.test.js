import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

describe('BrandLens AI — Comprehensive End-to-End User Journey & Edge-Case Suite', () => {
  let server;
  let baseUrl;

  const ts = Date.now();
  const adminEmail = `e2e_admin_${ts}@e2e-test.local`;
  const creatorEmail = `e2e_creator_${ts}@e2e-test.local`;
  const managerEmail = `e2e_manager_${ts}@e2e-test.local`;
  const outsiderEmail = `e2e_outsider_${ts}@e2e-test.local`;

  let adminToken;
  let creatorToken;
  let managerToken;
  let outsiderToken;
  let orgId;
  let secondOrgId;
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
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =========================================================================
  // JOURNEY 1: Registration, Login, Empty/Invalid Inputs & Duplicate Check
  // =========================================================================
  test('Journey 1: User registration, validation, duplicate rejection, and login', async () => {
    // Empty registration submission -> 400
    const emptyReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: '', password: '' }),
    });
    assert.strictEqual(emptyReg.status, 400);

    // Invalid email -> 400
    const badEmailReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'not-an-email', password: 'Password123!' }),
    });
    assert.strictEqual(badEmailReg.status, 400);

    // Short password -> 400
    const shortPwdReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: adminEmail, password: 'short' }),
    });
    assert.strictEqual(shortPwdReg.status, 400);

    // Valid registration -> 201
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Primary Admin',
        email: adminEmail,
        password: 'StrongPassword123!',
        organisationName: `E2E Brand Corp ${ts}`,
      }),
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    assert.strictEqual(regData.success, true);
    assert.ok(regData.token);
    assert.ok(regData.organisation?._id);
    adminToken = regData.token;
    orgId = regData.organisation._id;

    // Duplicate registration -> 409
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Admin',
        email: adminEmail,
        password: 'StrongPassword123!',
      }),
    });
    assert.strictEqual(dupRes.status, 409);

    // Empty login -> 400
    const emptyLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    });
    assert.strictEqual(emptyLogin.status, 400);

    // Wrong password -> 401
    const wrongPwd = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'WrongPassword999!' }),
    });
    assert.strictEqual(wrongPwd.status, 401);

    // Valid login -> 200
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'StrongPassword123!' }),
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.ok(loginData.token);
    assert.strictEqual(loginData.user.email, adminEmail);
    assert.strictEqual(loginData.user.passwordHash, undefined);
  });

  // =========================================================================
  // JOURNEY 2: Authentication & Session Persistence Checks
  // =========================================================================
  test('Journey 2: Session restoration (/api/auth/me & /api/workspaces) and invalid token rejection', async () => {
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.user.email, adminEmail);
    assert.ok(meData.memberships.length >= 1);

    const wsRes = await fetch(`${baseUrl}/api/workspaces`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(wsRes.status, 200);
    const wsData = await wsRes.json();
    assert.ok(wsData.workspaces.some((w) => w._id === orgId));

    // Tampered token -> 401
    const badTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid.jwt.token' },
    });
    assert.strictEqual(badTokenRes.status, 401);
  });

  // =========================================================================
  // JOURNEY 4: Brand/Workspace Creation, Editing & Validation
  // =========================================================================
  test('Journey 4: Brand workspace creation, editing, and empty-name rejection', async () => {
    // Empty workspace name -> 400
    const emptyWs = await fetch(`${baseUrl}/api/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: '   ' }),
    });
    assert.strictEqual(emptyWs.status, 400);

    // Create second brand workspace -> 201
    const createWs = await fetch(`${baseUrl}/api/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: `Secondary Brand ${ts}` }),
    });
    assert.strictEqual(createWs.status, 201);
    const wsData = await createWs.json();
    secondOrgId = wsData.workspace._id;
    assert.strictEqual(wsData.workspace.role, 'ADMIN');

    // Edit brand workspace name -> 200
    const editWs = await fetch(`${baseUrl}/api/organisations/${secondOrgId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        'x-organisation-id': secondOrgId,
      },
      body: JSON.stringify({ name: `Secondary Brand Renamed ${ts}` }),
    });
    assert.strictEqual(editWs.status, 200);
    const editData = await editWs.json();
    assert.strictEqual(editData.organisation.name, `Secondary Brand Renamed ${ts}`);
  });

  // =========================================================================
  // JOURNEY 5: Brand Guidelines, Facts, Terminology & Assets Lifecycle
  // =========================================================================
  test('Journey 5: Brand guidelines, facts, terminology, assets CRUD + archive/deactivate + demo pack', async () => {
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      'x-organisation-id': orgId,
    };

    // 1. Guideline empty validation -> 400
    const emptyG = await fetch(`${baseUrl}/api/organisations/${orgId}/guidelines`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: '', ruleText: '' }),
    });
    assert.strictEqual(emptyG.status, 400);

    // Create, edit (version bumps v1 -> v2), and archive guideline
    const createG = await fetch(`${baseUrl}/api/organisations/${orgId}/guidelines`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Accessibility Standards',
        category: 'ACCESSIBILITY',
        ruleText: 'Maintain 4.5:1 WCAG AA contrast on all banners.',
        severity: 'HIGH',
      }),
    });
    assert.strictEqual(createG.status, 201);
    const gId = (await createG.json()).guideline._id;

    const editG = await fetch(`${baseUrl}/api/organisations/${orgId}/guidelines/${gId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ ruleText: 'Maintain at least 4.5:1 WCAG 2.1 AA contrast on all digital banners.' }),
    });
    assert.strictEqual(editG.status, 200);
    assert.strictEqual((await editG.json()).guideline.version, 2);

    const archiveG = await fetch(`${baseUrl}/api/organisations/${orgId}/guidelines/${gId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'ARCHIVED' }),
    });
    assert.strictEqual(archiveG.status, 200);

    // 2. Approved Fact create, edit, archive
    const createF = await fetch(`${baseUrl}/api/organisations/${orgId}/facts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        statement: 'E2E Brand operates in 14 global regions.',
        sourceReference: 'Annual Report 2026',
      }),
    });
    assert.strictEqual(createF.status, 201);
    const fId = (await createF.json()).fact._id;

    const editF = await fetch(`${baseUrl}/api/organisations/${orgId}/facts/${fId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ statement: 'E2E Brand operates in 16 global regions.' }),
    });
    assert.strictEqual(editF.status, 200);
    assert.strictEqual((await editF.json()).fact.version, 2);

    // 3. Terminology rule empty -> 400, valid -> 201, deactivate -> 200
    const emptyT = await fetch(`${baseUrl}/api/organisations/${orgId}/terminology`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ preferredTerm: 'Test', bannedTerms: [] }),
    });
    assert.strictEqual(emptyT.status, 400);

    const createT = await fetch(`${baseUrl}/api/organisations/${orgId}/terminology`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        preferredTerm: 'BrandLens AI',
        bannedTerms: ['Brand Lens', 'Brandlens'],
      }),
    });
    assert.strictEqual(createT.status, 201);
    const tId = (await createT.json()).rule._id;

    const deactivateT = await fetch(`${baseUrl}/api/organisations/${orgId}/terminology/${tId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ isActive: false }),
    });
    assert.strictEqual(deactivateT.status, 200);

    // 4. Asset create (empty -> 400, valid -> 201), edit -> 200, deactivate -> 200
    const emptyA = await fetch(`${baseUrl}/api/organisations/${orgId}/assets`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: '' }),
    });
    assert.strictEqual(emptyA.status, 400);

    const createA = await fetch(`${baseUrl}/api/organisations/${orgId}/assets`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Primary Palette',
        type: 'PALETTE',
        metadata: { hexColors: ['#0c8ee9', '#072849'] },
      }),
    });
    assert.strictEqual(createA.status, 201);
    const aId = (await createA.json()).asset._id;

    const deactivateA = await fetch(`${baseUrl}/api/organisations/${orgId}/assets/${aId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ isActive: false }),
    });
    assert.strictEqual(deactivateA.status, 200);

    // 5. Seed Demo Brand Pack (NovaTech) + verify idempotent duplicate call
    const seed1 = await fetch(`${baseUrl}/api/organisations/${orgId}/knowledge/seed-demo`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.strictEqual(seed1.status, 200);

    const seed2 = await fetch(`${baseUrl}/api/organisations/${orgId}/knowledge/seed-demo`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.strictEqual(seed2.status, 200);
    const seed2Data = await seed2.json();
    assert.strictEqual(seed2Data.seeded.guidelines, 0, 'Re-seeding must not create duplicate guidelines');
  });

  // =========================================================================
  // JOURNEY 10: User Roles, Invitations & RBAC Enforcement
  // =========================================================================
  test('Journey 10: Member invitations, duplicate invite (409), and role permissions enforcement', async () => {
    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      'x-organisation-id': orgId,
    };

    // Invite CREATOR
    const invCreator = await fetch(`${baseUrl}/api/organisations/${orgId}/members`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ email: creatorEmail, name: 'E2E Creator', role: 'CREATOR' }),
    });
    assert.strictEqual(invCreator.status, 201);

    // Duplicate invite -> 409
    const dupInv = await fetch(`${baseUrl}/api/organisations/${orgId}/members`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ email: creatorEmail, name: 'E2E Creator', role: 'CREATOR' }),
    });
    assert.strictEqual(dupInv.status, 409);

    // Invite MANAGER
    const invManager = await fetch(`${baseUrl}/api/organisations/${orgId}/members`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ email: managerEmail, name: 'E2E Manager', role: 'MANAGER' }),
    });
    assert.strictEqual(invManager.status, 201);

    // Log in Creator & Manager
    const cLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: creatorEmail, password: 'WelcomeBrandLens123!' }),
    });
    assert.strictEqual(cLogin.status, 200);
    creatorToken = (await cLogin.json()).token;

    const mLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: managerEmail, password: 'WelcomeBrandLens123!' }),
    });
    assert.strictEqual(mLogin.status, 200);
    managerToken = (await mLogin.json()).token;

    // Register outsider in separate org
    const outReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Outsider User',
        email: outsiderEmail,
        password: 'StrongPassword123!',
        organisationName: `Outsider Org ${ts}`,
      }),
    });
    outsiderToken = (await outReg.json()).token;

    // RBAC checks:
    // Creator cannot create guidelines -> 403
    const creatorGuideline = await fetch(`${baseUrl}/api/organisations/${orgId}/guidelines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${creatorToken}`, 'x-organisation-id': orgId },
      body: JSON.stringify({ title: 'Unauthorized Rule', ruleText: 'Should fail' }),
    });
    assert.strictEqual(creatorGuideline.status, 403);

    // Manager cannot assign ADMIN role -> 403
    const managerAssignAdmin = await fetch(`${baseUrl}/api/organisations/${orgId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}`, 'x-organisation-id': orgId },
      body: JSON.stringify({ email: `mgr_escalate_${ts}@e2e-test.local`, role: 'ADMIN' }),
    });
    assert.strictEqual(managerAssignAdmin.status, 403);

    // Outsider cannot read orgId contents -> 403
    const outsiderRead = await fetch(`${baseUrl}/api/organisations/${orgId}/contents`, {
      headers: { Authorization: `Bearer ${outsiderToken}`, 'x-organisation-id': orgId },
    });
    assert.strictEqual(outsiderRead.status, 403);
  });

  // =========================================================================
  // JOURNEYS 6 & 7: Content Analysis, Violation Detection, Findings, Locking & Publish
  // =========================================================================
  test('Journeys 6 & 7: Content submission, compliance violation detection, versioning, approval lock, and publish', async () => {
    const creatorHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${creatorToken}`,
      'x-organisation-id': orgId,
    };
    const managerHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${managerToken}`,
      'x-organisation-id': orgId,
    };

    // Empty submission -> 400
    const emptySub = await fetch(`${baseUrl}/api/organisations/${orgId}/contents`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({ title: '', text: '' }),
    });
    assert.strictEqual(emptySub.status, 400);

    // Submit draft with violations (banned term "Nova Cloud" + banned guarantee "100% risk-free")
    const subRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({
        title: 'E2E Product Launch Post',
        channel: 'Social Media',
        audience: 'Enterprise CTOs',
        text: 'Try Nova Cloud today! We guarantee 100% risk-free performance with automated scheduled backups.',
      }),
    });
    assert.strictEqual(subRes.status, 201);
    const subData = await subRes.json();
    contentId = subData.content._id;
    initialReview = subData.review;
    assert.ok(initialReview.findings.length >= 2, 'Expected multiple compliance violations to be detected');
    assert.ok(
      initialReview.findings.some((f) => f.type === 'TERMINOLOGY' && f.checkMethod === 'DETERMINISTIC'),
      'Expected deterministic TERMINOLOGY violation'
    );

    const finding0 = initialReview.findings[0];

    // Override without reason -> 400
    const badOverride = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/findings/${finding0._id}`, {
      method: 'PATCH',
      headers: managerHeaders,
      body: JSON.stringify({ reviewStatus: 'OVERRIDDEN', overrideReason: '' }),
    });
    assert.strictEqual(badOverride.status, 400);

    // Override with valid reason -> 200
    const goodOverride = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/findings/${finding0._id}`, {
      method: 'PATCH',
      headers: managerHeaders,
      body: JSON.stringify({
        reviewStatus: 'OVERRIDDEN',
        overrideReason: 'Approved legacy campaign phrasing per VP Brand.',
      }),
    });
    assert.strictEqual(goodOverride.status, 200);

    // Create immutable revision v2 -> 201
    const v2Res = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/versions`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({
        text: 'Try NovaTech Cloud today! Enterprise-grade reliability with 99.9% uptime SLA and automated scheduled backups.',
        changeSummary: 'Fixed terminology and removed absolute risk-free guarantee.',
      }),
    });
    assert.strictEqual(v2Res.status, 201);
    assert.strictEqual((await v2Res.json()).version.versionNumber, 2);

    // Publish BEFORE approval -> 400 blocked
    const earlyPublish = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/publish`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({ destination: 'Website CMS' }),
    });
    assert.strictEqual(earlyPublish.status, 400);

    // Request approval -> IN_REVIEW
    const reqApp = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/approval-request`, {
      method: 'POST',
      headers: creatorHeaders,
    });
    assert.strictEqual(reqApp.status, 200);

    // Creator self-approval blocked -> 403
    const selfApp = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/decision`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({ decision: 'APPROVED', reason: 'Self approving' }),
    });
    assert.strictEqual(selfApp.status, 403);

    // Independent Manager approves -> 200
    const mgrApp = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/decision`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({ decision: 'APPROVED', reason: 'Verified against 2026 SLA.' }),
    });
    assert.strictEqual(mgrApp.status, 200);

    // Revision after approval lock -> 403
    const lockedEdit = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/versions`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({ text: 'Trying to edit locked draft' }),
    });
    assert.strictEqual(lockedEdit.status, 403);

    // Publish approved content -> 200 with certificateId
    const pubRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/publish`, {
      method: 'POST',
      headers: managerHeaders,
      body: JSON.stringify({ destination: 'Website CMS' }),
    });
    assert.strictEqual(pubRes.status, 200);
    const pubData = await pubRes.json();
    assert.strictEqual(pubData.content.status, 'PUBLISHED');
    assert.ok(pubData.certificateId?.startsWith('BL-CERT-'));

    // Revision after PUBLISHED lock -> 403
    const pubLockedEdit = await fetch(`${baseUrl}/api/organisations/${orgId}/contents/${contentId}/versions`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({ text: 'Trying to edit published content' }),
    });
    assert.strictEqual(pubLockedEdit.status, 403);
  });

  // =========================================================================
  // JOURNEY 8: Reports, Analytics & Audit Logs
  // =========================================================================
  test('Journey 8: Live governance insights and append-only audit logs reflect real workflow events', async () => {
    const headers = { Authorization: `Bearer ${adminToken}`, 'x-organisation-id': orgId };

    const insightsRes = await fetch(`${baseUrl}/api/organisations/${orgId}/insights`, { headers });
    assert.strictEqual(insightsRes.status, 200);
    const { metrics } = await insightsRes.json();
    assert.ok(metrics.totalSubmissions >= 1);
    assert.ok(metrics.totalReviewsRun >= 2);
    assert.ok(metrics.overriddenCount >= 1);
    assert.ok(
      metrics.ambiguousGuidelines.some((g) => g.reasons.includes('Approved legacy campaign phrasing per VP Brand.')),
      'Expected recorded override reason in live governance insights'
    );

    const auditRes = await fetch(`${baseUrl}/api/organisations/${orgId}/audit-logs`, { headers });
    assert.strictEqual(auditRes.status, 200);
    const { logs } = await auditRes.json();
    const actions = logs.map((l) => l.action);
    assert.ok(actions.includes('APPROVAL_REQUESTED'));
    assert.ok(actions.includes('DECISION_APPROVED'));
    assert.ok(actions.includes('CONTENT_PUBLISHED'));
  });

  // =========================================================================
  // JOURNEY 9: Multi-Format File Uploads & Security Validation
  // =========================================================================
  test('Journey 9: File uploads validate TXT/PNG extraction and reject spoofed/dangerous files', async () => {
    const authHeaders = {
      Authorization: `Bearer ${creatorToken}`,
      'x-organisation-id': orgId,
    };

    // 1. Valid TXT upload -> 201 with extracted text reviewed
    const txtForm = new FormData();
    txtForm.append('title', 'TXT Upload Draft');
    txtForm.append('channel', 'Blog');
    txtForm.append(
      'files',
      new Blob(['Welcome to Nova Cloud! Experience 100% risk-free deployment.'], { type: 'text/plain' }),
      'press_release.txt'
    );
    const txtRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents`, {
      method: 'POST',
      headers: authHeaders,
      body: txtForm,
    });
    assert.strictEqual(txtRes.status, 201);
    const txtData = await txtRes.json();
    assert.ok(txtData.version.text.includes('Nova Cloud'));
    assert.ok(txtData.review.findings.length >= 1);

    // 2. Valid PNG upload without alt text -> 201 with ALT_TEXT_MISSING WCAG finding
    const pngBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
      0xb0, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    const pngForm = new FormData();
    pngForm.append('title', 'Hero Banner Check');
    pngForm.append('text', 'NovaTech Cloud launch visual banner.');
    pngForm.append('files', new Blob([pngBytes], { type: 'image/png' }), 'hero.png');
    const pngRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents`, {
      method: 'POST',
      headers: authHeaders,
      body: pngForm,
    });
    assert.strictEqual(pngRes.status, 201);
    const pngData = await pngRes.json();
    assert.ok(
      pngData.version.fileReferences?.[0]?.visualChecks?.findings?.some((f) => f.type === 'ALT_TEXT_MISSING'),
      'Expected deterministic WCAG ALT_TEXT_MISSING finding on image without alt text'
    );

    // 3. Spoofed fake PDF (HTML bytes inside .pdf) -> 400
    const badPdfForm = new FormData();
    badPdfForm.append('title', 'Spoofed PDF');
    badPdfForm.append('files', new Blob(['<html><script>alert(1)</script></html>'], { type: 'application/pdf' }), 'spoof.pdf');
    const badPdfRes = await fetch(`${baseUrl}/api/organisations/${orgId}/contents`, {
      method: 'POST',
      headers: authHeaders,
      body: badPdfForm,
    });
    assert.strictEqual(badPdfRes.status, 400);

    // 4. SVG upload to /assets/upload -> 400
    const svgForm = new FormData();
    svgForm.append('file', new Blob(['<svg onload="alert(1)"></svg>'], { type: 'image/svg+xml' }), 'evil.svg');
    const svgRes = await fetch(`${baseUrl}/api/organisations/${orgId}/assets/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'x-organisation-id': orgId },
      body: svgForm,
    });
    assert.strictEqual(svgRes.status, 400);
  });

  // =========================================================================
  // JOURNEY 11: Logout, Protected Routes, Missing Endpoints & Malformed JSON
  // =========================================================================
  test('Journey 11: Logout, unauthenticated protected routes (401), 404 handling, and malformed JSON (400)', async () => {
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });
    assert.strictEqual(logoutRes.status, 200);

    // Unauthenticated access to protected endpoints -> 401
    for (const ep of ['/api/auth/me', '/api/workspaces', `/api/organisations/${orgId}/contents`, `/api/organisations/${orgId}/insights`]) {
      const res = await fetch(`${baseUrl}${ep}`);
      assert.strictEqual(res.status, 401, `Expected 401 for unauthenticated GET ${ep}`);
    }

    // Missing/unavailable API route -> clean 404
    const notFound = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.strictEqual(notFound.status, 404);
    const nfData = await notFound.json();
    assert.strictEqual(nfData.success, false);

    // Malformed JSON -> clean 400
    const badJson = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    });
    assert.strictEqual(badJson.status, 400);
    const bjData = await badJson.json();
    assert.strictEqual(bjData.success, false);
  });
});
