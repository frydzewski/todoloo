# Todoloo

Global task inbox and planning system for Claude Code. Track tasks across projects, create persistent plans, and hand off work between sessions with MCP integration.

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

### Task Commands

| Command | Description |
|---------|-------------|
| `/todoloo:inbox` | Dashboard view of your inbox |
| `/todoloo:add <text>` | Quick add a task |
| `/todoloo:list` | List tasks with filters |
| `/todoloo:done <id>` | Mark a task complete |
| `/todoloo:search <query>` | Search tasks |
| `/todoloo:update <id>` | Update a task |
| `/todoloo:delete <id>` | Delete a task |

### Plan Commands

Plans are persistent, named containers for tracking multi-step work. They support handoffs between sessions.

| Command | Description |
|---------|-------------|
| `/todoloo:create-plan <name>` | Create a new plan |
| `/todoloo:plan <name> <content>` | Add content to a plan (supports large text/markdown) |
| `/todoloo:show-plan <name>` | View a plan's contents |
| `/todoloo:plans` | List all plans |
| `/todoloo:plan-done <name> <id>` | Mark a plan item as done |
| `/todoloo:handoff <name> <notes>` | Record handoff notes before stopping |
| `/todoloo:resume <name>` | Resume work on a plan (shows and clears handoff) |
| `/todoloo:delete-plan <name>` | Delete a plan |

### Examples

**Tasks:**
```
/todoloo:inbox
/todoloo:add Review PR #123 --priority high --tag work
/todoloo:done abc12345
```

**Plans:**
```
/todoloo:create-plan auth-refactor Refactor authentication system
/todoloo:plan auth-refactor ## Phase 1
- Add OAuth2 provider
- Configure redirect URLs
- Update middleware

/todoloo:show-plan auth-refactor
/todoloo:handoff auth-refactor Completed OAuth2 setup. Next: implement middleware. Tests passing.
/todoloo:resume auth-refactor
```

### MCP Tools

**Task Tools:**
| Tool | Description |
|------|-------------|
| `add_task` | Add a new task to the inbox |
| `list_tasks` | List tasks with optional filters |
| `complete_task` | Mark a task as completed |
| `delete_task` | Delete a task |
| `update_task` | Update a task |
| `search_tasks` | Search tasks by text |
| `split_task` | Split a task into subtasks |

**Plan Tools:**
| Tool | Description |
|------|-------------|
| `create_plan` | Create a new named plan |
| `get_plan` | Get a plan with all items and handoff |
| `add_plan_item` | Add content to a plan |
| `update_plan_item` | Update item status/content |
| `remove_plan_item` | Remove an item from a plan |
| `list_plans` | List all plans with summaries |
| `handoff` | Record handoff notes |
| `clear_handoff` | Clear handoff after resuming |
| `delete_plan` | Delete a plan |

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
