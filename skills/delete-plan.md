---
name: delete-plan
description: Delete a plan
mcp_server: todoloo
---

# Delete Plan

Delete a plan from Todoloo.

## Usage

```
/todoloo:delete-plan <name>
```

## Examples

```
/todoloo:delete-plan old-project
```

## Implementation

Call the `delete_plan` MCP tool with the plan name.

Respond with confirmation: "Deleted plan: <name>"
