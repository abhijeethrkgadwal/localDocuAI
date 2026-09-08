# Roadmap

Implement in phases. Do not jump ahead.

## Phase 1 — Web PDF MVP (current)

File/folder selection, drag-and-drop, PDF discovery, preview, ordering, merge, export — all local. No auth. No document upload.

### Near-term milestones

| Milestone | Spec steps | Done when |
|-----------|------------|-----------|
| M0 Foundation | 1–3 | Monorepo runs; FS abstraction + types |
| M1 Merge engine | 4 | `MERGE_FILES` works under Vitest (including 30+ PDFs) — **done** |
| M2 Web MVP | 5–6 | Select → order → merge → download + error/test hardening — **done** |
| Phase 2 PDF cmds | 7 | Split, extract, delete, rotate, reorder — **done** |
| File management | 8 | Sort, filter, rename, copy, move, create folder, export — **done** |
| DOCX | 9 | Practical DOCX merge + text preview + capacity-gated simple DOC/DOCX→PDF — **done** (text PDF; not Word-layout) |
| Command registry | 10 | Unified `@localdoc/orchestration` catalog + registry — **done** |
| PDF compress | — | Local `COMPRESS_PDF`: balanced image recompress + web maximum rasterize — **done** (deeper desktop engines later) |
| M3 Prove bulk | — | 30+ PDFs merge locally with progress/cancel |

## Phase 2 — Bulk document workspace

Additional PDF commands + file-management commands via the command registry.

## Phase 3 — DOCX

DOCX merge/order/extract and practical preview; compatibility fixtures. No fidelity claims without tests.

## Phase 4 — LocalDocu AI (desktop)

LocalDocu AI runs in the desktop application: an open-weight, local-device-friendly model that understands user intent and LocalDocu capabilities. It plans complex work from **document metadata and the user request** (not document contents), then executes through validated LocalDocu document-management commands. Deterministic engines still perform filesystem and PDF/Word actions — the model never executes them directly. Target: preserve quality and performance rather than trade them away for a smaller model.

## Later

Desktop (Tauri 2, Windows first), privacy-safe analytics, feature-request capture, LocalDocu AI provider integration.

Full step checklist (1–22) lives in the master product specification; execute one step at a time.
