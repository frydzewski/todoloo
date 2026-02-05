---
name: update
description: Update an existing task
mcp_server: todoloo
---

# Update Task

Update a task in your Todoloo inbox.

## Usage

```
/todoloo:update <task-id> [--description "new text"] [--priority high|medium|low] [--tag tagname] [--due YYYY-MM-DD]
```

## Examples

```
/todoloo:update abc12345 --priority high
/todoloo:update abc12345 --description "Updated task text" --due 2024-02-10
```

## Implementation

Call the `update_task` MCP tool with the task ID and updated fields.

Respond with confirmation: "Updated: <task description>"
