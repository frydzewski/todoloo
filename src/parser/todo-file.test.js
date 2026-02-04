import { describe, it, expect } from 'vitest';
import { TodoFile } from './todo-file.js';
import { Task } from './task.js';

describe('TodoFile', () => {
  it('parses empty file', () => {
    const file = TodoFile.parse('');
    expect(file.inbox).toEqual([]);
    expect(file.completed).toEqual([]);
  });

  it('parses file with tasks', () => {
    const content = `# Todoloo

## Inbox
- [ ] Task one <!-- id:task0001 -->
- [ ] Task two <!-- id:task0002 -->

## Completed
- [x] Done task <!-- id:task0003 -->
`;
    const file = TodoFile.parse(content);
    expect(file.inbox).toHaveLength(2);
    expect(file.completed).toHaveLength(1);
    expect(file.inbox[0].description).toBe('Task one');
  });

  it('serializes to markdown', () => {
    const file = new TodoFile();
    file.inbox.push(new Task({ description: 'Task one', id: 'task0001' }));
    file.completed.push(new Task({ description: 'Done', completed: true, id: 'task0002' }));

    const output = file.toMarkdown();
    expect(output).toContain('# Todoloo');
    expect(output).toContain('## Inbox');
    expect(output).toContain('- [ ] Task one <!-- id:task0001 -->');
    expect(output).toContain('## Completed');
    expect(output).toContain('- [x] Done <!-- id:task0002 -->');
  });

  it('finds task by id', () => {
    const file = new TodoFile();
    file.inbox.push(new Task({ description: 'Find me', id: 'findme01' }));

    const found = file.findById('findme01');
    expect(found.description).toBe('Find me');
  });

  it('returns null for unknown id', () => {
    const file = new TodoFile();
    expect(file.findById('unknown1')).toBeNull();
  });
});
