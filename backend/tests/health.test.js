import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';

describe('BrandLens AI Backend - Milestone 1 Health & Foundation Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('GET / returns operational service information', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.name, 'BrandLens AI Application API');
    assert.strictEqual(body.team, 'ALGO_X');
    assert.strictEqual(body.status, 'operational');
  });

  test('GET /api/health returns health status and database metrics', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.service, 'backend');
    assert.ok(body.timestamp);
    assert.ok(typeof body.uptimeSeconds === 'number');
    assert.ok(body.database);
    assert.ok(['connected', 'disconnected'].includes(body.database.status));
  });

  test('GET /api/nonexistent returns 404 JSON', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent`);
    assert.strictEqual(res.status, 404);

    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.statusCode, 404);
  });
});
