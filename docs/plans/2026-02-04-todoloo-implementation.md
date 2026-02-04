# Todoloo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a global task inbox MCP server with web UI for capturing tasks from Claude Code sessions.

**Architecture:** Single Node.js process serving both MCP (stdio) and HTTP (localhost:3456). Tasks stored in `~/.todoloo/todos.md` as markdown. Preact + HTM frontend via CDN (no build step).

**Tech Stack:** Node.js 20+, @modelcontextprotocol/sdk, Express, Preact + HTM (CDN), Vitest for testing.

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `src/index.js`
- Create: `.nvmrc`

**Step 1: Initialize package.json**

```bash
cd /Users/frankrydzewski/code/validic-labs/todoloo/.worktrees/feature-v1
```

Create `package.json`:
```json
{
  "name": "todoloo",
  "version": "0.1.0",
  "description": "Global task inbox for Claude Code",
  "type": "module",
  "main": "src/index.js",
  "bin": {
    "todoloo": "./bin/todoloo.js"
  },
  "scripts": {
    "start": "node src/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["mcp", "todo", "claude-code"],
  "license": "MIT",
  "engines": {
    "node": ">=20.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "express": "^4.18.2",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

**Step 2: Create .nvmrc**

```
20
```

**Step 3: Create placeholder entry point**

Create `src/index.js`:
```javascript
// Todoloo - Global task inbox for Claude Code
console.log('Todoloo starting...');
```

**Step 4: Install dependencies**

Run: `npm install`
Expected: Dependencies installed, node_modules created

**Step 5: Verify setup**

Run: `npm start`
Expected: "Todoloo starting..."

**Step 6: Commit**

```bash
git add package.json package-lock.json .nvmrc src/index.js
git commit -m "chore: initialize project with dependencies"
```

---

## Task 2: Markdown Parser - Task Data Structure

**Files:**
- Create: `src/parser/task.js`
- Create: `src/parser/task.test.js`

**Step 1: Write test for Task class**

Create `src/parser/task.test.js`:
```javascript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - Cannot find module './task.js'

**Step 3: Implement Task class**

Create `src/parser/task.js`:
```javascript
import { nanoid } from 'nanoid';

const VALID_PRIORITIES = ['high', 'medium', 'low'];

export class Task {
  constructor({ description, completed = false, priority = 'medium', tags = [], due = null, id = null, parent = null }) {
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new Error(`Invalid priority: ${priority}. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    this.id = id || nanoid(8);
    this.description = description;
    this.completed = completed;
    this.priority = priority;
    this.tags = [...tags];
    this.due = due;
    this.parent = parent;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/parser/task.js src/parser/task.test.js
git commit -m "feat: add Task data structure with validation"
```

---

## Task 3: Markdown Parser - Serialize Task to Markdown

**Files:**
- Modify: `src/parser/task.js`
- Modify: `src/parser/task.test.js`

**Step 1: Write test for toMarkdown**

Add to `src/parser/task.test.js`:
```javascript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - task.toMarkdown is not a function

**Step 3: Implement toMarkdown**

Add to `src/parser/task.js` inside Task class:
```javascript
  toMarkdown() {
    const checkbox = this.completed ? '[x]' : '[ ]';
    let line = `- ${checkbox} ${this.description}`;

    if (this.due) {
      line += ` @${this.due}`;
    }

    for (const tag of this.tags) {
      line += ` #${tag}`;
    }

    if (this.priority !== 'medium') {
      line += ` !${this.priority}`;
    }

    // Build metadata comment
    let meta = `id:${this.id}`;
    if (this.parent) {
      meta += ` parent:${this.parent}`;
    }
    line += ` <!-- ${meta} -->`;

    return line;
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (7 tests)

**Step 5: Commit**

```bash
git add src/parser/task.js src/parser/task.test.js
git commit -m "feat: add Task.toMarkdown serialization"
```

---

## Task 4: Markdown Parser - Parse Task from Markdown

**Files:**
- Modify: `src/parser/task.js`
- Modify: `src/parser/task.test.js`

**Step 1: Write test for fromMarkdown**

Add to `src/parser/task.test.js`:
```javascript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - Task.fromMarkdown is not a function

**Step 3: Implement fromMarkdown**

Add to `src/parser/task.js` as static method:
```javascript
  static fromMarkdown(line) {
    // Match task line: - [ ] or - [x]
    const taskMatch = line.match(/^- \[([ x])\] (.+)$/);
    if (!taskMatch) return null;

    const completed = taskMatch[1] === 'x';
    let content = taskMatch[2];

    // Extract metadata comment
    const metaMatch = content.match(/<!-- (.+?) -->$/);
    let id = null;
    let parent = null;

    if (metaMatch) {
      content = content.replace(/<!-- .+? -->$/, '').trim();
      const metaParts = metaMatch[1].split(' ');
      for (const part of metaParts) {
        if (part.startsWith('id:')) {
          id = part.slice(3);
        } else if (part.startsWith('parent:')) {
          parent = part.slice(7);
        }
      }
    }

    // Extract priority
    let priority = 'medium';
    const priorityMatch = content.match(/!(\w+)/);
    if (priorityMatch) {
      priority = priorityMatch[1];
      content = content.replace(/!\w+/, '').trim();
    }

    // Extract tags
    const tags = [];
    const tagMatches = content.matchAll(/#(\w+)/g);
    for (const match of tagMatches) {
      tags.push(match[1]);
    }
    content = content.replace(/#\w+/g, '').trim();

    // Extract due date
    let due = null;
    const dueMatch = content.match(/@(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?)/);
    if (dueMatch) {
      due = dueMatch[1];
      content = content.replace(/@\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?/, '').trim();
    }

    // Remaining content is the description
    const description = content.trim();

    return new Task({ description, completed, priority, tags, due, id, parent });
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (13 tests)

**Step 5: Commit**

```bash
git add src/parser/task.js src/parser/task.test.js
git commit -m "feat: add Task.fromMarkdown parsing"
```

---

## Task 5: Markdown Parser - TodoFile Class

**Files:**
- Create: `src/parser/todo-file.js`
- Create: `src/parser/todo-file.test.js`

**Step 1: Write test for TodoFile**

Create `src/parser/todo-file.test.js`:
```javascript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - Cannot find module './todo-file.js'

**Step 3: Implement TodoFile**

Create `src/parser/todo-file.js`:
```javascript
import { Task } from './task.js';

export class TodoFile {
  constructor() {
    this.inbox = [];
    this.completed = [];
  }

  static parse(content) {
    const file = new TodoFile();
    if (!content.trim()) return file;

    const lines = content.split('\n');
    let currentSection = null;

    for (const line of lines) {
      if (line.startsWith('## Inbox')) {
        currentSection = 'inbox';
      } else if (line.startsWith('## Completed')) {
        currentSection = 'completed';
      } else if (currentSection) {
        const task = Task.fromMarkdown(line);
        if (task) {
          file[currentSection].push(task);
        }
      }
    }

    return file;
  }

  toMarkdown() {
    let output = '# Todoloo\n\n';

    output += '## Inbox\n';
    for (const task of this.inbox) {
      output += task.toMarkdown() + '\n';
    }

    output += '\n## Completed\n';
    for (const task of this.completed) {
      output += task.toMarkdown() + '\n';
    }

    return output;
  }

  findById(id) {
    for (const task of [...this.inbox, ...this.completed]) {
      if (task.id === id) return task;
    }
    return null;
  }

  allTasks() {
    return [...this.inbox, ...this.completed];
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (18 tests)

**Step 5: Commit**

```bash
git add src/parser/todo-file.js src/parser/todo-file.test.js
git commit -m "feat: add TodoFile for parsing/serializing todo files"
```

---

## Task 6: Storage Layer

**Files:**
- Create: `src/storage/storage.js`
- Create: `src/storage/storage.test.js`

**Step 1: Write test for Storage**

Create `src/storage/storage.test.js`:
```javascript
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
    testDir = path.join(os.tmpdir(), `todoloo-test-${Date.now()}`);
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
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - Cannot find module './storage.js'

**Step 3: Implement Storage**

Create `src/storage/storage.js`:
```javascript
import fs from 'fs/promises';
import path from 'path';
import { TodoFile } from '../parser/todo-file.js';

export class Storage {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.filePath = path.join(baseDir, 'todos.md');
  }

  async load() {
    await fs.mkdir(this.baseDir, { recursive: true });

    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      return TodoFile.parse(content);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return new TodoFile();
      }
      throw err;
    }
  }

  async save(todoFile) {
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(this.filePath, todoFile.toMarkdown(), 'utf-8');
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (21 tests)

**Step 5: Commit**

```bash
git add src/storage/storage.js src/storage/storage.test.js
git commit -m "feat: add Storage layer for file persistence"
```

---

## Task 7: Task Service

**Files:**
- Create: `src/services/task-service.js`
- Create: `src/services/task-service.test.js`

**Step 1: Write test for TaskService**

Create `src/services/task-service.test.js`:
```javascript
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
    testDir = path.join(os.tmpdir(), `todoloo-test-${Date.now()}`);
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
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - Cannot find module './task-service.js'

**Step 3: Implement TaskService**

Create `src/services/task-service.js`:
```javascript
import { Task } from '../parser/task.js';

export class TaskService {
  constructor(storage) {
    this.storage = storage;
  }

  async addTask({ description, priority, tags, due }) {
    const file = await this.storage.load();
    const task = new Task({ description, priority, tags, due });
    file.inbox.push(task);
    await this.storage.save(file);
    return task;
  }

  async completeTask(id) {
    const file = await this.storage.load();
    const index = file.inbox.findIndex(t => t.id === id);

    if (index === -1) {
      throw new Error(`Task not found: ${id}`);
    }

    const task = file.inbox.splice(index, 1)[0];
    task.completed = true;
    file.completed.push(task);
    await this.storage.save(file);
    return task;
  }

  async deleteTask(id) {
    const file = await this.storage.load();

    const inboxIndex = file.inbox.findIndex(t => t.id === id);
    if (inboxIndex !== -1) {
      file.inbox.splice(inboxIndex, 1);
      await this.storage.save(file);
      return;
    }

    const completedIndex = file.completed.findIndex(t => t.id === id);
    if (completedIndex !== -1) {
      file.completed.splice(completedIndex, 1);
      await this.storage.save(file);
      return;
    }

    throw new Error(`Task not found: ${id}`);
  }

  async updateTask(id, updates) {
    const file = await this.storage.load();
    const task = file.findById(id);

    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    if (updates.description !== undefined) task.description = updates.description;
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.tags !== undefined) task.tags = [...updates.tags];
    if (updates.due !== undefined) task.due = updates.due;

    await this.storage.save(file);
    return task;
  }

  async listTasks({ status, tag, priority, limit } = {}) {
    const file = await this.storage.load();
    let tasks;

    if (status === 'open') {
      tasks = [...file.inbox];
    } else if (status === 'completed') {
      tasks = [...file.completed];
    } else {
      tasks = file.allTasks();
    }

    if (tag) {
      tasks = tasks.filter(t => t.tags.includes(tag));
    }

    if (priority) {
      tasks = tasks.filter(t => t.priority === priority);
    }

    if (limit) {
      tasks = tasks.slice(0, limit);
    }

    return tasks;
  }

  async searchTasks(query) {
    const file = await this.storage.load();
    const lowerQuery = query.toLowerCase();
    return file.allTasks().filter(t =>
      t.description.toLowerCase().includes(lowerQuery)
    );
  }

  async splitTask(parentId, subtaskDescriptions) {
    const file = await this.storage.load();
    const parentIndex = file.inbox.findIndex(t => t.id === parentId);

    if (parentIndex === -1) {
      throw new Error(`Task not found: ${parentId}`);
    }

    // Remove parent from inbox
    file.inbox.splice(parentIndex, 1);

    // Create subtasks
    const subtasks = subtaskDescriptions.map(desc =>
      new Task({ description: desc, parent: parentId })
    );

    file.inbox.push(...subtasks);
    await this.storage.save(file);
    return subtasks;
  }

  async getTask(id) {
    const file = await this.storage.load();
    return file.findById(id);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (32 tests)

**Step 5: Commit**

```bash
git add src/services/task-service.js src/services/task-service.test.js
git commit -m "feat: add TaskService with full CRUD operations"
```

---

## Task 8: MCP Server Setup

**Files:**
- Create: `src/mcp/server.js`
- Create: `src/mcp/server.test.js`

**Step 1: Write test for MCP server**

Create `src/mcp/server.test.js`:
```javascript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - Cannot find module './server.js'

**Step 3: Implement MCP server**

Create `src/mcp/server.js`:
```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export function createMcpServer(taskService) {
  const tools = [
    {
      name: 'add_task',
      description: 'Add a new task to the inbox',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Task description' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Task priority' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the task' },
          due: { type: 'string', description: 'Due date (YYYY-MM-DD or YYYY-MM-DDTHH:MM)' }
        },
        required: ['description']
      }
    },
    {
      name: 'list_tasks',
      description: 'List tasks with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['open', 'completed'], description: 'Filter by status' },
          tag: { type: 'string', description: 'Filter by tag' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Filter by priority' },
          limit: { type: 'number', description: 'Maximum number of tasks to return' }
        }
      }
    },
    {
      name: 'complete_task',
      description: 'Mark a task as completed',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID' }
        },
        required: ['id']
      }
    },
    {
      name: 'delete_task',
      description: 'Delete a task',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID' }
        },
        required: ['id']
      }
    },
    {
      name: 'update_task',
      description: 'Update a task',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID' },
          description: { type: 'string', description: 'New description' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'New priority' },
          tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
          due: { type: 'string', description: 'New due date' }
        },
        required: ['id']
      }
    },
    {
      name: 'search_tasks',
      description: 'Search tasks by text',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      }
    },
    {
      name: 'split_task',
      description: 'Split a task into subtasks',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Parent task ID' },
          subtasks: { type: 'array', items: { type: 'string' }, description: 'Subtask descriptions' }
        },
        required: ['id', 'subtasks']
      }
    }
  ];

  const toolHandlers = {
    add_task: async (args) => {
      const task = await taskService.addTask(args);
      return formatTask(task, 'Added');
    },
    list_tasks: async (args) => {
      const tasks = await taskService.listTasks(args);
      if (tasks.length === 0) {
        return { content: [{ type: 'text', text: 'No tasks found.' }] };
      }
      const text = tasks.map(t => formatTaskLine(t)).join('\n');
      return { content: [{ type: 'text', text }] };
    },
    complete_task: async (args) => {
      const task = await taskService.completeTask(args.id);
      return formatTask(task, 'Completed');
    },
    delete_task: async (args) => {
      await taskService.deleteTask(args.id);
      return { content: [{ type: 'text', text: `Deleted task ${args.id}` }] };
    },
    update_task: async (args) => {
      const { id, ...updates } = args;
      const task = await taskService.updateTask(id, updates);
      return formatTask(task, 'Updated');
    },
    search_tasks: async (args) => {
      const tasks = await taskService.searchTasks(args.query);
      if (tasks.length === 0) {
        return { content: [{ type: 'text', text: 'No tasks found.' }] };
      }
      const text = tasks.map(t => formatTaskLine(t)).join('\n');
      return { content: [{ type: 'text', text }] };
    },
    split_task: async (args) => {
      const subtasks = await taskService.splitTask(args.id, args.subtasks);
      const text = `Split into ${subtasks.length} subtasks:\n` +
        subtasks.map(t => formatTaskLine(t)).join('\n');
      return { content: [{ type: 'text', text }] };
    }
  };

  function formatTaskLine(task) {
    let line = `[${task.id}] ${task.description}`;
    if (task.due) line += ` @${task.due}`;
    if (task.tags.length) line += ` ${task.tags.map(t => `#${t}`).join(' ')}`;
    if (task.priority !== 'medium') line += ` !${task.priority}`;
    if (task.completed) line += ' (completed)';
    return line;
  }

  function formatTask(task, action) {
    return { content: [{ type: 'text', text: `${action}: ${formatTaskLine(task)}` }] };
  }

  // Create a simple wrapper that matches our test interface
  return {
    getTools: () => tools,
    callTool: async (name, args) => {
      const handler = toolHandlers[name];
      if (!handler) throw new Error(`Unknown tool: ${name}`);
      return handler(args);
    },
    tools,
    toolHandlers,
    // For actual MCP connection
    async start() {
      const server = new Server(
        { name: 'todoloo', version: '0.1.0' },
        { capabilities: { tools: {} } }
      );

      server.setRequestHandler('tools/list', async () => ({
        tools
      }));

      server.setRequestHandler('tools/call', async (request) => {
        const { name, arguments: args } = request.params;
        return toolHandlers[name](args);
      });

      const transport = new StdioServerTransport();
      await server.connect(transport);
    }
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (35 tests)

**Step 5: Commit**

```bash
git add src/mcp/server.js src/mcp/server.test.js
git commit -m "feat: add MCP server with all tool handlers"
```

---

## Task 9: HTTP Server & REST API

**Files:**
- Create: `src/http/server.js`
- Create: `src/http/server.test.js`

**Step 1: Write test for HTTP API**

Create `src/http/server.test.js`:
```javascript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - Cannot find module './server.js'

**Step 3: Implement HTTP server**

Create `src/http/server.js`:
```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createHttpServer(taskService, options = {}) {
  const app = express();
  app.use(express.json());

  // Serve static files (web UI)
  const webDir = path.join(__dirname, '..', 'web');
  app.use(express.static(webDir));

  // API routes
  app.get('/api/tasks', async (req, res) => {
    try {
      const { status, tag, priority, limit } = req.query;
      const tasks = await taskService.listTasks({
        status,
        tag,
        priority,
        limit: limit ? parseInt(limit) : undefined
      });
      res.json({ tasks });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    try {
      const task = await taskService.addTask(req.body);
      res.json({ task });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/tasks/:id', async (req, res) => {
    try {
      const task = await taskService.updateTask(req.params.id, req.body);
      res.json({ task });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.post('/api/tasks/:id/complete', async (req, res) => {
    try {
      const task = await taskService.completeTask(req.params.id);
      res.json({ task });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      await taskService.deleteTask(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.get('/api/tasks/search', async (req, res) => {
    try {
      const { q } = req.query;
      const tasks = await taskService.searchTasks(q || '');
      res.json({ tasks });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tasks/:id/split', async (req, res) => {
    try {
      const { subtasks } = req.body;
      const tasks = await taskService.splitTask(req.params.id, subtasks);
      res.json({ tasks });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  // For testing - simple request handler
  app._handleRequest = async (req, res) => {
    const [pathPart, queryPart] = req.url.split('?');
    req.params = {};
    req.query = {};

    // Parse query string
    if (queryPart) {
      for (const pair of queryPart.split('&')) {
        const [key, value] = pair.split('=');
        req.query[key] = decodeURIComponent(value);
      }
    }

    // Match routes
    const taskIdMatch = pathPart.match(/^\/api\/tasks\/([^/]+)$/);
    const completeMatch = pathPart.match(/^\/api\/tasks\/([^/]+)\/complete$/);
    const splitMatch = pathPart.match(/^\/api\/tasks\/([^/]+)\/split$/);

    if (pathPart === '/api/tasks' && req.method === 'GET') {
      await app._handlers.listTasks(req, res);
    } else if (pathPart === '/api/tasks' && req.method === 'POST') {
      await app._handlers.createTask(req, res);
    } else if (taskIdMatch && req.method === 'PUT') {
      req.params.id = taskIdMatch[1];
      await app._handlers.updateTask(req, res);
    } else if (taskIdMatch && req.method === 'DELETE') {
      req.params.id = taskIdMatch[1];
      await app._handlers.deleteTask(req, res);
    } else if (completeMatch && req.method === 'POST') {
      req.params.id = completeMatch[1];
      await app._handlers.completeTask(req, res);
    } else if (splitMatch && req.method === 'POST') {
      req.params.id = splitMatch[1];
      await app._handlers.splitTask(req, res);
    }
  };

  app._handlers = {
    listTasks: async (req, res) => {
      const { status, tag, priority, limit } = req.query;
      const tasks = await taskService.listTasks({ status, tag, priority, limit: limit ? parseInt(limit) : undefined });
      res.json({ tasks });
    },
    createTask: async (req, res) => {
      const task = await taskService.addTask(req.body);
      res.json({ task });
    },
    updateTask: async (req, res) => {
      const task = await taskService.updateTask(req.params.id, req.body);
      res.json({ task });
    },
    deleteTask: async (req, res) => {
      await taskService.deleteTask(req.params.id);
      res.json({ success: true });
    },
    completeTask: async (req, res) => {
      const task = await taskService.completeTask(req.params.id);
      res.json({ task });
    },
    splitTask: async (req, res) => {
      const tasks = await taskService.splitTask(req.params.id, req.body.subtasks);
      res.json({ tasks });
    }
  };

  return app;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (40 tests)

**Step 5: Commit**

```bash
git add src/http/server.js src/http/server.test.js
git commit -m "feat: add HTTP server with REST API"
```

---

## Task 10: Web UI - HTML Structure

**Files:**
- Create: `src/web/index.html`

**Step 1: Create HTML file**

Create `src/web/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todoloo</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app"></div>

  <script type="module">
    import { h, render } from 'https://esm.sh/preact@10.19.3';
    import { useState, useEffect } from 'https://esm.sh/preact@10.19.3/hooks';
    import htm from 'https://esm.sh/htm@3.1.1';

    const html = htm.bind(h);

    // API helpers
    const api = {
      async getTasks(filters = {}) {
        const params = new URLSearchParams(filters);
        const res = await fetch(`/api/tasks?${params}`);
        const data = await res.json();
        return data.tasks;
      },
      async addTask(task) {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task)
        });
        const data = await res.json();
        return data.task;
      },
      async completeTask(id) {
        const res = await fetch(`/api/tasks/${id}/complete`, { method: 'POST' });
        const data = await res.json();
        return data.task;
      },
      async deleteTask(id) {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      },
      async updateTask(id, updates) {
        const res = await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        const data = await res.json();
        return data.task;
      }
    };

    // Components
    function TaskItem({ task, onComplete, onDelete, onUpdate }) {
      const [editing, setEditing] = useState(false);
      const [editText, setEditText] = useState(task.description);

      const handleSave = async () => {
        await onUpdate(task.id, { description: editText });
        setEditing(false);
      };

      const priorityClass = task.priority !== 'medium' ? `priority-${task.priority}` : '';

      return html`
        <div class="task-item ${task.completed ? 'completed' : ''} ${priorityClass}">
          <input
            type="checkbox"
            checked=${task.completed}
            onChange=${() => onComplete(task.id)}
          />
          ${editing ? html`
            <input
              type="text"
              class="edit-input"
              value=${editText}
              onInput=${e => setEditText(e.target.value)}
              onKeyDown=${e => e.key === 'Enter' && handleSave()}
              onBlur=${handleSave}
            />
          ` : html`
            <span class="task-text" onClick=${() => setEditing(true)}>
              ${task.description}
            </span>
          `}
          ${task.due && html`<span class="due">@${task.due}</span>`}
          ${task.tags.map(tag => html`<span class="tag">#${tag}</span>`)}
          ${task.priority !== 'medium' && html`<span class="priority">!${task.priority}</span>`}
          <button class="delete-btn" onClick=${() => onDelete(task.id)}>×</button>
        </div>
      `;
    }

    function AddTask({ onAdd }) {
      const [text, setText] = useState('');

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        await onAdd({ description: text });
        setText('');
      };

      return html`
        <form class="add-task" onSubmit=${handleSubmit}>
          <input
            type="text"
            placeholder="Add a task..."
            value=${text}
            onInput=${e => setText(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      `;
    }

    function FilterBar({ filter, onFilterChange }) {
      return html`
        <div class="filter-bar">
          <button
            class=${filter === 'all' ? 'active' : ''}
            onClick=${() => onFilterChange('all')}
          >All</button>
          <button
            class=${filter === 'open' ? 'active' : ''}
            onClick=${() => onFilterChange('open')}
          >Open</button>
          <button
            class=${filter === 'completed' ? 'active' : ''}
            onClick=${() => onFilterChange('completed')}
          >Completed</button>
        </div>
      `;
    }

    function App() {
      const [tasks, setTasks] = useState([]);
      const [filter, setFilter] = useState('open');
      const [loading, setLoading] = useState(true);

      const loadTasks = async () => {
        setLoading(true);
        const filters = filter !== 'all' ? { status: filter } : {};
        const tasks = await api.getTasks(filters);
        setTasks(tasks);
        setLoading(false);
      };

      useEffect(() => { loadTasks(); }, [filter]);

      const handleAdd = async (task) => {
        await api.addTask(task);
        loadTasks();
      };

      const handleComplete = async (id) => {
        await api.completeTask(id);
        loadTasks();
      };

      const handleDelete = async (id) => {
        await api.deleteTask(id);
        loadTasks();
      };

      const handleUpdate = async (id, updates) => {
        await api.updateTask(id, updates);
        loadTasks();
      };

      return html`
        <div class="container">
          <h1>Todoloo</h1>
          <${AddTask} onAdd=${handleAdd} />
          <${FilterBar} filter=${filter} onFilterChange=${setFilter} />
          ${loading ? html`<p>Loading...</p>` : html`
            <div class="task-list">
              ${tasks.map(task => html`
                <${TaskItem}
                  key=${task.id}
                  task=${task}
                  onComplete=${handleComplete}
                  onDelete=${handleDelete}
                  onUpdate=${handleUpdate}
                />
              `)}
              ${tasks.length === 0 && html`<p class="empty">No tasks</p>`}
            </div>
          `}
        </div>
      `;
    }

    render(html`<${App} />`, document.getElementById('app'));
  </script>
</body>
</html>
```

**Step 2: Commit**

```bash
git add src/web/index.html
git commit -m "feat: add web UI with Preact + HTM"
```

---

## Task 11: Web UI - Styles

**Files:**
- Create: `src/web/styles.css`

**Step 1: Create CSS file**

Create `src/web/styles.css`:
```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
  line-height: 1.5;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
}

/* Add Task Form */
.add-task {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.add-task input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.add-task input:focus {
  outline: none;
  border-color: #007aff;
}

.add-task button {
  padding: 0.75rem 1.5rem;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.add-task button:hover {
  background: #0056b3;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filter-bar button {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.filter-bar button.active {
  background: #007aff;
  color: white;
  border-color: #007aff;
}

/* Task List */
.task-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.task-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item.completed .task-text {
  text-decoration: line-through;
  color: #999;
}

.task-item.priority-high {
  border-left: 3px solid #ff3b30;
}

.task-item.priority-low {
  border-left: 3px solid #8e8e93;
}

.task-item input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.task-text {
  flex: 1;
  cursor: pointer;
}

.task-text:hover {
  color: #007aff;
}

.edit-input {
  flex: 1;
  padding: 0.25rem;
  border: 1px solid #007aff;
  border-radius: 4px;
  font-size: 1rem;
}

.due {
  color: #ff9500;
  font-size: 0.875rem;
}

.tag {
  background: #e8f0fe;
  color: #1967d2;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.priority {
  color: #ff3b30;
  font-size: 0.875rem;
  font-weight: 500;
}

.delete-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.25rem;
}

.delete-btn:hover {
  color: #ff3b30;
}

.empty {
  padding: 2rem;
  text-align: center;
  color: #999;
}
```

**Step 2: Commit**

```bash
git add src/web/styles.css
git commit -m "feat: add web UI styles"
```

---

## Task 12: Main Entry Point

**Files:**
- Modify: `src/index.js`

**Step 1: Write main entry point**

Replace `src/index.js`:
```javascript
import path from 'path';
import os from 'os';
import { Storage } from './storage/storage.js';
import { TaskService } from './services/task-service.js';
import { createMcpServer } from './mcp/server.js';
import { createHttpServer } from './http/server.js';

const DEFAULT_PORT = 3456;
const DEFAULT_DIR = path.join(os.homedir(), '.todoloo');

async function main() {
  const baseDir = process.env.TODOLOO_DIR || DEFAULT_DIR;
  const port = parseInt(process.env.TODOLOO_PORT || DEFAULT_PORT);
  const mode = process.argv[2] || 'http'; // 'http' or 'mcp'

  const storage = new Storage(baseDir);
  const taskService = new TaskService(storage);

  if (mode === 'mcp') {
    // MCP mode - communicate via stdio
    const mcpServer = createMcpServer(taskService);
    await mcpServer.start();
    console.error('Todoloo MCP server started');
  } else {
    // HTTP mode - serve web UI
    const app = createHttpServer(taskService);
    app.listen(port, () => {
      console.log(`Todoloo running at http://localhost:${port}`);
      console.log(`Data directory: ${baseDir}`);
    });
  }
}

main().catch(err => {
  console.error('Failed to start Todoloo:', err);
  process.exit(1);
});
```

**Step 2: Test HTTP mode**

Run: `npm start`
Expected: "Todoloo running at http://localhost:3456"

**Step 3: Commit**

```bash
git add src/index.js
git commit -m "feat: add main entry point with HTTP and MCP modes"
```

---

## Task 13: CLI Commands

**Files:**
- Create: `bin/todoloo.js`

**Step 1: Create CLI**

Create `bin/todoloo.js`:
```javascript
#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, '..', 'src', 'index.js');
const pidFile = path.join(os.homedir(), '.todoloo', 'server.pid');
const logFile = path.join(os.homedir(), '.todoloo', 'logs', 'server.log');

const commands = {
  start: async () => {
    // Check if already running
    if (fs.existsSync(pidFile)) {
      const pid = fs.readFileSync(pidFile, 'utf-8').trim();
      try {
        process.kill(parseInt(pid), 0);
        console.log(`Todoloo already running (PID ${pid})`);
        return;
      } catch {
        // Process not running, clean up stale PID file
        fs.unlinkSync(pidFile);
      }
    }

    // Ensure log directory exists
    const logDir = path.dirname(logFile);
    fs.mkdirSync(logDir, { recursive: true });

    // Start server in background
    const out = fs.openSync(logFile, 'a');
    const child = spawn('node', [srcPath], {
      detached: true,
      stdio: ['ignore', out, out]
    });

    fs.writeFileSync(pidFile, String(child.pid));
    child.unref();

    console.log(`Todoloo started (PID ${child.pid})`);
    console.log(`Logs: ${logFile}`);
  },

  stop: async () => {
    if (!fs.existsSync(pidFile)) {
      console.log('Todoloo is not running');
      return;
    }

    const pid = fs.readFileSync(pidFile, 'utf-8').trim();
    try {
      process.kill(parseInt(pid), 'SIGTERM');
      fs.unlinkSync(pidFile);
      console.log('Todoloo stopped');
    } catch {
      console.log('Todoloo is not running');
      fs.unlinkSync(pidFile);
    }
  },

  status: async () => {
    if (!fs.existsSync(pidFile)) {
      console.log('Todoloo is not running');
      return;
    }

    const pid = fs.readFileSync(pidFile, 'utf-8').trim();
    try {
      process.kill(parseInt(pid), 0);
      console.log(`Todoloo is running (PID ${pid})`);
    } catch {
      console.log('Todoloo is not running (stale PID file)');
      fs.unlinkSync(pidFile);
    }
  },

  open: async () => {
    const port = process.env.TODOLOO_PORT || 3456;
    const url = `http://localhost:${port}`;

    const cmd = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';

    exec(`${cmd} ${url}`);
    console.log(`Opening ${url}`);
  },

  logs: async () => {
    if (!fs.existsSync(logFile)) {
      console.log('No logs found');
      return;
    }

    const child = spawn('tail', ['-f', logFile], {
      stdio: 'inherit'
    });

    process.on('SIGINT', () => {
      child.kill();
      process.exit(0);
    });
  },

  help: async () => {
    console.log(`
Todoloo - Global task inbox for Claude Code

Usage: todoloo <command>

Commands:
  start   Start the server in background
  stop    Stop the server
  status  Check if server is running
  open    Open web UI in browser
  logs    Tail server logs
  help    Show this help message
`);
  }
};

const command = process.argv[2] || 'help';
const handler = commands[command];

if (!handler) {
  console.error(`Unknown command: ${command}`);
  commands.help();
  process.exit(1);
}

handler().catch(err => {
  console.error(err);
  process.exit(1);
});
```

**Step 2: Make executable**

Run: `chmod +x bin/todoloo.js`

**Step 3: Test CLI**

Run: `node bin/todoloo.js help`
Expected: Shows help message

**Step 4: Commit**

```bash
git add bin/todoloo.js
git commit -m "feat: add CLI commands (start, stop, status, open, logs)"
```

---

## Task 14: Parser Index Export

**Files:**
- Create: `src/parser/index.js`

**Step 1: Create index**

Create `src/parser/index.js`:
```javascript
export { Task } from './task.js';
export { TodoFile } from './todo-file.js';
```

**Step 2: Commit**

```bash
git add src/parser/index.js
git commit -m "chore: add parser index export"
```

---

## Task 15: LaunchAgent for macOS

**Files:**
- Create: `install/com.todoloo.server.plist`
- Create: `install/install.sh`

**Step 1: Create LaunchAgent plist**

Create `install/com.todoloo.server.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.todoloo.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>TODOLOO_PATH/src/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>HOME/.todoloo/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>HOME/.todoloo/logs/stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
```

**Step 2: Create install script**

Create `install/install.sh`:
```bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PLIST_NAME="com.todoloo.server.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
LOG_DIR="$HOME/.todoloo/logs"

echo "Installing Todoloo..."

# Create log directory
mkdir -p "$LOG_DIR"

# Create LaunchAgent directory if needed
mkdir -p "$LAUNCH_AGENTS_DIR"

# Copy and configure plist
sed -e "s|TODOLOO_PATH|$PROJECT_DIR|g" \
    -e "s|HOME|$HOME|g" \
    "$SCRIPT_DIR/$PLIST_NAME" > "$LAUNCH_AGENTS_DIR/$PLIST_NAME"

echo "LaunchAgent installed at $LAUNCH_AGENTS_DIR/$PLIST_NAME"

# Load the agent
launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_NAME" 2>/dev/null || true
launchctl load "$LAUNCH_AGENTS_DIR/$PLIST_NAME"

echo "Todoloo service started!"
echo "Web UI: http://localhost:3456"
echo "Logs: $LOG_DIR"
```

**Step 3: Make install script executable**

Run: `chmod +x install/install.sh`

**Step 4: Commit**

```bash
git add install/com.todoloo.server.plist install/install.sh
git commit -m "feat: add macOS LaunchAgent for auto-start"
```

---

## Task 16: Claude Code Skills

**Files:**
- Create: `skills/todoloo-track.md`
- Create: `skills/todoloo-tasks.md`
- Create: `skills/todoloo-done.md`

**Step 1: Create track skill**

Create `skills/todoloo-track.md`:
```markdown
---
name: todoloo:track
description: Add a task to Todoloo inbox
mcp_server: todoloo
---

# Track Task

Add a task to your global Todoloo inbox.

## Usage

```
/todoloo:track "Task description" [--priority high|medium|low] [--tag tagname] [--due YYYY-MM-DD]
```

## Examples

```
/todoloo:track "Call Jordan at 3pm"
/todoloo:track "Review PR #123" --priority high --tag work
/todoloo:track "Buy groceries" --due 2024-02-06 --tag personal
```

## Implementation

Parse the command and call the `add_task` MCP tool:

1. Extract description (required, in quotes)
2. Extract --priority (optional, defaults to medium)
3. Extract --tag (optional, can be multiple)
4. Extract --due (optional)

Call MCP tool:
```json
{
  "tool": "add_task",
  "arguments": {
    "description": "<extracted>",
    "priority": "<extracted or medium>",
    "tags": ["<extracted>"],
    "due": "<extracted or null>"
  }
}
```

Respond with confirmation: "Added: <task description> #tags !priority"
```

**Step 2: Create tasks skill**

Create `skills/todoloo-tasks.md`:
```markdown
---
name: todoloo:tasks
description: List tasks from Todoloo
mcp_server: todoloo
---

# List Tasks

Show tasks from your Todoloo inbox.

## Usage

```
/todoloo:tasks [--status open|completed] [--tag tagname] [--priority high|medium|low]
```

## Examples

```
/todoloo:tasks
/todoloo:tasks --status open
/todoloo:tasks --tag work --priority high
```

## Implementation

Call the `list_tasks` MCP tool with any provided filters.

Display results in a readable format:
- [id] Description @due #tags !priority
```

**Step 3: Create done skill**

Create `skills/todoloo-done.md`:
```markdown
---
name: todoloo:done
description: Mark a task as complete
mcp_server: todoloo
---

# Complete Task

Mark a Todoloo task as complete.

## Usage

```
/todoloo:done <task-id>
/todoloo:done "<partial description>"
```

## Examples

```
/todoloo:done abc12345
/todoloo:done "call jordan"
```

## Implementation

If argument looks like an ID (8 alphanumeric chars), call `complete_task` directly.

If argument is text, first call `search_tasks` to find matching task, then complete it.

Respond with confirmation: "Completed: <task description>"
```

**Step 4: Commit**

```bash
git add skills/
git commit -m "feat: add Claude Code skills for todoloo commands"
```

---

## Task 17: MCP Configuration

**Files:**
- Create: `mcp-config.json`

**Step 1: Create MCP config**

Create `mcp-config.json`:
```json
{
  "mcpServers": {
    "todoloo": {
      "command": "node",
      "args": ["src/index.js", "mcp"],
      "cwd": "TODOLOO_PATH"
    }
  }
}
```

**Step 2: Add README section about configuration**

This will be documented when user is ready.

**Step 3: Commit**

```bash
git add mcp-config.json
git commit -m "feat: add MCP server configuration example"
```

---

## Task 18: Final Integration Test

**Files:**
- Create: `test/integration.test.js`

**Step 1: Write integration test**

Create `test/integration.test.js`:
```javascript
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
```

**Step 2: Run integration tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add test/integration.test.js
git commit -m "test: add integration tests"
```

---

## Summary

After completing all tasks, the project structure will be:

```
todoloo/
├── bin/
│   └── todoloo.js           # CLI commands
├── install/
│   ├── com.todoloo.server.plist  # macOS LaunchAgent
│   └── install.sh           # Install script
├── skills/
│   ├── todoloo-track.md     # /todoloo:track skill
│   ├── todoloo-tasks.md     # /todoloo:tasks skill
│   └── todoloo-done.md      # /todoloo:done skill
├── src/
│   ├── http/
│   │   ├── server.js        # Express HTTP server
│   │   └── server.test.js
│   ├── mcp/
│   │   ├── server.js        # MCP server
│   │   └── server.test.js
│   ├── parser/
│   │   ├── index.js
│   │   ├── task.js          # Task data structure
│   │   ├── task.test.js
│   │   ├── todo-file.js     # TodoFile parser
│   │   └── todo-file.test.js
│   ├── services/
│   │   ├── task-service.js  # Business logic
│   │   └── task-service.test.js
│   ├── storage/
│   │   ├── storage.js       # File persistence
│   │   └── storage.test.js
│   ├── web/
│   │   ├── index.html       # Preact + HTM UI
│   │   └── styles.css
│   └── index.js             # Main entry point
├── test/
│   └── integration.test.js
├── docs/plans/
│   └── 2026-02-04-todoloo-design.md
├── mcp-config.json
├── package.json
└── .nvmrc
```

To use:
1. `npm install`
2. `npm start` - Run HTTP server
3. `node src/index.js mcp` - Run as MCP server
4. `./install/install.sh` - Auto-start on macOS
