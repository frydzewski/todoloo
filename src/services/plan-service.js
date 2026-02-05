import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';

export class PlanService {
  constructor(storage) {
    this.storage = storage;
    this.plansDir = path.join(storage.baseDir, 'plans');
  }

  async ensurePlansDir() {
    await fs.mkdir(this.plansDir, { recursive: true });
  }

  planPath(name) {
    // Sanitize plan name for filesystem
    const safeName = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    return path.join(this.plansDir, `${safeName}.json`);
  }

  async createPlan({ name, description }) {
    await this.ensurePlansDir();
    const planPath = this.planPath(name);

    // Check if exists
    try {
      await fs.access(planPath);
      throw new Error(`Plan "${name}" already exists`);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    const plan = {
      name,
      description: description || '',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      items: [],
      handoff: null
    };

    await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
    return plan;
  }

  async getPlan(name) {
    const planPath = this.planPath(name);
    try {
      const data = await fs.readFile(planPath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`Plan "${name}" not found`);
      }
      throw err;
    }
  }

  async savePlan(plan) {
    const planPath = this.planPath(plan.name);
    plan.updated = new Date().toISOString();
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
    return plan;
  }

  async addPlanItem(name, { content, position }) {
    const plan = await this.getPlan(name);

    const item = {
      id: nanoid(8),
      content,
      status: 'pending',
      added: new Date().toISOString()
    };

    if (position === 'top') {
      plan.items.unshift(item);
    } else {
      plan.items.push(item);
    }

    await this.savePlan(plan);
    return { plan, item };
  }

  async updatePlanItem(name, itemId, updates) {
    const plan = await this.getPlan(name);
    const item = plan.items.find(i => i.id === itemId);

    if (!item) {
      throw new Error(`Item "${itemId}" not found in plan "${name}"`);
    }

    if (updates.content !== undefined) item.content = updates.content;
    if (updates.status !== undefined) item.status = updates.status;
    item.updated = new Date().toISOString();

    await this.savePlan(plan);
    return { plan, item };
  }

  async removePlanItem(name, itemId) {
    const plan = await this.getPlan(name);
    const index = plan.items.findIndex(i => i.id === itemId);

    if (index === -1) {
      throw new Error(`Item "${itemId}" not found in plan "${name}"`);
    }

    const [removed] = plan.items.splice(index, 1);
    await this.savePlan(plan);
    return { plan, removed };
  }

  async listPlans() {
    await this.ensurePlansDir();
    const files = await fs.readdir(this.plansDir);
    const plans = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = await fs.readFile(path.join(this.plansDir, file), 'utf-8');
          const plan = JSON.parse(data);
          plans.push({
            name: plan.name,
            description: plan.description,
            itemCount: plan.items.length,
            pendingCount: plan.items.filter(i => i.status === 'pending').length,
            hasHandoff: !!plan.handoff,
            created: plan.created,
            updated: plan.updated
          });
        } catch (err) {
          // Skip invalid files
        }
      }
    }

    return plans;
  }

  async handoff(name, { notes, instruction, context }) {
    const plan = await this.getPlan(name);

    plan.handoff = {
      timestamp: new Date().toISOString(),
      notes: notes || '',
      instruction: instruction || '',
      context: context || {}
    };

    await this.savePlan(plan);
    return plan;
  }

  async clearHandoff(name) {
    const plan = await this.getPlan(name);
    plan.handoff = null;
    await this.savePlan(plan);
    return plan;
  }

  async deletePlan(name) {
    const planPath = this.planPath(name);
    try {
      await fs.unlink(planPath);
      return { deleted: name };
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`Plan "${name}" not found`);
      }
      throw err;
    }
  }
}
