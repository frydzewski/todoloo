---
name: delete-plan
description: Delete a plan
arguments: $ARGUMENTS
mcp_server: todoloo
---

# Delete Plan

Permanently delete a plan and all its items.

## Usage

```
/todoloo:delete-plan <name>
```

## Examples

```
/todoloo:delete-plan auth-refactor
```

## Implementation

Use `$ARGUMENTS` as the plan name.

Call `delete_plan` MCP tool:
```json
{
  "name": "$ARGUMENTS"
}
```

Respond confirming deletion.
