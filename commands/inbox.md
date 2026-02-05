---
name: inbox
description: Show inbox summary dashboard
mcp_server: todoloo
---

# Inbox Dashboard

Show a summary of your Todoloo inbox.

## Usage

```
/todoloo:inbox
```

## Implementation

Call `list_tasks` MCP tool twice:
1. First with `{"status": "open"}` to get open tasks
2. Then with `{"status": "completed", "limit": 5}` to get recent completions

Display a dashboard:

```
## Todoloo Inbox

### Open Tasks (X)

**High Priority**
- [id] Task description @due #tags

**Medium Priority**
- [id] Task description

**Low Priority**
- [id] Task description

### Recently Completed
- [x] [id] Task description (completed)

---
Quick actions: /todoloo:add, /todoloo:done <id>
```

Group open tasks by priority. Show counts. If inbox is empty, show a friendly "Inbox zero!" message.
