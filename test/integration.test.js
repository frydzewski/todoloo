import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Storage } from '../src/storage/storage.js';
import { TaskService } from '../src/services/task-service.js';
import { createMcpServer } from '../src/mcp/server.js';
import { createHttpServer } from '../src/http/server.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Integration', () => {
  let testDir;
  let storage;
  let service;
  let mcpServer;
  let httpServer;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `todoloo-integration-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    storage = new Storage(testDir);
    service = new TaskService(storage);
    mcpServer = createMcpServer(service);
    httpServer = createHttpServer(service);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('full workflow: add via MCP, view via HTTP, complete via MCP', async () => {
    // Add task via MCP
    const addResult = await mcpServer.callTool('add_task', {
      description: 'Integration test task',
      priority: 'high',
      tags: ['test']
    });
    expect(addResult.content[0].text).toContain('Integration test task');

    // List via HTTP
    const tasks = await service.listTasks({ status: 'open' });
    expect(tasks).toHaveLength(1);
    const taskId = tasks[0].id;

    // Complete via MCP
    const completeResult = await mcpServer.callTool('complete_task', { id: taskId });
    expect(completeResult.content[0].text).toContain('Completed');

    // Verify via service
    const openTasks = await service.listTasks({ status: 'open' });
    const completedTasks = await service.listTasks({ status: 'completed' });
    expect(openTasks).toHaveLength(0);
    expect(completedTasks).toHaveLength(1);
  });

  it('markdown file is human-readable', async () => {
    await service.addTask({
      description: 'Call Jordan',
      priority: 'high',
      tags: ['personal'],
      due: '2024-02-05T15:00'
    });

    const content = await fs.readFile(path.join(testDir, 'todos.md'), 'utf-8');

    expect(content).toContain('# Todoloo');
    expect(content).toContain('## Inbox');
    expect(content).toContain('- [ ] Call Jordan');
    expect(content).toContain('@2024-02-05T15:00');
    expect(content).toContain('#personal');
    expect(content).toContain('!high');
  });
});
