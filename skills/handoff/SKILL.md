---
name: handoff
description: Record handoff notes for a plan
mcp_server: todoloo
---

# Handoff

Record handoff notes when stopping work on a plan. Captures current state for resuming later.

## Usage

```
/todoloo:handoff <plan-name>
```

## Examples

```
/todoloo:handoff auth-refactor
```

## Implementation

1. Prompt for current state: "What was done? Where did you stop?"
2. Prompt for next steps: "What should be done next?"
3. Call the `handoff` MCP tool with notes and instructions

Respond with confirmation showing the recorded handoff.
