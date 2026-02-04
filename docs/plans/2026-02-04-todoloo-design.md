# Todoloo Design

A global task inbox for Claude Code. Capture tasks without breaking flow, review them later via web UI.

## Overview

**Problem**: You're deep in a coding task when something unrelated pops up - "call Jordan at 3pm", "review that PR", "buy groceries". You need to capture it instantly without losing context.

**Solution**: Todoloo - an MCP server that Claude Code can write to, plus a web UI for review and management. One command, task captured, back to work.

## Core Workflow

```
You: /todoloo:track "Call Jordan at 3pm" --priority high --tag personal
Claude: Added: Call Jordan at 3pm #personal !high

...continue coding...
```

Later, open `http://localhost:3456` to review, edit, complete, or delete tasks.

## Data Model

### Storage

Single markdown file: `~/.todoloo/todos.md`

### Task Format

```markdown
- [ ] Call Jordan @2024-02-05T15:00 #personal !high <!-- id:abc123 -->
- [x] Review PR for auth fix #work !medium <!-- id:def456 -->
- [ ] Buy groceries @2024-02-06 #personal !low <!-- id:ghi789 -->
```

**Field syntax**:
| Field | Syntax | Required | Default |
|-------|--------|----------|---------|
| Status | `- [ ]` / `- [x]` | Yes | `[ ]` |
| Description | Free text | Yes | - |
| Due date/time | `@YYYY-MM-DDTHH:MM` or `@YYYY-MM-DD` | No | None |
| Tags | `#tagname` (multiple allowed) | No | None |
| Priority | `!high` / `!medium` / `!low` | No | `!medium` |
| ID | `<!-- id:xxx -->` | Auto-generated | - |

### File Structure

```markdown
# Todoloo

## Inbox
- [ ] New tasks land here...

## Completed
- [x] Done tasks move here...
```

### Subtasks (Split Tasks)

When a task is split into subtasks:

```markdown
## Build auth system <!-- id:abc123 status:split -->
- [ ] Set up OAuth <!-- id:def456 parent:abc123 -->
- [ ] Create login page <!-- id:ghi789 parent:abc123 -->
- [ ] Add session handling <!-- id:jkl012 parent:abc123 -->
```

## Architecture

### Single Process Design

One Node.js server handles both MCP and web UI:

```
~/.todoloo/
├── todos.md              # Task data
├── config.json           # Settings (optional)
└── logs/                 # Server logs

Server (installed globally or in project):
├── index.js              # Entry point
├── mcp/                  # MCP tool handlers
├── api/                  # REST endpoints for web UI
├── web/                  # Preact + HTM static files
└── parser.js             # Markdown <-> task objects
```

### Data Flow

```
Claude Code ──MCP──> Tool Handlers ──> Parser ──> todos.md
Web UI ──REST API──> API Handlers ──> Parser ──> todos.md
```

Both paths use the same parser for consistency.

### Ports & Protocols

- **MCP**: stdio (standard Claude Code MCP transport)
- **HTTP**: `localhost:3456` (web UI and REST API)

## MCP Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `add_task` | Create a task | `description`, `priority?`, `tags?`, `due?` |
| `list_tasks` | Get tasks with filters | `status?`, `tag?`, `priority?`, `limit?` |
| `complete_task` | Mark task done | `id` |
| `delete_task` | Remove task | `id` |
| `update_task` | Edit any field | `id`, `description?`, `priority?`, `tags?`, `due?` |
| `search_tasks` | Full-text search | `query` |
| `split_task` | Break into subtasks | `id`, `subtasks[]` |
| `enrich_task` | Fetch external metadata | `id` |

### Tool Examples

**add_task**:
```json
{
  "description": "Call Jordan at 3pm",
  "priority": "high",
  "tags": ["personal"],
  "due": "2024-02-05T15:00"
}
```

**list_tasks**:
```json
{
  "status": "open",
  "tag": "work",
  "limit": 10
}
```

**split_task**:
```json
{
  "id": "abc123",
  "subtasks": [
    "Set up OAuth",
    "Create login page",
    "Add session handling"
  ]
}
```

## Claude Code Skills

Namespaced under `todoloo:` to avoid collisions.

### Primary Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `/todoloo:track` | Add a task | `/todoloo:track "Buy milk" --priority low --tag personal` |
| `/todoloo:tasks` | List open tasks | `/todoloo:tasks` or `/todoloo:tasks --tag work` |
| `/todoloo:done` | Complete a task | `/todoloo:done abc123` or `/todoloo:done "buy milk"` |
| `/todoloo:split` | Break into subtasks | `/todoloo:split abc123` |
| `/todoloo:search` | Find tasks | `/todoloo:search "jordan"` |

### Aliases (Optional)

| Alias | Full Command |
|-------|--------------|
| `/todoloo:t` | `/todoloo:track` |
| `/todoloo:ls` | `/todoloo:tasks` |
| `/todoloo:d` | `/todoloo:done` |

### Skill Behavior

1. Parse command and flags
2. Call appropriate MCP tool
3. Return brief confirmation: "Added: Call Jordan at 3pm #personal !high"

Keep it fast - capture and continue coding.

## Web UI

### Access

`http://localhost:3456`

### Views

- **Inbox** - All open tasks, sortable by priority/due date/tag
- **Today** - Tasks due today + overdue
- **By Tag** - Filter by specific tags
- **Completed** - Archive of done tasks
- **Search** - Full-text search

### Interactions

- Click checkbox → complete task
- Click task text → inline edit
- "Add task" input at top
- Context menu → delete, edit priority, add tags, split
- Drag to reorder (stretch goal)

### Tech Stack

- **Preact + HTM** via CDN (no build step)
- **REST API** on same server
- **Simple CSS** - clean and functional

### Enrichment UI

Tasks with detected patterns show a link icon:
- `PROJ-1234` → Jira ticket
- `PR #42` → GitHub pull request
- Keywords → Confluence search suggestions

Click to fetch metadata, display as clickable chips.

## External Integrations

### URL Auto-Linking

Parser detects patterns and can auto-link:

| Pattern | Service | Example |
|---------|---------|---------|
| `PROJ-1234` | Jira | `https://company.atlassian.net/browse/PROJ-1234` |
| `PR #123` or `#123` in context | GitHub | `https://github.com/org/repo/pull/123` |
| URLs | Direct link | As-is |

### Enrichment via Atlassian MCP

When Atlassian MCP is available:
- **Jira**: Fetch ticket title, status, assignee
- **Confluence**: Search for related pages by task keywords

Enrichment is optional - core functionality works without it.

## Operations

### Auto-Start (macOS)

LaunchAgent at `~/Library/LaunchAgents/com.todoloo.server.plist`:
- Starts on login
- Restarts on crash
- Logs to `~/.todoloo/logs/`

### CLI Commands

```bash
todoloo start       # Start server
todoloo stop        # Stop server
todoloo status      # Check if running
todoloo open        # Open web UI in browser
todoloo logs        # Tail server logs
```

### Backup

`todos.md` is just a file - trivially:
- Git tracked
- Synced via iCloud/Dropbox
- Backed up with any file backup tool

## Configuration

Optional `~/.todoloo/config.json`:

```json
{
  "port": 3456,
  "defaultPriority": "medium",
  "defaultTags": [],
  "jira": {
    "baseUrl": "https://company.atlassian.net",
    "projectKeys": ["PROJ", "ENG"]
  },
  "github": {
    "defaultRepo": "org/repo"
  }
}
```

## Future Considerations

Not in v1, but possible later:
- Due date reminders/notifications
- Recurring tasks
- Multiple todo files (per-project + global)
- Mobile-friendly PWA
- Sync across machines via git
- Calendar integration

## Summary

Todoloo is a minimal, fast task capture system:
1. **Capture**: `/todoloo:track` from any Claude Code session
2. **Store**: Single markdown file, human-readable
3. **Review**: Web UI at localhost:3456
4. **Integrate**: Optional Jira/GitHub/Confluence enrichment

One process, one file, zero friction.
