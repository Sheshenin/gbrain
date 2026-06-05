# Agent Context System

Goal: build an agent context layer on top of gbrain for projects, people, companies, tasks, and sessions. GBrain remains the index/retrieval layer; this layer defines stable page structure and agent behavior.

## Directory Structure

```text
profile/
projects/
people/
companies/
resources/
worklog/
tasks/
agent-context/
```

## Page Types

| Path | Purpose |
|---|---|
| `profile/` | Stable user preferences, writing style, permanent operating rules |
| `projects/` | Active projects, status, decisions, related people/docs/tasks |
| `people/` | People profiles, relationship history, related projects/docs |
| `companies/` | Company profiles, offers, decisions, contacts |
| `resources/` | Pointers to source documents, links, datasets, external references |
| `worklog/` | Dated session summaries and important conclusions |
| `tasks/` | Tasks, owners, status, decisions, next actions |
| `agent-context/` | Agent instructions, indexes, briefing templates, commit templates |

## Write Rules

Every context write must include:

| Field | Meaning |
|---|---|
| `date` | ISO date or timestamp |
| `source` | Session, user instruction, document, command, or URL |
| `affected` | Project/person/company/task impacted |
| `what_changed` | Concise factual change |
| `next_action` | Optional, only when there is a real next action |

Do not write everything. Commit only stable facts, decisions, changed statuses, useful summaries, and next actions.

Do not paste large documents into project/person pages. Source documents stay in `resources/` or the Google Drive text mirror; project pages contain conclusions and links.

## Core Commands

These are logical commands. Implement them as agent instructions, gbrain queries, or wrapper scripts.

### `get_project_context(project)`

Returns:

- Project summary
- Current status
- Recent worklog entries
- Related documents/resources
- Related people/companies
- Decisions
- Open tasks and next actions

Query pattern:

```text
project:<project> status decisions tasks resources recent worklog
```

### `get_person_context(person)`

Returns:

- Profile
- Projects
- Interaction history
- Related documents/resources
- Open tasks or promises involving the person

Query pattern:

```text
person:<person> projects interactions decisions tasks documents
```

### `get_document_context(query)`

Returns:

- Relevant source documents
- Short summary
- Citations/paths to text mirror or gbrain pages
- Known limitations if extraction was partial/empty

Query pattern:

```text
document resources source google-drive <query>
```

### `session_briefing(task)`

Before a task, gather:

- Matching project context
- Matching person/company context
- Relevant documents/resources
- Last decisions
- Open tasks

Briefing output should be concise and actionable:

```md
# Briefing: <task>

## Current Understanding
...

## Relevant Context
...

## Decisions / Constraints
...

## Next Actions
...

## Sources
...
```

### `session_commit(summary)`

After meaningful work, write:

- Dated worklog entry
- Changed project/task status
- New decisions
- New next actions
- Links to produced docs/scripts/logs

Commit template:

```md
# <YYYY-MM-DD> Session: <short title>

date: <timestamp>
source: <agent/session/user>
affected: <project/person/company/task>

## What changed

...

## Decisions

...

## Next actions

...

## References

...
```

### `memory_update(fact)`

Route memory by type:

| Fact type | Destination |
|---|---|
| Stable user preference | Hermes built-in memory or `profile/` |
| Project decision/status | `projects/` and maybe `worklog/` |
| Person/company fact | `people/` or `companies/` |
| Document insight | `resources/` summary/link, not full document paste |
| Short-lived task detail | `tasks/` or session-local only |

## Templates

### Project Page

```md
# <Project>

## Summary

## Status

## Decisions

## People / Companies

## Resources

## Tasks

## Worklog
```

### Person Page

```md
# <Person>

## Profile

## Projects

## Interaction History

## Preferences / Notes

## Resources
```

### Task Page

```md
# <Task>

date_created:
status:
owner:
project:
source:

## Goal

## Current State

## Decisions

## Next Action
```

## Verification Scenario

Prompt:

```text
подготовь briefing по проекту X
```

Expected behavior:

1. Search gbrain for `projects/X`, matching resources, people, tasks, and recent worklog.
2. Return a concise briefing with source paths.
3. Do not invent missing context.
4. If the session changes facts or decisions, run `session_commit(summary)` after the task.
