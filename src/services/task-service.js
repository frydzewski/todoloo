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
