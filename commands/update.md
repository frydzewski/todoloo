---
name: update
description: Update an existing task
arguments: $ARGUMENTS
mcp_server: todoloo
---

# Update Task

Modify an existing task in your Todoloo inbox.

## Usage

```
/todoloo:update <id> [--description <text>] [--priority high|medium|low] [--tag <tag>] [--due YYYY-MM-DD]
```

## Examples

```
/todoloo:update abc123 --priority high
/todoloo:update abc123 --description "Updated task text"
/todoloo:update abc123 --due 2024-02-10 --tag urgent
```

## Implementation

Parse `$ARGUMENTS`:
1. First token is the task ID (required)
2. Extract `--description` (optional)
3. Extract `--priority` (optional)
4. Extract `--tag` (optional, replaces existing tags)
5. Extract `--due` (optional)

Call `update_task` MCP tool:
```json
{
  "id": "<task id>",
  "description": "<if provided>",
  "priority": "<if provided>",
  "tags": ["<if provided>"],
  "due": "<if provided>"
}
```

Respond: "Updated: <task description>" showing the new state.
