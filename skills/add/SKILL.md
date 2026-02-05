---
name: add
description: Quick add a task to your inbox
mcp_server: todoloo
---

# Add Task

Quick add a task to your Todoloo inbox.

## Usage

```
/todoloo:add <description> [--priority high|medium|low] [--tag tagname] [--due YYYY-MM-DD]
```

## Examples

```
/todoloo:add Call Jordan at 3pm
/todoloo:add Review PR #123 --priority high --tag work
/todoloo:add Buy groceries --due 2024-02-06
```

## Implementation

Call the `add_task` MCP tool with provided arguments.

Respond with confirmation: "Added: <task description>"
