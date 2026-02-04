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
