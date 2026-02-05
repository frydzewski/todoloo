---
name: handoff
description: Record handoff notes for a plan
arguments: $ARGUMENTS
mcp_server: todoloo
---

# Handoff

Record handoff notes when stopping work on a plan. This captures the current state so work can be resumed later - by you or another Claude session.

## Usage

```
/todoloo:handoff <name> <notes>
```

## Examples

```
/todoloo:handoff auth-refactor Completed OAuth2 setup, stopped at middleware implementation. Tests passing.

/todoloo:handoff api-migration ## Current State
- Finished schema design
- 3 resolvers implemented
- Stopped mid-way through User resolver

## Next Steps
- Complete User resolver
- Add authentication to mutations
- Update client queries

## Notes
The GraphQL playground is running on port 4000 for testing.
```

## Implementation

Parse `$ARGUMENTS`:
1. First word is the plan name (required)
2. Everything after is the handoff notes (can be large, structured markdown)

Call `handoff` MCP tool:
```json
{
  "name": "<plan name>",
  "notes": "<everything after plan name>"
}
```

Respond confirming the handoff was recorded. Remind that `/todoloo:show-plan <name>` will show the handoff when resuming.
