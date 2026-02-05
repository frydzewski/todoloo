---
name: search
description: Search tasks by text
arguments: $ARGUMENTS
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
/todoloo:search jordan
/todoloo:search "PR review"
/todoloo:search groceries
```

## Implementation

Use `$ARGUMENTS` as the search query.

Call `search_tasks` MCP tool:
```json
{
  "query": "$ARGUMENTS"
}
```

Display matching tasks as a formatted list:
```
[id] Description @due #tags !priority
```

If no matches, say "No tasks matching '<query>' found."
