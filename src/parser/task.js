import { customAlphabet } from 'nanoid';

const VALID_PRIORITIES = ['high', 'medium', 'low'];
const generateId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export class Task {
  constructor({ description, completed = false, priority = 'medium', tags = [], due = null, id = null, parent = null }) {
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new Error(`Invalid priority: ${priority}. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    this.id = id || generateId();
    this.description = description;
    this.completed = completed;
    this.priority = priority;
    this.tags = [...tags];
    this.due = due;
    this.parent = parent;
  }

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
}
