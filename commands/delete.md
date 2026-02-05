---
name: delete
description: Delete a task
arguments: $ARGUMENTS
mcp_server: todoloo
---

# Delete Task

Permanently remove a task from your Todoloo inbox.

## Usage

```
/todoloo:delete <id>
```

## Examples

```
/todoloo:delete abc123
```

## Implementation

Use `$ARGUMENTS` as the task ID.

Call `delete_task` MCP tool:
```json
{
  "id": "$ARGUMENTS"
}
```

Respond: "Deleted task <id>"
