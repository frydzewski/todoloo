import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHttpServer } from './server.js';
import { Storage } from '../storage/storage.js';
import { TaskService } from '../services/task-service.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('HTTP Server', () => {
  let testDir;
  let service;
  let app;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `todoloo-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    const storage = new Storage(testDir);
    service = new TaskService(storage);
    app = createHttpServer(service);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  // Helper to make requests
  async function request(method, path, body) {
    const req = { method, url: path, body };
    let responseBody;
    let statusCode = 200;
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { responseBody = data; }
    };

    await app._handleRequest(req, res);
    return { status: statusCode, body: responseBody };
  }

  it('GET /api/tasks returns tasks', async () => {
    await service.addTask({ description: 'Test task' });

    const { status, body } = await request('GET', '/api/tasks');
    expect(status).toBe(200);
    expect(body.tasks).toHaveLength(1);
  });

  it('POST /api/tasks creates task', async () => {
    const { status, body } = await request('POST', '/api/tasks', {
      description: 'New task'
    });

    expect(status).toBe(200);
    expect(body.task.description).toBe('New task');
  });

  it('PUT /api/tasks/:id updates task', async () => {
    const task = await service.addTask({ description: 'Original' });

    const { status, body } = await request('PUT', `/api/tasks/${task.id}`, {
      description: 'Updated'
    });

    expect(status).toBe(200);
    expect(body.task.description).toBe('Updated');
  });

  it('POST /api/tasks/:id/complete completes task', async () => {
    const task = await service.addTask({ description: 'To complete' });

    const { status, body } = await request('POST', `/api/tasks/${task.id}/complete`);

    expect(status).toBe(200);
    expect(body.task.completed).toBe(true);
  });

  it('DELETE /api/tasks/:id deletes task', async () => {
    const task = await service.addTask({ description: 'To delete' });

    const { status } = await request('DELETE', `/api/tasks/${task.id}`);

    expect(status).toBe(200);
    const tasks = await service.listTasks();
    expect(tasks).toHaveLength(0);
  });
});
