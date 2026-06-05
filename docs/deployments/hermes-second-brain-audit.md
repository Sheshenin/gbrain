# Second Brain Audit

Audit date: 2026-06-05
Server: Hermes `38.60.216.33`
Runtime: `/data/second-brain/runtime` (`/second-brain` symlink is used by current scripts)
GBrain: `gbrain 0.33.0`

## Current Pipeline

Existing scripts:

| Script | Role |
|---|---|
| `/data/second-brain/runtime/scripts/librarian_v0.py` | Google Drive inventory/download/export and text mirror writer |
| `/data/second-brain/runtime/scripts/second_brain_librarian_worker.sh` | Nightly worker, lock, logs, batches, summaries, gbrain import/embed |
| `/data/second-brain/runtime/scripts/make_gbrain_import_mirror.py` | Mirrors Markdown text files into slugged `gbrain-import` tree |
| `/data/second-brain/runtime/scripts/generate_google_drive_summaries.js` | Google Drive summary layer |

State inspected:

| File | Size |
|---|---:|
| `state/google_drive_inventory_latest.json` | 1,660,565 bytes |
| `state/google_drive_summary_state.json` | 1,079,463 bytes |
| `state/gbrain_import_map.json` | 854,925 bytes |
| `logs/librarian_v0_latest.json` | 116,712 bytes |

## Inventory Snapshot

| Metric | Count |
|---|---:|
| Inventory items | 2,994 |
| Files | 2,673 |
| Folders | 321 |
| Existing `.meta.json` files in text mirror | 2,872 |

Latest librarian run:

| Status | Count |
|---|---:|
| `unsupported_mime` | 36 |
| `extracted_iwork` | 17 |
| `error` | 103 |
| `downloaded_text` | 6 |
| `empty_text` | 10 |
| `exported_google_file` | 5 |

## MIME / Status Counts

| MIME | Status | Count |
|---|---|---:|
| `text/markdown` | `downloaded_text` | 1,195 |
| `video/mp4` | `unsupported_mime` | 571 |
| `image/jpeg` | `unsupported_mime` | 266 |
| `application/vnd.google-apps.document` | `exported_google_file` | 166 |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `extracted_docx` | 105 |
| `image/tiff` | `unsupported_mime` | 95 |
| `application/pdf` | `extracted_pdf` | 80 |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `error` | 71 |
| `image/png` | `unsupported_mime` | 70 |
| `text/markdown` | `empty_text` | 70 |
| `application/octetstream` | `unsupported_mime` | 62 |
| `application/vnd.openxmlformats-officedocument.presentationml.presentation` | `extracted_pptx` | 18 |
| `application/vnd.google-apps.spreadsheet` | `exported_google_file` | 17 |
| `application/octetstream` | `extracted_iwork` | 12 |
| `audio/x-m4a` | `unsupported_mime` | 11 |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `unsupported_mime` | 10 |
| `application/pdf` | `error` | 7 |
| `application/octet-stream` | `empty_text` | 5 |
| `text/csv` | `downloaded_text` | 4 |
| `application/octet-stream` | `unsupported_mime` | 4 |
| `application/vnd.google-apps.presentation` | `empty_text` | 4 |
| `text/html` | `downloaded_text` | 4 |
| `application/zip` | `unsupported_mime` | 3 |
| `video/x-m4v` | `unsupported_mime` | 3 |
| `audio/wav` | `unsupported_mime` | 3 |
| `application/vnd.openxmlformats-officedocument.presentationml.presentation` | `error` | 2 |
| `application/vnd.google-apps.form` | `unsupported_mime` | 2 |
| `video/quicktime` | `unsupported_mime` | 2 |
| `application/x-iwork-pages-sffpages` | `unsupported_mime` | 2 |

## Top Failure Reasons

| Reason | Count | Notes |
|---|---:|---|
| `video/mp4` | 571 | Expected unsupported; do not index video binaries unless transcript pipeline exists |
| `image/jpeg` | 266 | Expected unsupported; OCR can be a later optional pipeline |
| `image/tiff` | 95 | Expected unsupported; OCR can be a later optional pipeline |
| `ModuleNotFoundError("No module named 'docx'")` | 71 | Fixed by dependency-free DOCX XML extractor |
| `image/png` | 70 | Expected unsupported |
| `text/markdown` empty | 70 | Source files exist but have no text content |
| `application/octetstream` | 62 | Mixed bucket; now routed through iWork detection when extension/MIME matches |
| `audio/x-m4a` | 11 | Expected unsupported unless transcription is added |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` unsupported | 10 | Fixed by XLSX extractor path |
| `ModuleNotFoundError("No module named 'fitz'")` | 7 | Fixed by `pdftotext` extractor |
| `application/vnd.google-apps.presentation` empty | 4 | Google export succeeds but text export may be empty |
| `ModuleNotFoundError("No module named 'pptx'")` | 2 | Fixed by PPTX XML extractor |
| `application/x-iwork-pages-sffpages` unsupported | 2 | Fixed by iWork MIME routing |

## Quick Wins Implemented

1. Added `scripts/extract_document_text.py` with a unified extractor interface.
2. Replaced fragile PDF extraction through `fitz` with server-side `pdftotext`.
3. Replaced fragile DOCX extraction through `python-docx` with direct OOXML XML text extraction.
4. Replaced PPTX dependency with direct slide/notes XML extraction.
5. Kept XLSX extraction through `openpyxl`, which is available on Hermes.
6. Expanded iWork handling for `.key`, `.pages`, `.numbers`, `application/octetstream`, `application/octet-stream`, and `application/x-iwork-*`.
7. Added `extraction_method` to metadata and Markdown headers.
8. Added nightly summary counts for status, extraction method, and top failures across the full text mirror.
9. Fixed worker inventory settings: nightly runs now request Drive inventory instead of calling librarian with `--max-items 0`.
10. Added compatibility fallback for `gog v0.11.0`, where `gog drive inventory` is no longer available; librarian falls back to recursive `gog drive ls`.
11. Fixed duplicate path collisions caused by `Path.with_suffix()` on Russian file names with dots, for example `Алина Баженова. Урок 2, готово.docx`.

## Remaining Work

| Area | Recommendation |
|---|---|
| Images and TIFF | Add optional OCR pipeline only for high-value folders; avoid blanket OCR cost/noise |
| Audio/video | Add transcription as a separate pipeline if these files matter |
| Legacy `.doc` and `.xls` | Add LibreOffice/headless conversion if counts grow |
| Empty Markdown | Keep status explicit; review whether these are placeholders or broken exports |
| Existing stale error metas | Re-run librarian batches so old `error`/`unsupported_mime` entries are retried with the new extractor |
| Google keyring in noninteractive shell | Current fallback can reuse latest inventory and cached source files, but live Drive download still requires the server's `gog` keyring environment to be available to cron |
