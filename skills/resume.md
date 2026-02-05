---
name: resume
description: Resume work on a plan - shows handoff and clears it
mcp_server: todoloo
---

# Resume Plan

Resume work on a plan. Shows handoff notes and clears them.

## Usage

```
/todoloo:resume <plan-name>
```

## Examples

```
/todoloo:resume auth-refactor
```

## Implementation

1. Call `get_plan` to retrieve the plan and handoff notes
2. Display the handoff context prominently:
   - What was done
   - Where work stopped
   - What to do next
3. Call `clear_handoff` to clear the notes
4. Show the plan items with their status

Ready to continue working!
