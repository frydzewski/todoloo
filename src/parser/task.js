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
}
