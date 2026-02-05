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
