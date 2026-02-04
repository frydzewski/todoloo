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

describe('Task.fromMarkdown', () => {
  it('parses minimal task', () => {
    const task = Task.fromMarkdown('- [ ] Buy milk <!-- id:abc12345 -->');
    expect(task.description).toBe('Buy milk');
    expect(task.completed).toBe(false);
    expect(task.id).toBe('abc12345');
  });

  it('parses completed task', () => {
    const task = Task.fromMarkdown('- [x] Buy milk <!-- id:abc12345 -->');
    expect(task.completed).toBe(true);
  });

  it('parses task with all fields', () => {
    const task = Task.fromMarkdown('- [ ] Call Jordan @2024-02-05T15:00 #personal #urgent !high <!-- id:abc12345 -->');
    expect(task.description).toBe('Call Jordan');
    expect(task.due).toBe('2024-02-05T15:00');
    expect(task.tags).toEqual(['personal', 'urgent']);
    expect(task.priority).toBe('high');
    expect(task.id).toBe('abc12345');
  });

  it('parses task with parent', () => {
    const task = Task.fromMarkdown('- [ ] Subtask <!-- id:child123 parent:parent12 -->');
    expect(task.parent).toBe('parent12');
  });

  it('returns null for non-task lines', () => {
    expect(Task.fromMarkdown('# Header')).toBeNull();
    expect(Task.fromMarkdown('Some text')).toBeNull();
    expect(Task.fromMarkdown('')).toBeNull();
  });

  it('roundtrips correctly', () => {
    const original = '- [ ] Call Jordan @2024-02-05T15:00 #personal #urgent !high <!-- id:abc12345 -->';
    const task = Task.fromMarkdown(original);
    expect(task.toMarkdown()).toBe(original);
  });
});
