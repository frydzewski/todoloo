---
name: plan-done
description: Mark a plan item as done
mcp_server: todoloo
---

# Complete Plan Item

Mark a plan item as done.

## Usage

```
/todoloo:plan-done <plan-name> <item-id>
```

## Examples

```
/todoloo:plan-done auth-refactor item-123
```

## Implementation

Call the `update_plan_item` MCP tool with status "done".

Respond with confirmation: "Completed: <item content>"
