# ADR 0001: Local-first document processing

## Status

Accepted

## Context

LocalDoc AI must earn trust through architecture. Users should not need to upload documents to use basic PDF operations.

## Decision

- Document processing runs on the user’s device (browser for Phase 1; native later).
- No application backend is required for document processing.
- The web app is a static SPA.
- Packages implement processing; shells only orchestrate UI and I/O adapters.

## Consequences

- Browser memory and File System Access API limits constrain large-batch UX.
- Chrome/Edge get the best folder/save experience; other browsers use file input + download fallbacks.
- Product learning features (analytics, feature requests) need a separate, privacy-scoped path later — not document upload.
