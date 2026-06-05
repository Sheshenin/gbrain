# Agent Context System

Goal: build an agent context layer on top of gbrain for projects, people, companies, tasks, and sessions. GBrain remains the index/retrieval layer; this layer defines stable page structure and agent behavior.

## Directory Structure

```text
daily-inbox/
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
| `daily-inbox/` | Raw daily input: Zoom summaries, Telegram/email signals, candidate tasks, and thoughts before routing |
| `profile/` | Stable user preferences, writing style, permanent operating rules |
| `projects/` | Active projects, status, decisions, related people/docs/tasks |
| `people/` | People profiles, relationship history, related projects/docs |
| `companies/` | Company profiles, offers, decisions, contacts |
| `resources/` | Pointers to source documents, links, datasets, external references |
| `worklog/` | Dated session summaries and important conclusions |
| `tasks/` | Tasks, owners, status, decisions, next actions |
| `agent-context/` | Agent instructions, indexes, briefing templates, commit templates |

## Write Rules

Raw daily communication does not go directly into final project/person/company
pages. First write it to `daily-inbox`, then let the nightly router create
auditable routed pages.

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

## Daily Inbox

`daily-inbox` is the intake layer for meaningful daily communications:

```text
/second-brain/texts/daily-inbox/YYYY-MM-DD.md
```

Use it for:

- Zoom summaries.
- Telegram/email items that look like tasks, commitments, decisions, project
  status changes, or client/company signals.
- Andrey's thoughts when he asks to add them to daily-inbox.

Do not use it for routine chatter or duplicate FYIs.

Capture command:

```bash
/second-brain/scripts/append_daily_inbox.py --kind <zoom|telegram|email|thought|task|note> --title "<title>" --text "<text>"
```

Email-review bridge:

```bash
printf '%s\n' "<summary>" | /second-brain/scripts/daily_mail_review_to_inbox.py --title "Daily email review"
```

Nightly routing command:

```bash
/second-brain/scripts/daily_inbox_router.py
```

Router output:

```text
/second-brain/texts/agent-context/worklog/YYYY-MM-DD.md
/second-brain/texts/agent-context/tasks/YYYY-MM-DD.md
/second-brain/texts/agent-context/projects/<project>/YYYY-MM-DD.md
/second-brain/texts/agent-context/people/<person>/YYYY-MM-DD.md
/second-brain/texts/agent-context/companies/<company>/YYYY-MM-DD.md
```

Routing metadata fields:

```text
project:
person:
company:
client:
source:
```

If metadata is unknown, omit it. The item still lands in `worklog`; guessing the
wrong project/person/company is worse than under-routing.

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

For raw communications or loose thoughts, prefer `daily-inbox` over
`session_commit`. Use `session_commit` only after a session creates stable
decisions, changed statuses, or reviewed next actions.

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

Daily-inbox verification:

1. Append a temporary item in a non-production test root or a real meaningful
   item with `append_daily_inbox.py`.
2. Run `daily_inbox_router.py`.
3. Confirm routed files appear under `worklog`, `tasks`, and only the explicitly
   named `projects/people/companies`.
4. Run the import mirror and gbrain import for `daily-inbox` and `agent-context`.
