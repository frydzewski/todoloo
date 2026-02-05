---
name: plan
description: Add content to a plan
arguments: $ARGUMENTS
mcp_server: todoloo
---

# Add to Plan

Add content to an existing plan. Content can be large - entire markdown documents, code blocks, structured text, etc.

## Usage

```
/todoloo:plan <name> <content>
```

## Examples

```
/todoloo:plan auth-refactor Add OAuth2 provider configuration

/todoloo:plan auth-refactor ## Step 1: Setup
- Configure OAuth2 provider
- Add client credentials
- Set up redirect URLs

## Step 2: Implementation
- Add authentication middleware
- Update user session handling

/todoloo:plan api-migration ```
// Migration checklist
1. Audit existing REST endpoints
2. Design GraphQL schema
3. Implement resolvers
4. Update client code
```
```

## Implementation

Parse `$ARGUMENTS`:
1. First word is the plan name (required)
2. Everything after the first word is the content (can be very large, multi-line, markdown, etc.)

Call `add_plan_item` MCP tool:
```json
{
  "name": "<plan name>",
  "content": "<everything after plan name - preserve formatting>"
}
```

Respond with confirmation showing the item was added.
