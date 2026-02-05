---
name: show-plan
description: Show a plan's contents and status
mcp_server: todoloo
---

# Show Plan

Display a plan's contents, items, and status.

## Usage

```
/todoloo:show-plan <name>
```

## Examples

```
/todoloo:show-plan auth-refactor
```

## Implementation

Call the `get_plan` MCP tool with the plan name.

Display the plan with items and their status:
- [x] Completed item
- [ ] Pending item
- [~] In progress item

If handoff notes exist, show them prominently.
