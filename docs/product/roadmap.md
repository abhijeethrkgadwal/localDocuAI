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
| DOCX | 9 | Practical DOCX merge + text preview — **done** (no Word-perfect claim) |
| Command registry | 10 | Unified `@localdoc/orchestration` catalog + registry — **done** |
| M3 Prove bulk | — | 30+ PDFs merge locally with progress/cancel |

## Phase 2 — Bulk document workspace

Additional PDF commands + file-management commands via the command registry.

## Phase 3 — DOCX

DOCX merge/order/extract and practical preview; compatibility fixtures. No fidelity claims without tests.

## Phase 4 — AI intelligence layer

Natural-language → validated command plan → deterministic execution. AI never executes filesystem actions directly.

## Later

Desktop (Tauri 2, Windows first), privacy-safe analytics, feature-request capture, local AI provider.

Full step checklist (1–22) lives in the master product specification; execute one step at a time.
