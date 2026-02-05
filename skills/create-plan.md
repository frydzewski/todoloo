---
name: create-plan
description: Create a new named plan
mcp_server: todoloo
---

# Create Plan

Create a new named plan for tracking work.

## Usage

```
/todoloo:create-plan <name> [--description "Plan description"]
```

## Examples

```
/todoloo:create-plan auth-refactor
/todoloo:create-plan api-migration --description "Migrate to v2 API"
```

## Implementation

Call the `create_plan` MCP tool with the name and optional description.

Respond with confirmation: "Created plan: <name>"
