---
name: create-plan
description: Create a new named plan
arguments: $ARGUMENTS
mcp_server: todoloo
---

# Create Plan

Create a new named plan for tracking work.

## Usage

```
/todoloo:create-plan <name> [description]
```

## Examples

```
/todoloo:create-plan auth-refactor
/todoloo:create-plan auth-refactor Refactor authentication to use OAuth2
/todoloo:create-plan api-migration Migrate from REST to GraphQL
```

## Implementation

Parse `$ARGUMENTS`:
1. First word is the plan name (required)
2. Everything after is the description (optional)

Call `create_plan` MCP tool:
```json
{
  "name": "<plan name>",
  "description": "<rest of arguments>"
}
```

Respond: "Created plan: <name>"
