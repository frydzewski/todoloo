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
