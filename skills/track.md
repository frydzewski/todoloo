---
name: track
description: Add a task to Todoloo inbox
mcp_server: todoloo
---

# Track Task

Add a task to your global Todoloo inbox.

## Usage

```
/todoloo:track "Task description" [--priority high|medium|low] [--tag tagname] [--due YYYY-MM-DD]
```

## Examples

```
/todoloo:track "Call Jordan at 3pm"
/todoloo:track "Review PR #123" --priority high --tag work
/todoloo:track "Buy groceries" --due 2024-02-06 --tag personal
```

## Implementation

Parse the command and call the `add_task` MCP tool:

1. Extract description (required, in quotes)
2. Extract --priority (optional, defaults to medium)
3. Extract --tag (optional, can be multiple)
4. Extract --due (optional)

Call MCP tool:
```json
{
  "tool": "add_task",
  "arguments": {
    "description": "<extracted>",
    "priority": "<extracted or medium>",
    "tags": ["<extracted>"],
    "due": "<extracted or null>"
  }
}
```

Respond with confirmation: "Added: <task description> #tags !priority"
