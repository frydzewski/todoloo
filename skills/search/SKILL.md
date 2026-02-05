---
name: search
description: Search tasks by text
mcp_server: todoloo
---

# Search Tasks

Search your Todoloo inbox by text.

## Usage

```
/todoloo:search <query>
```

## Examples

```
/todoloo:search meeting
/todoloo:search PR review
```

## Implementation

Call the `search_tasks` MCP tool with the query.

Display matching results in a readable format:
- [id] Description @due #tags !priority
