---
name: add
description: Quick add a task to your inbox
arguments: $ARGUMENTS
mcp_server: todoloo
---

# Quick Add Task

Add a task to your Todoloo inbox.

## Usage

```
/todoloo:add <description> [--priority high|medium|low] [--tag <tag>] [--due YYYY-MM-DD]
```

## Examples

```
/todoloo:add Call Jordan at 3pm
/todoloo:add Review PR #123 --priority high --tag work
/todoloo:add Buy groceries --due 2024-02-06
```

## Implementation

Parse `$ARGUMENTS`:
1. Extract the description (everything before flags, or in quotes)
2. Extract `--priority` (optional, default: medium)
3. Extract `--tag` (optional, can appear multiple times)
4. Extract `--due` (optional)

Call `add_task` MCP tool:
```json
{
  "description": "<parsed description>",
  "priority": "<parsed or medium>",
  "tags": ["<parsed tags>"],
  "due": "<parsed or null>"
}
```

Respond: "Added: <description>" with any tags/priority/due shown.
