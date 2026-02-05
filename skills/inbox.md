---
name: inbox
description: Show inbox summary dashboard
mcp_server: todoloo
---

# Inbox Dashboard

Show a summary dashboard of your Todoloo inbox.

## Usage

```
/todoloo:inbox
```

## Implementation

1. Call `list_tasks` with status "open" to get all open tasks
2. Group and display by priority:

**High Priority**
- [ ] Task 1
- [ ] Task 2

**Medium Priority**
- [ ] Task 3

**Low Priority**
- [ ] Task 4

Show counts: "X open tasks (Y high, Z due today)"
