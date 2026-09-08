# Privacy model (Phase 1)

## What we do

- Read selected files in the browser (or via File System Access API).
- Keep document bytes in memory / local File handles for the session.
- Write results via save picker or local download.

## What we do not do (Phase 1)

- Upload document contents to LocalDoc servers
- Store document contents on a backend
- Send document text to an AI API
- Require an account
- Run a product analytics pipeline

## Precise claims

We do **not** claim “zero data collection” for future releases if telemetry is added. Phase 1 has no analytics sink.

When LocalDocu AI lands (desktop / Phase 4), requests should receive instructions and **document metadata only** — not PDF/Word contents — unless the user explicitly enables a different mode. The model interprets intent and LocalDocu capabilities, then drives validated local document-management commands.

## UI

The web shell shows a privacy status strip: files on device, processing location, cloud document processing state, LocalDocu AI state.
