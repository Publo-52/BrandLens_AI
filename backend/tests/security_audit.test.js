import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/modules/auth/user.model.js';
import { sanitizeValue } from '../src/middleware/security.js';
import { validateUploadedFile } from '../src/utils/fileValidation.js';

describe('BrandLens AI — Comprehensive Security Audit Verification Suite', () => {
  let server;
  let baseUrl;
  let orgAToken;
  let orgAId;
  let orgBToken;
  let orgBId;
  let orgAEmail;

  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });

    const ts = Date.now();
    orgAEmail = `sec_org_a_${ts}@sec-audit.local`;
    const orgBEmail = `sec_org_b_${ts}@sec-audit.local`;

    // Register Org A Admin
    const resA = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Security Admin A',
        email: orgAEmail,
        password: 'StrongPassword123!',
        organisationName: `Security Org A ${ts}`,
      }),
    });
    assert.strictEqual(resA.status, 201);
    const dataA = await resA.json();
    orgAToken = dataA.token;
    orgAId = dataA.organisation._id;

    // Register Org B Admin
    const resB = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Security Admin B',
        email: orgBEmail,
        password: 'StrongPassword123!',
        organisationName: `Security Org B ${ts}`,
      }),
    });
    assert.strictEqual(resB.status, 201);
    const dataB = await resB.json();
    orgBToken = dataB.token;
    orgBId = dataB.organisation._id;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  test('1. Auth Hardening: Unauthenticated POST /api/auth/google cannot take over accounts', async () => {
    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: orgAEmail, name: 'Spoofed Admin' }),
    });
    assert.strictEqual(res.status, 401, 'POST /api/auth/google must reject requests without a verified Bearer token');
  });

  test('2. Auth Hardening: demo: bearer tokens cannot impersonate real user domains', async () => {
    const res = await fetch(`${baseUrl}/api/workspaces`, {
      headers: { Authorization: `Bearer demo:${orgAEmail}` },
    });
    assert.strictEqual(res.status, 401, 'demo: token must reject non-demo email domains');
  });

  test('3. Password Handling: passwordHash is excluded from queries & oversized passwords rejected', async () => {
    const userDoc = await User.findOne({ email: orgAEmail }).lean();
    assert.ok(userDoc, 'Expected user document');
    assert.strictEqual(userDoc.passwordHash, undefined, 'passwordHash must be hidden even in .lean() queries');

    const longPwdRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Long Password Test',
        email: `longpwd_${Date.now()}@sec-audit.local`,
        password: 'A'.repeat(200),
      }),
    });
    assert.strictEqual(longPwdRes.status, 400, 'Passwords > 128 chars must be rejected to prevent bcrypt truncation/DoS');
  });

  test('4. RBAC Cross-Tenant IDOR: mismatched x-organisation-id header vs route param is blocked (403)', async () => {
    // Admin A tries to access Org B route while supplying Org A's ID in x-organisation-id header
    const res = await fetch(`${baseUrl}/api/organisations/${orgBId}/guidelines`, {
      headers: {
        Authorization: `Bearer ${orgAToken}`,
        'x-organisation-id': orgAId,
      },
    });
    assert.strictEqual(res.status, 403, 'Header/route workspace mismatch must be rejected with 403');
  });

  test('5. RBAC Cross-Tenant Escalation: demo-switch-role cannot escalate into another workspace', async () => {
    const res = await fetch(`${baseUrl}/api/auth/demo-switch-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgAToken}`,
      },
      body: JSON.stringify({ role: 'ADMIN', organisationId: orgBId }),
    });
    assert.strictEqual(res.status, 403, 'User from Org A must not be allowed to demo-switch into Org B');
  });

  test('6. NoSQL Injection & Prototype Pollution Defense: strips $ operators and dangerous keys', async () => {
    const cleaned = sanitizeValue({
      email: { $ne: '' },
      nested: { 'a.b': 1, safe: 'ok' },
      __proto__: { polluted: true },
    });
    assert.deepStrictEqual(cleaned.email, {});
    assert.strictEqual(cleaned.nested.safe, 'ok');
    assert.strictEqual(cleaned.nested['a.b'], undefined);

    const loginInjection = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: { $ne: '' }, password: { $ne: '' } }),
    });
    assert.strictEqual(loginInjection.status, 400, 'Operator-injected login body must cleanly return 400');
  });

  test('7. Input Validation & Safe Error Handling: malformed ObjectId returns 400 without CastError trace', async () => {
    const res = await fetch(`${baseUrl}/api/organisations/${orgAId}/contents/not-a-valid-objectid`, {
      headers: { Authorization: `Bearer ${orgAToken}` },
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(!JSON.stringify(body).includes('CastError'), 'Must not leak internal Mongoose CastError');
  });

  test('8. File Upload Security: blocks SVG XSS, spoofed MIME types, and invalid magic bytes', () => {
    // 1. SVG disguised as PNG MIME type
    const svgCheck = validateUploadedFile(
      {
        originalname: 'logo.svg',
        mimetype: 'image/png',
        size: 64,
        buffer: Buffer.from('<svg onload="alert(1)"></svg>'),
      },
      { mode: 'asset' }
    );
    assert.strictEqual(svgCheck.valid, false, 'SVG asset uploads must be blocked');

    // 2. Fake PDF without %PDF- magic bytes
    const fakePdf = validateUploadedFile(
      {
        originalname: 'report.pdf',
        mimetype: 'application/pdf',
        size: 32,
        buffer: Buffer.from('<html><script>alert(1)</script></html>'),
      },
      { mode: 'content' }
    );
    assert.strictEqual(fakePdf.valid, false, 'Fake PDF with non-PDF magic bytes must be rejected');

    // 3. Valid PNG magic bytes with path traversal filename gets sanitized cleanly
    const validPng = validateUploadedFile(
      {
        originalname: '../../etc/banner.png',
        mimetype: 'image/png',
        size: 16,
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]),
      },
      { mode: 'asset' }
    );
    assert.strictEqual(validPng.valid, true);
    assert.strictEqual(validPng.safeName, 'banner.png');
  });

  test('9. CORS Policy: untrusted origins are not echoed with credentials', async () => {
    const evilOrigin = 'https://malicious-attacker.example';
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: evilOrigin },
    });
    assert.notStrictEqual(
      res.headers.get('access-control-allow-origin'),
      evilOrigin,
      'Untrusted origin must not be reflected in Access-Control-Allow-Origin'
    );

    const localOrigin = 'http://localhost:5173';
    const okRes = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: localOrigin },
    });
    assert.strictEqual(okRes.headers.get('access-control-allow-origin'), localOrigin);
  });

  test('10. Rate Limiting: enforces 429 Too Many Requests on brute-force auth attempts', async () => {
    let hit429 = false;
    for (let i = 0; i < 30; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-enforce-rate-limit': 'true',
        },
        body: JSON.stringify({ email: 'nobody@sec-audit.local', password: 'WrongPassword!' }),
      });
      if (res.status === 429) {
        hit429 = true;
        assert.ok(res.headers.get('retry-after'), 'Expected Retry-After header on 429');
        assert.ok(res.headers.get('ratelimit-limit'), 'Expected RateLimit-Limit header');
        break;
      }
    }
    assert.strictEqual(hit429, true, 'Auth endpoint must return 429 after exceeding rate limit');
  });
});
