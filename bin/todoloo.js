#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, '..', 'src', 'index.js');
const pidFile = path.join(os.homedir(), '.todoloo', 'server.pid');
const logFile = path.join(os.homedir(), '.todoloo', 'logs', 'server.log');

const commands = {
  start: async () => {
    // Check if already running
    if (fs.existsSync(pidFile)) {
      const pid = fs.readFileSync(pidFile, 'utf-8').trim();
      try {
        process.kill(parseInt(pid), 0);
        console.log(`Todoloo already running (PID ${pid})`);
        return;
      } catch {
        // Process not running, clean up stale PID file
        fs.unlinkSync(pidFile);
      }
    }

    // Ensure log directory exists
    const logDir = path.dirname(logFile);
    fs.mkdirSync(logDir, { recursive: true });

    // Start server in background
    const out = fs.openSync(logFile, 'a');
    const child = spawn('node', [srcPath], {
      detached: true,
      stdio: ['ignore', out, out]
    });

    fs.writeFileSync(pidFile, String(child.pid));
    child.unref();

    console.log(`Todoloo started (PID ${child.pid})`);
    console.log(`Logs: ${logFile}`);
  },

  stop: async () => {
    if (!fs.existsSync(pidFile)) {
      console.log('Todoloo is not running');
      return;
    }

    const pid = fs.readFileSync(pidFile, 'utf-8').trim();
    try {
      process.kill(parseInt(pid), 'SIGTERM');
      fs.unlinkSync(pidFile);
      console.log('Todoloo stopped');
    } catch {
      console.log('Todoloo is not running');
      fs.unlinkSync(pidFile);
    }
  },

  status: async () => {
    if (!fs.existsSync(pidFile)) {
      console.log('Todoloo is not running');
      return;
    }

    const pid = fs.readFileSync(pidFile, 'utf-8').trim();
    try {
      process.kill(parseInt(pid), 0);
      console.log(`Todoloo is running (PID ${pid})`);
    } catch {
      console.log('Todoloo is not running (stale PID file)');
      fs.unlinkSync(pidFile);
    }
  },

  open: async () => {
    const port = process.env.TODOLOO_PORT || 3456;
    const url = `http://localhost:${port}`;

    const cmd = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';

    exec(`${cmd} ${url}`);
    console.log(`Opening ${url}`);
  },

  logs: async () => {
    if (!fs.existsSync(logFile)) {
      console.log('No logs found');
      return;
    }

    const child = spawn('tail', ['-f', logFile], {
      stdio: 'inherit'
    });

    process.on('SIGINT', () => {
      child.kill();
      process.exit(0);
    });
  },

  help: async () => {
    console.log(`
Todoloo - Global task inbox for Claude Code

Usage: todoloo <command>

Commands:
  start   Start the server in background
  stop    Stop the server
  status  Check if server is running
  open    Open web UI in browser
  logs    Tail server logs
  help    Show this help message
`);
  }
};

const command = process.argv[2] || 'help';
const handler = commands[command];

if (!handler) {
  console.error(`Unknown command: ${command}`);
  commands.help();
  process.exit(1);
}

handler().catch(err => {
  console.error(err);
  process.exit(1);
});
