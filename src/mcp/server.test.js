import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMcpServer } from './server.js';
import { Storage } from '../storage/storage.js';
import { TaskService } from '../services/task-service.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('MCP Server', () => {
  let testDir;
  let service;
  let server;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `todoloo-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    const storage = new Storage(testDir);
    service = new TaskService(storage);
    server = createMcpServer(service);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('has expected tools', () => {
    const tools = server.getTools();
    const toolNames = tools.map(t => t.name);

    expect(toolNames).toContain('add_task');
    expect(toolNames).toContain('list_tasks');
    expect(toolNames).toContain('complete_task');
    expect(toolNames).toContain('delete_task');
    expect(toolNames).toContain('update_task');
    expect(toolNames).toContain('search_tasks');
    expect(toolNames).toContain('split_task');
  });

  it('add_task creates a task', async () => {
    const result = await server.callTool('add_task', {
      description: 'Test from MCP'
    });

    expect(result.content[0].text).toContain('Test from MCP');

    const tasks = await service.listTasks();
    expect(tasks).toHaveLength(1);
  });

  it('list_tasks returns tasks', async () => {
    await service.addTask({ description: 'Task one' });
    await service.addTask({ description: 'Task two' });

    const result = await server.callTool('list_tasks', {});
    expect(result.content[0].text).toContain('Task one');
    expect(result.content[0].text).toContain('Task two');
  });
});
