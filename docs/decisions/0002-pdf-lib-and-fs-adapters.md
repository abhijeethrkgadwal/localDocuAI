# ADR 0002: pdf-lib and filesystem adapters

## Status

Accepted

## Context

The web product needs reliable in-browser PDF merge without uploading files. Web and future desktop must share command logic but differ in I/O.

## Decision

- Use **pdf-lib** for PDF merge and page operations (implementation from Step 4).
- Use **pdfjs-dist** for preview when preview ships in the Web MVP.
- Introduce a **FilesystemAdapter** interface; browser adapter first, Tauri adapter later.
- AI must never call the filesystem; only validated commands execute through handlers.

## Consequences

- No custom PDF binary format engine.
- Commands accept bytes/refs after adapter reads — keeping PDF package free of React and browser APIs where practical.
- Capability detection drives UX (hide folder when unsupported; download vs Save As messaging; capacity hints).
- See [browser-support.md](../product/browser-support.md) for the user-facing device matrix.
