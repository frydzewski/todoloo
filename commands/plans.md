---
name: plans
description: List all plans
mcp_server: todoloo
---

# List Plans

Show all plans with summary info.

## Usage

```
/todoloo:plans
```

## Implementation

Call `list_plans` MCP tool.

Display plans in a table format:
```
| Plan | Description | Progress | Handoff |
|------|-------------|----------|---------|
| auth-refactor | Refactor auth | 2/5 pending | Yes |
| api-migration | REST to GraphQL | 0/3 pending | No |
```

If no plans exist, show a helpful message about creating one.
