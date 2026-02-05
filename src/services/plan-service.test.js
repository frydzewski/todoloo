import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlanService } from './plan-service.js';
import { Storage } from '../storage/storage.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('PlanService', () => {
  let planService;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `todoloo-test-${Date.now()}`);
    const storage = new Storage(testDir);
    planService = new PlanService(storage);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('createPlan', () => {
    it('creates a new plan', async () => {
      const plan = await planService.createPlan({ name: 'test-plan', description: 'A test plan' });
      expect(plan.name).toBe('test-plan');
      expect(plan.description).toBe('A test plan');
      expect(plan.items).toEqual([]);
      expect(plan.handoff).toBeNull();
    });

    it('throws if plan already exists', async () => {
      await planService.createPlan({ name: 'test-plan' });
      await expect(planService.createPlan({ name: 'test-plan' })).rejects.toThrow('already exists');
    });
  });

  describe('addPlanItem', () => {
    it('adds items to a plan', async () => {
      await planService.createPlan({ name: 'test-plan' });
      const { plan, item } = await planService.addPlanItem('test-plan', {
        content: '## Step 1\nDo something important'
      });
      expect(plan.items).toHaveLength(1);
      expect(item.content).toBe('## Step 1\nDo something important');
      expect(item.status).toBe('pending');
    });

    it('supports adding at top', async () => {
      await planService.createPlan({ name: 'test-plan' });
      await planService.addPlanItem('test-plan', { content: 'First' });
      await planService.addPlanItem('test-plan', { content: 'Second', position: 'top' });
      const plan = await planService.getPlan('test-plan');
      expect(plan.items[0].content).toBe('Second');
      expect(plan.items[1].content).toBe('First');
    });
  });

  describe('updatePlanItem', () => {
    it('updates item status', async () => {
      await planService.createPlan({ name: 'test-plan' });
      const { item } = await planService.addPlanItem('test-plan', { content: 'Task' });
      const result = await planService.updatePlanItem('test-plan', item.id, { status: 'done' });
      expect(result.item.status).toBe('done');
    });
  });

  describe('handoff', () => {
    it('records handoff notes', async () => {
      await planService.createPlan({ name: 'test-plan' });
      const plan = await planService.handoff('test-plan', {
        notes: 'Stopped at step 3',
        instruction: 'Continue from middleware'
      });
      expect(plan.handoff.notes).toBe('Stopped at step 3');
      expect(plan.handoff.instruction).toBe('Continue from middleware');
    });

    it('clears handoff', async () => {
      await planService.createPlan({ name: 'test-plan' });
      await planService.handoff('test-plan', { notes: 'Some notes' });
      const plan = await planService.clearHandoff('test-plan');
      expect(plan.handoff).toBeNull();
    });
  });

  describe('listPlans', () => {
    it('lists all plans with summary', async () => {
      await planService.createPlan({ name: 'plan-a', description: 'First' });
      await planService.createPlan({ name: 'plan-b', description: 'Second' });
      await planService.addPlanItem('plan-a', { content: 'Item 1' });
      await planService.addPlanItem('plan-a', { content: 'Item 2' });

      const plans = await planService.listPlans();
      expect(plans).toHaveLength(2);
      const planA = plans.find(p => p.name === 'plan-a');
      expect(planA.itemCount).toBe(2);
      expect(planA.pendingCount).toBe(2);
    });
  });

  describe('deletePlan', () => {
    it('deletes a plan', async () => {
      await planService.createPlan({ name: 'test-plan' });
      await planService.deletePlan('test-plan');
      await expect(planService.getPlan('test-plan')).rejects.toThrow('not found');
    });
  });
});
