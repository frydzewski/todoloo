# Todoloo

Global task inbox for Claude Code. Track tasks across all your projects with MCP integration.

## Installation

### As a Claude Code Plugin

Add this marketplace to Claude Code:

```bash
/plugin add-marketplace https://github.com/frydzewski/todoloo
```

Then install the plugin:

```bash
/plugin install todoloo@todoloo
```

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/frydzewski/todoloo.git
   cd todoloo
   npm install
   ```

2. Add to your Claude Code MCP config (`~/.claude.json` or project `.mcp.json`):
   ```json
   {
     "mcpServers": {
       "todoloo": {
         "command": "node",
         "args": ["src/index.js", "mcp"],
         "cwd": "/path/to/todoloo"
       }
     }
   }
   ```

## Usage

### Slash Commands

Once installed, use these commands in Claude Code:

- `/todoloo:track "Task description"` - Add a new task
- `/todoloo:tasks` - List your tasks
- `/todoloo:done <id>` - Mark a task complete

### Examples

```
/todoloo:track "Review PR #123" --priority high --tag work
/todoloo:tasks --status open
/todoloo:done abc12345
```

### MCP Tools

The following MCP tools are available:

| Tool | Description |
|------|-------------|
| `add_task` | Add a new task to the inbox |
| `list_tasks` | List tasks with optional filters |
| `complete_task` | Mark a task as completed |
| `delete_task` | Delete a task |
| `update_task` | Update a task |
| `search_tasks` | Search tasks by text |
| `split_task` | Split a task into subtasks |

## Data Storage

Tasks are stored in `~/.todoloo/` by default. Set `TODOLOO_DIR` environment variable to customize.

## HTTP Mode

Todoloo also includes an HTTP server for web access:

```bash
npm start
# or
node src/index.js http
```

Access at http://localhost:3456

## Development

```bash
npm test        # Run tests
npm run test:watch  # Watch mode
```

## License

MIT
