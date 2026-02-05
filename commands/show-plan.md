---
name: show-plan
description: Show a plan's contents and status
arguments: $ARGUMENTS
mcp_server: todoloo
---

# Show Plan

Display a plan's full contents including items and handoff notes.

## Usage

```
/todoloo:show-plan <name>
```

## Examples

```
/todoloo:show-plan auth-refactor
/todoloo:show-plan api-migration
```

## Implementation

Use `$ARGUMENTS` as the plan name.

Call `get_plan` MCP tool:
```json
{
  "name": "$ARGUMENTS"
}
```

Display the plan in a readable format:
- Plan name and description
- Handoff notes (if present) - highlighted since this is important context
- All items with their status and content
