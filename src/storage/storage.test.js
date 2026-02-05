import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Storage } from './storage.js';
import { Task } from '../parser/task.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Storage', () => {
  let testDir;
  let storage;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `todoloo-storage-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
    storage = new Storage(testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('initializes empty file on first load', async () => {
    const file = await storage.load();
    expect(file.inbox).toEqual([]);
    expect(file.completed).toEqual([]);
  });

  it('saves and loads tasks', async () => {
    const file = await storage.load();
    file.inbox.push(new Task({ description: 'Test task', id: 'test0001' }));
    await storage.save(file);

    const loaded = await storage.load();
    expect(loaded.inbox).toHaveLength(1);
    expect(loaded.inbox[0].description).toBe('Test task');
  });

  it('creates directory if not exists', async () => {
    const nestedDir = path.join(testDir, 'nested', 'dir');
    const nestedStorage = new Storage(nestedDir);

    await nestedStorage.load();

    const exists = await fs.stat(nestedDir).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});
