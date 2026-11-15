import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import { spawn } from 'node:child_process';

describe('BrandLens AI — Milestone 1 Cross-Service Integration Tests', () => {
  let backendServer;
  let backendPort;
  let aiProcess;
  const aiPort = 8001; // use dedicated test port for AI service

  before(async () => {
    // 1. Start AI service on test port
    aiProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--port', String(aiPort)], {
      cwd: '../ai-service',
      env: { ...process.env, PORT: String(aiPort), PYTHONPATH: '.' },
      stdio: 'pipe',
    });

    // Wait for AI service to become ready
    let aiReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${aiPort}/health`);
        if (res.ok) {
          aiReady = true;
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    assert.ok(aiReady, 'AI service failed to start within timeout');

    // Override AI_SERVICE_URL for backend
    process.env.AI_SERVICE_URL = `http://127.0.0.1:${aiPort}`;

    // 2. Start Backend on dynamic port
    await new Promise((resolve) => {
      backendServer = app.listen(0, () => {
        backendPort = backendServer.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    if (backendServer) {
      await new Promise((resolve) => backendServer.close(resolve));
    }
    if (aiProcess) {
      aiProcess.kill();
    }
  });

  test('FastAPI AI service returns healthy on /health', async () => {
    const res = await fetch(`http://127.0.0.1:${aiPort}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'healthy');
    assert.strictEqual(body.service, 'ai-service');
  });

  test('FastAPI AI service returns operational status and capabilities on /api/status', async () => {
    const res = await fetch(`http://127.0.0.1:${aiPort}/api/status`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'operational');
    assert.ok(body.supported_formats.includes('pdf'));
  });

  test('Backend GET /api/health returns healthy status and DB structure', async () => {
    const res = await fetch(`http://127.0.0.1:${backendPort}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.service, 'backend');
    assert.ok(body.database);
  });

  test('Backend connects to AI service via GET /api/health/ai proxy', async () => {
    const res = await fetch(`http://127.0.0.1:${backendPort}/api/health/ai`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.aiServiceStatus, 'reachable');
    assert.strictEqual(body.details.service, 'ai-service');
  });
});
