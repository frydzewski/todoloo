---
name: plan
description: Add content to a plan
mcp_server: todoloo
---

# Add to Plan

Add content to an existing plan.

## Usage

```
/todoloo:plan <name> <content>
```

## Examples

```
/todoloo:plan auth-refactor "Implement JWT validation"
/todoloo:plan api-migration "- Step 1: Update endpoints\n- Step 2: Test"
```

## Implementation

Call the `add_plan_item` MCP tool with the plan name and content.

Respond with confirmation: "Added to <name>: <content preview>"
