---
name: plan-done
description: Mark a plan item as done
arguments: $ARGUMENTS
mcp_server: todoloo
---

# Mark Plan Item Done

Mark an item in a plan as completed.

## Usage

```
/todoloo:plan-done <plan-name> <item-id>
```

## Examples

```
/todoloo:plan-done auth-refactor abc12345
```

## Implementation

Parse `$ARGUMENTS`:
1. First word is the plan name
2. Second word is the item ID

Call `update_plan_item` MCP tool:
```json
{
  "name": "<plan name>",
  "item_id": "<item id>",
  "status": "done"
}
```

Respond with confirmation.
