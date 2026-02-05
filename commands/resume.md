---
name: resume
description: Resume work on a plan - shows handoff and clears it
arguments: $ARGUMENTS
mcp_server: todoloo
---

# Resume Plan

Resume work on a plan. Shows the full plan including handoff notes, then clears the handoff to indicate work has resumed.

## Usage

```
/todoloo:resume <name>
```

## Examples

```
/todoloo:resume auth-refactor
```

## Implementation

Parse `$ARGUMENTS` as the plan name.

1. First, call `get_plan` to retrieve and display the plan:
```json
{
  "name": "$ARGUMENTS"
}
```

2. Display the plan, emphasizing the handoff notes if present

3. If there was a handoff, call `clear_handoff` to mark work as resumed:
```json
{
  "name": "$ARGUMENTS"
}
```

4. Respond with the plan contents and a message like "Handoff cleared - ready to continue"

If no handoff existed, just show the plan normally.
