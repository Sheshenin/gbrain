# Daily Inbox

`daily-inbox` is the raw daily input buffer for meaningful communications:
Zoom summaries, Telegram/email signals, candidate tasks, and Andrey's thoughts.

It is not final memory. The nightly librarian routes it into agent-context pages.

## Paths

```text
/second-brain/texts/daily-inbox/YYYY-MM-DD.md
/second-brain/texts/agent-context/worklog/YYYY-MM-DD.md
/second-brain/texts/agent-context/tasks/YYYY-MM-DD.md
/second-brain/texts/agent-context/projects/<project>/YYYY-MM-DD.md
/second-brain/texts/agent-context/people/<person>/YYYY-MM-DD.md
/second-brain/texts/agent-context/companies/<company>/YYYY-MM-DD.md
```

## Add Items

Short item:

```bash
/second-brain/scripts/append_daily_inbox.py --kind thought --title "Idea" --text "..."
```

Long item:

```bash
printf '%s\n' "..." | /second-brain/scripts/append_daily_inbox.py --kind zoom --title "Созвон" --project "Project" --person "Person"
```

Email review bridge:

```bash
printf '%s\n' "..." | /second-brain/scripts/daily_mail_review_to_inbox.py --title "Daily email review"
```

## Nightly Flow

```text
daily-inbox raw file
  -> daily_inbox_router.py
  -> texts/agent-context
  -> make_gbrain_import_mirror.py
  -> gbrain import daily-inbox + agent-context
  -> gbrain embed --stale
```

## Routing Metadata

Use known fields when available:

```text
project:
person:
company:
client:
source:
```

Multiple values can be comma-separated. If uncertain, omit metadata; the item
will still appear in the daily worklog.

Inline tags also work:

```text
#project/Event University
#person/Иван Иванов
#company/Acme
```

## Rules

- Capture only communications with future value.
- Candidate tasks are not committed obligations until reviewed.
- Do not paste full transcripts into project pages.
- Keep daily-inbox as the source and agent-context as the routed layer.
