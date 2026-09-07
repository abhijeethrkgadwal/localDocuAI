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

When AI lands (Phase 4), requests should receive instructions and metadata only — not PDF contents — unless the user explicitly enables a cloud document-processing feature.

## UI

The web shell shows a privacy status strip: files on device, processing location, cloud document processing state, AI processing state.
