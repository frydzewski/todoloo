---
name: list
description: List tasks from your inbox
arguments: $ARGUMENTS
mcp_server: todoloo
---

# List Tasks

Show tasks from your Todoloo inbox.

## Usage

```
/todoloo:list [--status open|completed] [--priority high|medium|low] [--tag <tag>] [--limit <n>]
```

## Examples

```
/todoloo:list
/todoloo:list --status open
/todoloo:list --priority high --tag work
/todoloo:list --status completed --limit 10
```

## Implementation

Parse `$ARGUMENTS` for optional filters:
- `--status`: Filter by open or completed
- `--priority`: Filter by priority level
- `--tag`: Filter by tag
- `--limit`: Max number of tasks to return

Call `list_tasks` MCP tool with parsed filters.

Display results as a formatted list:
```
[ ] [id] Description @due #tags !priority
[x] [id] Completed task
```

If no tasks found, say "No tasks found."
