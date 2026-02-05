---
name: delete
description: Delete a task
mcp_server: todoloo
---

# Delete Task

Delete a task from your Todoloo inbox.

## Usage

```
/todoloo:delete <task-id>
/todoloo:delete "<partial description>"
```

## Examples

```
/todoloo:delete abc12345
/todoloo:delete "old meeting"
```

## Implementation

If argument looks like an ID (8 alphanumeric chars), call `delete_task` directly.

If argument is text, first call `search_tasks` to find matching task, confirm with user, then delete.

Respond with confirmation: "Deleted: <task description>"
