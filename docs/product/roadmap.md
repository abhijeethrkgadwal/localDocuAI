# Roadmap

Implement in phases. Do not jump ahead of agreed scope. Public status: [https://www.localdocu.org/roadmap](https://www.localdocu.org/roadmap).

## Live today — Web workspace (shipped)

Privacy-first local PDF and Word tools in the browser. No auth. No document-upload backend. **Cloud processing: Off. LocalDocu AI: Off.**

| Area | Status |
|------|--------|
| Foundation (monorepo, FS adapter, types) | **Done** |
| PDF merge (including bulk / 30+ under test) | **Done** |
| Web select → order → merge → download + errors | **Done** |
| PDF split, extract, delete, rotate, reorder, compress | **Done** |
| File management (sort, filter, rename, copy, move, folder, export) | **Done** |
| Practical DOCX merge + text preview + text-oriented DOC/DOCX→PDF | **Done** |
| Unified `@localdoc/orchestration` catalog + registry | **Done** |
| PWA app shell, themes, trust/status UI, public discovery pages | **Done** |
| UI locales (en, hi, es, pt, de, fr, ja, zh) + hreflang / locale sitemap | **Done** |

Honest limits that still apply: browser memory / File System Access constraints; DOCX is practical not Word-perfect; compress and convert are capacity-gated; some organize actions are session-oriented depending on browser APIs. Device matrix: [browser-support.md](./browser-support.md) · [/browser-support](https://www.localdocu.org/browser-support).

## Next — Desktop app

LocalDocu desktop (Tauri 2 direction, Windows first under consideration) for heavier local workloads beyond comfortable browser limits, and as the home for LocalDocu AI. This is **work in progress** (`/desktop`); we aim to release soon with help from the open community. The app is **not shipping yet**.

## Then — LocalDocu AI (desktop)

LocalDocu AI runs in the desktop application: an open-weight, local-device-friendly model that understands user intent and LocalDocu capabilities. It plans complex work from **document metadata and the user request** (not document contents), then executes through validated LocalDocu document-management commands. Deterministic engines still perform filesystem and PDF/Word actions — the model never executes them directly.

Foundation already in place: AI-safe command catalog / registry (`@localdoc/orchestration`). Interpreter (Step 11) is **not** active in the web release.

## Later

- Arabic locale + RTL layout
- Privacy-safe analytics (opt-in, disclosed), feature-request capture
- Deeper desktop PDF engines
- Optional funding / support URL when a real account exists

Do not claim desktop, LocalDocu AI, cloud processing, Arabic/RTL, or analytics as live until they ship.
