---
name: list
description: List tasks from your inbox
mcp_server: todoloo
---

# List Tasks

Show tasks from your Todoloo inbox.

## Usage

```
/todoloo:list [--status open|completed] [--tag tagname] [--priority high|medium|low]
```

## Examples

```
/todoloo:list
/todoloo:list --status open
/todoloo:list --tag work --priority high
```

## Implementation

Call the `list_tasks` MCP tool with any provided filters.

Display results in a readable format:
- [id] Description @due #tags !priority
