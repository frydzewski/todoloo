import path from 'path';
import os from 'os';
import { Storage } from './storage/storage.js';
import { TaskService } from './services/task-service.js';
import { PlanService } from './services/plan-service.js';
import { createMcpServer } from './mcp/server.js';
import { createHttpServer } from './http/server.js';

const DEFAULT_PORT = 3456;
const DEFAULT_DIR = path.join(os.homedir(), '.todoloo');

async function main() {
  const baseDir = process.env.TODOLOO_DIR || DEFAULT_DIR;
  const port = parseInt(process.env.TODOLOO_PORT || DEFAULT_PORT);
  const mode = process.argv[2] || 'http'; // 'http' or 'mcp'

  const storage = new Storage(baseDir);
  const taskService = new TaskService(storage);
  const planService = new PlanService(storage);

  if (mode === 'mcp') {
    // MCP mode - communicate via stdio
    const mcpServer = createMcpServer(taskService, planService);
    await mcpServer.start();
    console.error('Todoloo MCP server started');
  } else {
    // HTTP mode - serve web UI
    const app = createHttpServer(taskService);
    app.listen(port, () => {
      console.log(`Todoloo running at http://localhost:${port}`);
      console.log(`Data directory: ${baseDir}`);
    });
  }
}

main().catch(err => {
  console.error('Failed to start Todoloo:', err);
  process.exit(1);
});
