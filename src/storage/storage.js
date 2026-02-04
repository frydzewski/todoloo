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
