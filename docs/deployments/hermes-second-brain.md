# Hermes Second Brain Deployment

Status date: 2026-06-05

This deployment uses GBrain as the shared document and retrieval layer for
Hermes, OpenClaw, and Codex. Google Drive and local mirrored files are sources;
GBrain is the index, memory/retrieval layer, and agent context surface.

Related documents:

- [`hermes-second-brain-audit.md`](hermes-second-brain-audit.md) — observed
  MIME/status counts, failure reasons, and implemented fixes.
- [`../guides/agent-context-system.md`](../guides/agent-context-system.md) —
  project/person/task/session context rules for agents.
- [`../guides/daily-inbox.md`](../guides/daily-inbox.md) — concise command
  reference for adding and routing daily communications.

## Runtime

| Item | Value |
|---|---|
| Server | Hermes `38.60.216.33` |
| Runtime root | `/data/second-brain/runtime` |
| Runtime symlink | `/second-brain` |
| GBrain data | `/data/second-brain/gbrain` |
| GBrain version observed | `gbrain 0.33.0` |
| Cron worker | `/root/.hermes/scripts/second_brain_librarian_worker.sh` |
| Runtime worker copy | `/data/second-brain/runtime/scripts/second_brain_librarian_worker.sh` |

The cron worker and runtime worker must stay byte-identical. Cron currently runs:

```cron
0 6 * * * /root/.hermes/scripts/second_brain_librarian_worker.sh >> /second-brain/logs/librarian_cron_stdout.log 2>> /second-brain/logs/librarian_cron_stderr.log
```

## Architecture

```text
Google Drive / local mirrored files
  -> /second-brain/sources/google-drive
  -> /second-brain/texts/google-drive/*.md + *.meta.json
  -> /second-brain/gbrain-import/google-drive

Daily communications / manual notes
  -> /second-brain/texts/daily-inbox/YYYY-MM-DD.md
  -> /second-brain/texts/agent-context/{worklog,tasks,projects,people,companies}

Telegram ingestion
  -> /second-brain/gbrain-import/telegram

All import trees
  -> gbrain import --no-embed
  -> gbrain embed --stale
  -> shared gbrain CLI/MCP access for Hermes, OpenClaw, Codex
```

Important boundaries:

- Google Drive is read-only for this pipeline.
- Binary files are not imported into GBrain.
- The user's Mac is not required for nightly indexing.
- Hermes built-in memory can remain enabled for short personal memory, but it
  does not replace GBrain as the document/context layer.
- OpenViking is a reference for agent context concepts only, not a replacement
  runtime.
- `daily-inbox` is raw input, not final memory. The nightly router writes the
  routed agent-context layer from it.

## Nightly Pipeline

The worker performs:

1. Google Drive inventory.
2. Download/export changed documents.
3. Server-side text extraction into Markdown.
4. `.meta.json` update beside each Markdown file.
5. Telegram ingestion.
6. Daily inbox routing into agent-context.
7. Google Drive summary generation.
8. `gbrain-import` mirror refresh for Google Drive, daily-inbox, and agent-context.
9. `gbrain import ... --no-embed` for Google Drive, Telegram, daily-inbox, and agent-context.
10. `gbrain embed --stale`.
11. Final summary JSON and logs.

Logs:

```text
/second-brain/logs/librarian_runs/<run_id>
/second-brain/logs/librarian_latest_run
/second-brain/logs/librarian_cron_stdout.log
/second-brain/logs/librarian_cron_stderr.log
```

## Daily Inbox

`daily-inbox` collects meaningful communications before they become durable
context:

```text
/second-brain/texts/daily-inbox/YYYY-MM-DD.md
```

Use it for:

- Zoom summaries with decisions, risks, next actions, and client/project context.
- Telegram/email signals that look like tasks, commitments, project changes, or
  important client/company information.
- Andrey's standalone thoughts when he asks to add them to daily-inbox.

Write into it with:

```bash
/second-brain/scripts/append_daily_inbox.py --kind thought --title "Idea" --text "..."
printf '%s\n' "..." | /second-brain/scripts/append_daily_inbox.py --kind zoom --title "Созвон" --project "Project" --person "Person"
printf '%s\n' "..." | /second-brain/scripts/daily_mail_review_to_inbox.py --title "Daily email review"
```

Nightly routing:

```text
/second-brain/scripts/daily_inbox_router.py
  -> /second-brain/texts/agent-context/worklog/YYYY-MM-DD.md
  -> /second-brain/texts/agent-context/tasks/YYYY-MM-DD.md
  -> /second-brain/texts/agent-context/projects/<project>/YYYY-MM-DD.md
  -> /second-brain/texts/agent-context/people/<person>/YYYY-MM-DD.md
  -> /second-brain/texts/agent-context/companies/<company>/YYYY-MM-DD.md
```

The router is deterministic and conservative. If a project/person/company is not
known, the item remains in the daily worklog instead of being guessed into the
wrong context page.

## Extractors

Primary script:

```text
/second-brain/scripts/extract_document_text.py
```

Supported server-side extraction:

| Type | Method |
|---|---|
| PDF | `pdftotext` |
| DOCX | OOXML XML text extraction |
| PPTX | OOXML slide and notes XML extraction |
| XLSX/XLSM | `openpyxl`, sheets as tabular Markdown-like text |
| Keynote/Pages/Numbers | ZIP package preview/XML/IWA best-effort text extraction |
| Google Docs/Sheets/Slides | Google Drive export through `gog drive download --format ...` |
| Plain text/Markdown/CSV/HTML/XML/JSON | Direct text download |

Each successful extraction writes Markdown like:

```md
# <file name>

Source: google-drive
Google Drive file id: <id>
Original path: <path>
Original mime: <mime>
Extraction method: <method>
Extracted at: <timestamp>

## Text

<extracted text>
```

The metadata JSON records at least `status`, `extraction_method`, `char_count`,
`processed_at`, source Drive metadata, and `error` when applicable.

## Current Verified Status

Verified on 2026-06-05:

| Check | Result |
|---|---|
| Real DOCX extraction | ok, `docx:ooxml-xml` |
| Real PDF extraction | ok, `pdf:pdftotext` |
| Real PPTX extraction | ok, `pptx:ooxml-xml` |
| Real XLSX extraction | ok, `xlsx:openpyxl` |
| Real `.key` extraction | ok, `iwork:zip-preview-xml-iwa` |
| Real `.pages` extraction | ok, `iwork:zip-preview-xml-iwa` |
| Real `.numbers` extraction | ok, `iwork:zip-preview-xml-iwa` |
| `daily_inbox_router.py` temporary routing test | ok, writes `worklog/tasks/projects/people/companies` |
| Empty `daily-inbox` and `agent-context` imports | ok, `0` files without error |
| `gbrain import /second-brain/gbrain-import/google-drive --no-embed` | ok |
| `gbrain embed --stale` with worker env | ok, `4326/4326` chunks embedded |
| `gbrain extract links --source db` | ok, created `0` links from current data |
| `gbrain extract timeline --source db` | ok, created `0` entries from current data |

Latest observed stats after import/embed:

```text
Pages:     1939
Chunks:    4326
Embedded:  4326
Links:     0
Tags:      8
Timeline:  0

By type:
  source: 1834
  person: 66
  note: 53
  concept: 3
```

`Links` and `Timeline` being zero is a data-shape result, not a failed command:
the extraction commands completed successfully but did not find structured links
or dated timeline entries to create.

## Access Pattern for Agents

Baseline access is CLI over SSH because it matches the existing Hermes SSH Tunnel
setup and does not expose a public service:

```bash
ssh root@38.60.216.33 'gbrain search "query text"'
ssh root@38.60.216.33 'gbrain query "project briefing request"'
```

Use `gbrain serve` or `gbrain serve --http` only when an agent needs MCP. If HTTP
MCP is enabled, keep write/admin scopes restricted to trusted agents and private
tunnels.

Role boundary:

| Role | Allowed operations |
|---|---|
| Hermes/OpenClaw/Codex read mode | search, query, read context |
| Trusted agent write mode | update project/person/company/task/worklog pages |
| Server pipeline | inventory, extract, import, embed, link/timeline extraction |
| Admin | cron, credentials, full sync, cleanup |

## Agent Context Layer

Use these top-level context areas in GBrain:

```text
profile/
projects/
people/
companies/
resources/
worklog/
tasks/
agent-context/
daily-inbox/
```

Write rules:

- Do not write everything.
- Every durable write must include date, source, affected project/person/company,
  what changed, and next action when present.
- Do not paste large source documents into project pages.
- Source documents stay in `/second-brain/texts/google-drive` and the
  `gbrain-import` source pages; project pages hold summaries, decisions, links,
  and next actions.
- Daily communications first go to `daily-inbox`; nightly routing creates
  agent-context pages.

Logical commands agents should implement through gbrain queries/writes:

| Command | Purpose |
|---|---|
| `get_project_context(project)` | Summary, status, docs, people, decisions, next actions |
| `get_person_context(person)` | Profile, projects, interaction history, docs |
| `get_document_context(query)` | Relevant source docs with cited summaries |
| `session_briefing(task)` | Context pack before work begins |
| `session_commit(summary)` | Worklog/project/task updates after meaningful work |
| `memory_update(fact)` | Route stable facts to Hermes memory or GBrain context pages |

## Operational Notes

- `gog v0.11.0` no longer has `gog drive inventory`; the librarian falls back to
  recursive `gog drive ls`.
- If live `gog` access fails in a noninteractive shell, the librarian can reuse
  the latest inventory state and cached source files, but fresh downloads still
  require the cron environment to unlock `gog` credentials.
- Russian file names containing dots must not use `Path.with_suffix()` for mirror
  stems. The librarian strips only the final technical extension to avoid
  collisions such as `Алина Баженова. Урок 2, готово.docx`.
- Re-run librarian batches after extractor changes so old `error`,
  `empty_text`, and `unsupported_mime` metadata is retried under the new code.
