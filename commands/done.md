---
name: done
description: Mark a task as complete
arguments: $ARGUMENTS
mcp_server: todoloo
---

# Complete Task

Mark a task as done.

## Usage

```
/todoloo:done <id>
/todoloo:done "<search text>"
```

## Examples

```
/todoloo:done abc123
/todoloo:done "call jordan"
```

## Implementation

Parse `$ARGUMENTS`:
- If it looks like an ID (alphanumeric, ~8 chars), use directly
- If it's text (especially in quotes), first call `search_tasks` to find the task

Call `complete_task` MCP tool:
```json
{
  "id": "<task id>"
}
```

Respond: "Completed: <task description>"

If search text matches multiple tasks, list them and ask user to specify the ID.
