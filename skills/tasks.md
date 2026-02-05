---
name: tasks
description: List tasks from Todoloo
mcp_server: todoloo
---

# List Tasks

Show tasks from your Todoloo inbox.

## Usage

```
/todoloo:tasks [--status open|completed] [--tag tagname] [--priority high|medium|low]
```

## Examples

```
/todoloo:tasks
/todoloo:tasks --status open
/todoloo:tasks --tag work --priority high
```

## Implementation

Call the `list_tasks` MCP tool with any provided filters.

Display results in a readable format:
- [id] Description @due #tags !priority
