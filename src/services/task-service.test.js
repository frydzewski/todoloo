import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskService } from './task-service.js';
import { Storage } from '../storage/storage.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('TaskService', () => {
  let testDir;
  let service;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `todoloo-service-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
    const storage = new Storage(testDir);
    service = new TaskService(storage);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('addTask', () => {
    it('adds a task to inbox', async () => {
      const task = await service.addTask({ description: 'New task' });
      expect(task.description).toBe('New task');
      expect(task.id).toBeDefined();

      const tasks = await service.listTasks();
      expect(tasks).toHaveLength(1);
    });

    it('adds task with all fields', async () => {
      const task = await service.addTask({
        description: 'Full task',
        priority: 'high',
        tags: ['work'],
        due: '2024-02-05'
      });

      expect(task.priority).toBe('high');
      expect(task.tags).toEqual(['work']);
      expect(task.due).toBe('2024-02-05');
    });
  });

  describe('completeTask', () => {
    it('marks task as completed', async () => {
      const task = await service.addTask({ description: 'To complete' });
      const completed = await service.completeTask(task.id);

      expect(completed.completed).toBe(true);

      const tasks = await service.listTasks({ status: 'open' });
      expect(tasks).toHaveLength(0);
    });

    it('throws for unknown task', async () => {
      await expect(service.completeTask('unknown1')).rejects.toThrow('Task not found');
    });
  });

  describe('deleteTask', () => {
    it('removes task', async () => {
      const task = await service.addTask({ description: 'To delete' });
      await service.deleteTask(task.id);

      const tasks = await service.listTasks();
      expect(tasks).toHaveLength(0);
    });
  });

  describe('updateTask', () => {
    it('updates task fields', async () => {
      const task = await service.addTask({ description: 'Original' });
      const updated = await service.updateTask(task.id, {
        description: 'Updated',
        priority: 'low'
      });

      expect(updated.description).toBe('Updated');
      expect(updated.priority).toBe('low');
    });
  });

  describe('listTasks', () => {
    it('filters by status', async () => {
      const t1 = await service.addTask({ description: 'Open task' });
      await service.completeTask(t1.id);
      await service.addTask({ description: 'Another open' });

      const open = await service.listTasks({ status: 'open' });
      const completed = await service.listTasks({ status: 'completed' });

      expect(open).toHaveLength(1);
      expect(completed).toHaveLength(1);
    });

    it('filters by tag', async () => {
      await service.addTask({ description: 'Work', tags: ['work'] });
      await service.addTask({ description: 'Personal', tags: ['personal'] });

      const work = await service.listTasks({ tag: 'work' });
      expect(work).toHaveLength(1);
      expect(work[0].description).toBe('Work');
    });

    it('filters by priority', async () => {
      await service.addTask({ description: 'High', priority: 'high' });
      await service.addTask({ description: 'Low', priority: 'low' });

      const high = await service.listTasks({ priority: 'high' });
      expect(high).toHaveLength(1);
    });
  });

  describe('searchTasks', () => {
    it('finds tasks by text', async () => {
      await service.addTask({ description: 'Call Jordan' });
      await service.addTask({ description: 'Buy groceries' });

      const results = await service.searchTasks('jordan');
      expect(results).toHaveLength(1);
      expect(results[0].description).toBe('Call Jordan');
    });
  });

  describe('splitTask', () => {
    it('creates subtasks from parent', async () => {
      const parent = await service.addTask({ description: 'Big task' });
      const subtasks = await service.splitTask(parent.id, [
        'Subtask one',
        'Subtask two'
      ]);

      expect(subtasks).toHaveLength(2);
      expect(subtasks[0].parent).toBe(parent.id);
      expect(subtasks[1].parent).toBe(parent.id);

      // Parent should be removed from inbox
      const tasks = await service.listTasks();
      expect(tasks.find(t => t.id === parent.id)).toBeUndefined();
    });
  });
});
