---
name: plans
description: List all plans
mcp_server: todoloo
---

# List Plans

Show all your Todoloo plans.

## Usage

```
/todoloo:plans
```

## Implementation

Call the `list_plans` MCP tool.

Display each plan with status summary:
- **plan-name**: X pending, Y done (has handoff notes)
