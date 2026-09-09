# ADR 0001: Local-first document processing

## Status

Accepted

## Context

LocalDocu must earn trust through architecture. Users should not need to upload documents to use basic PDF operations.

## Decision

- Document processing runs on the user’s device (browser today; native desktop later).
- No application backend is required for document processing.
- The web app is a static SPA.
- Packages implement processing; shells only orchestrate UI and I/O adapters.

## Consequences

- Browser memory and File System Access API limits constrain large-batch UX.
- **Desktop Chrome/Edge** get the best folder pick, native Save As, and create-folder experience.
- **Mobile browsers** (Android Chrome, iOS Safari) and many non-Chromium desktops use **file input + download** for core merge / compress / convert workflows.
- Product learning features (analytics, feature requests) need a separate, privacy-scoped path later — not document upload.
- Keep the public matrix current: [browser-support.md](../product/browser-support.md) and [/browser-support](https://www.localdocu.org/browser-support) (includes UI locale coverage).
