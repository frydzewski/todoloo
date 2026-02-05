---
name: done
description: Mark a task as complete
mcp_server: todoloo
---

# Complete Task

Mark a Todoloo task as complete.

## Usage

```
/todoloo:done <task-id>
/todoloo:done "<partial description>"
```

## Examples

```
/todoloo:done abc12345
/todoloo:done "call jordan"
```

## Implementation

If argument looks like an ID (8 alphanumeric chars), call `complete_task` directly.

If argument is text, first call `search_tasks` to find matching task, then complete it.

Respond with confirmation: "Completed: <task description>"
