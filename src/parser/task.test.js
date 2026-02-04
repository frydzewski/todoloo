import { describe, it, expect } from 'vitest';
import { Task } from './task.js';

describe('Task', () => {
  it('creates a task with required fields', () => {
    const task = new Task({ description: 'Buy milk' });

    expect(task.description).toBe('Buy milk');
    expect(task.completed).toBe(false);
    expect(task.priority).toBe('medium');
    expect(task.tags).toEqual([]);
    expect(task.due).toBeNull();
    expect(task.id).toMatch(/^[a-z0-9]{8}$/);
  });

  it('creates a task with all fields', () => {
    const task = new Task({
      description: 'Call Jordan',
      completed: false,
      priority: 'high',
      tags: ['personal'],
      due: '2024-02-05T15:00',
      id: 'abc12345'
    });

    expect(task.description).toBe('Call Jordan');
    expect(task.priority).toBe('high');
    expect(task.tags).toEqual(['personal']);
    expect(task.due).toBe('2024-02-05T15:00');
    expect(task.id).toBe('abc12345');
  });

  it('validates priority values', () => {
    expect(() => new Task({ description: 'Test', priority: 'invalid' }))
      .toThrow('Invalid priority');
  });
});

describe('Task.toMarkdown', () => {
  it('serializes minimal task', () => {
    const task = new Task({ description: 'Buy milk', id: 'abc12345' });
    expect(task.toMarkdown()).toBe('- [ ] Buy milk <!-- id:abc12345 -->');
  });

  it('serializes completed task', () => {
    const task = new Task({ description: 'Buy milk', completed: true, id: 'abc12345' });
    expect(task.toMarkdown()).toBe('- [x] Buy milk <!-- id:abc12345 -->');
  });

  it('serializes task with all fields', () => {
    const task = new Task({
      description: 'Call Jordan',
      priority: 'high',
      tags: ['personal', 'urgent'],
      due: '2024-02-05T15:00',
      id: 'abc12345'
    });
    expect(task.toMarkdown()).toBe('- [ ] Call Jordan @2024-02-05T15:00 #personal #urgent !high <!-- id:abc12345 -->');
  });

  it('serializes task with parent', () => {
    const task = new Task({
      description: 'Subtask',
      id: 'child123',
      parent: 'parent12'
    });
    expect(task.toMarkdown()).toBe('- [ ] Subtask <!-- id:child123 parent:parent12 -->');
  });
});
