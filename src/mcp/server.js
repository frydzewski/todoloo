import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export function createMcpServer(taskService, planService) {
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
    },
    // Plan tools
    {
      name: 'create_plan',
      description: 'Create a new named plan for tracking work',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Plan name (used as identifier)' },
          description: { type: 'string', description: 'Optional description of the plan' }
        },
        required: ['name']
      }
    },
    {
      name: 'get_plan',
      description: 'Get a plan by name, including all items and handoff notes',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Plan name' }
        },
        required: ['name']
      }
    },
    {
      name: 'add_plan_item',
      description: 'Add content to a plan - can be large text, markdown, or structured content',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Plan name' },
          content: { type: 'string', description: 'Content to add (can be large text, markdown, etc.)' },
          position: { type: 'string', enum: ['top', 'bottom'], description: 'Where to add (default: bottom)' }
        },
        required: ['name', 'content']
      }
    },
    {
      name: 'update_plan_item',
      description: 'Update a plan item status or content',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Plan name' },
          item_id: { type: 'string', description: 'Item ID to update' },
          content: { type: 'string', description: 'New content (optional)' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'done', 'skipped'], description: 'New status' }
        },
        required: ['name', 'item_id']
      }
    },
    {
      name: 'remove_plan_item',
      description: 'Remove an item from a plan',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Plan name' },
          item_id: { type: 'string', description: 'Item ID to remove' }
        },
        required: ['name', 'item_id']
      }
    },
    {
      name: 'list_plans',
      description: 'List all plans with summary info',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'handoff',
      description: 'Record handoff notes for a plan - use when stopping work to document current state',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Plan name' },
          notes: { type: 'string', description: 'Current state notes - what was done, where you stopped' },
          instruction: { type: 'string', description: 'Instructions for resuming - what to do next' },
          context: { type: 'object', description: 'Optional structured context (current file, line, etc.)' }
        },
        required: ['name', 'notes']
      }
    },
    {
      name: 'clear_handoff',
      description: 'Clear handoff notes from a plan (after resuming work)',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Plan name' }
        },
        required: ['name']
      }
    },
    {
      name: 'delete_plan',
      description: 'Delete a plan',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Plan name' }
        },
        required: ['name']
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
    },
    // Plan handlers
    create_plan: async (args) => {
      const plan = await planService.createPlan(args);
      return { content: [{ type: 'text', text: `Created plan: ${plan.name}` }] };
    },
    get_plan: async (args) => {
      const plan = await planService.getPlan(args.name);
      return { content: [{ type: 'text', text: formatPlan(plan) }] };
    },
    add_plan_item: async (args) => {
      const { plan, item } = await planService.addPlanItem(args.name, {
        content: args.content,
        position: args.position
      });
      return { content: [{ type: 'text', text: `Added item [${item.id}] to plan "${plan.name}"` }] };
    },
    update_plan_item: async (args) => {
      const { plan, item } = await planService.updatePlanItem(args.name, args.item_id, {
        content: args.content,
        status: args.status
      });
      return { content: [{ type: 'text', text: `Updated item [${item.id}] in plan "${plan.name}" - status: ${item.status}` }] };
    },
    remove_plan_item: async (args) => {
      const { plan, removed } = await planService.removePlanItem(args.name, args.item_id);
      return { content: [{ type: 'text', text: `Removed item [${removed.id}] from plan "${plan.name}"` }] };
    },
    list_plans: async () => {
      const plans = await planService.listPlans();
      if (plans.length === 0) {
        return { content: [{ type: 'text', text: 'No plans found.' }] };
      }
      const text = plans.map(p => {
        let line = `[${p.name}] ${p.description || '(no description)'}`;
        line += ` - ${p.pendingCount}/${p.itemCount} pending`;
        if (p.hasHandoff) line += ' (has handoff)';
        return line;
      }).join('\n');
      return { content: [{ type: 'text', text }] };
    },
    handoff: async (args) => {
      const plan = await planService.handoff(args.name, {
        notes: args.notes,
        instruction: args.instruction,
        context: args.context
      });
      return { content: [{ type: 'text', text: `Handoff recorded for plan "${plan.name}"` }] };
    },
    clear_handoff: async (args) => {
      const plan = await planService.clearHandoff(args.name);
      return { content: [{ type: 'text', text: `Handoff cleared for plan "${plan.name}"` }] };
    },
    delete_plan: async (args) => {
      await planService.deletePlan(args.name);
      return { content: [{ type: 'text', text: `Deleted plan "${args.name}"` }] };
    }
  };

  function formatPlan(plan) {
    let text = `# Plan: ${plan.name}\n`;
    if (plan.description) text += `${plan.description}\n`;
    text += `\nCreated: ${plan.created}\nUpdated: ${plan.updated}\n`;

    if (plan.handoff) {
      text += `\n## Handoff (${plan.handoff.timestamp})\n`;
      text += `**Notes:** ${plan.handoff.notes}\n`;
      if (plan.handoff.instruction) {
        text += `**Resume instructions:** ${plan.handoff.instruction}\n`;
      }
      if (plan.handoff.context && Object.keys(plan.handoff.context).length > 0) {
        text += `**Context:** ${JSON.stringify(plan.handoff.context)}\n`;
      }
    }

    text += `\n## Items (${plan.items.length})\n`;
    if (plan.items.length === 0) {
      text += '(no items)\n';
    } else {
      for (const item of plan.items) {
        const status = item.status === 'done' ? '[x]' :
                       item.status === 'in_progress' ? '[~]' :
                       item.status === 'skipped' ? '[-]' : '[ ]';
        text += `\n${status} [${item.id}]\n${item.content}\n`;
      }
    }

    return text;
  }

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

      server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools
      }));

      server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        return toolHandlers[name](args);
      });

      const transport = new StdioServerTransport();
      await server.connect(transport);
    }
  };
}
