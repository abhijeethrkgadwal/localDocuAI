# Browser and device support

Canonical compatibility guide for the **current LocalDocu web release** ([https://www.localdocu.org](https://www.localdocu.org)).

Live product copy also lives at [/browser-support](https://www.localdocu.org/browser-support). Keep this file and that page aligned when capabilities change.

## Positioning

| Surface | Promise |
|---------|---------|
| **Phones & tablets** (Android Chrome, iOS Safari / iOS Chrome) | **Select files → run tool → download** |
| **Desktop Chrome / Edge** | Fullest web experience (folder pick, native Save As, create folder) |
| **Desktop Firefox / Safari** | Core tools via file pick + download; folder / Save As limited |
| **Future desktop app** | Heavier local workloads + LocalDocu AI (not shipped) |

Document processing always runs **on the device**. Compatibility differences are about **browser APIs** (file pickers, save dialogs) and **device memory**, not about uploading documents.

## Feature matrix

| Capability | Android Chrome | iOS Safari / iOS Chrome | Desktop Chrome / Edge | Desktop Firefox / Safari |
|------------|----------------|-------------------------|-----------------------|---------------------------|
| Select files (multi-select) | Yes | Yes | Yes | Yes |
| Merge PDF / DOCX | Yes* | Yes* | Yes | Yes* |
| Compress, split, extract, delete, rotate, reorder | Yes* | Yes* | Yes | Yes* |
| Convert DOC/DOCX → PDF | Yes* (stricter size caps on low RAM) | Yes* | Yes* | Yes* |
| Download results | Yes | Yes | Yes | Yes |
| Select folder | Limited / often unavailable | Usually no | Yes | Limited / often no |
| Native Save As | No (download) | No (download) | Yes | Often no (download) |
| Create folder on disk | No | No | Yes (after folder pick) | No |
| Drag and drop files | Limited | Limited | Yes | Yes |
| In-page PDF preview | Often OK | May be blank — use **Open preview in new tab** | Usually works | Usually works |
| PWA / offline app shell | Install / Add to Home Screen after first visit | Share → Add to Home Screen; tighter SW limits | Yes | Varies |
| LocalDocu AI | Off | Off | Off | Off |

\*Within browser memory and product capacity gates. Very large files or “Maximum” compress may fail on phones; prefer smaller files or Balanced mode.

## UI languages (locales)

The web UI ships in **eight locales**. English keeps unprefixed paths; other languages use a locale prefix.

| Code | Language | Example |
|------|----------|---------|
| `en` | English (default) | [https://www.localdocu.org/merge-pdf](https://www.localdocu.org/merge-pdf) |
| `hi` | Hindi | `/hi/merge-pdf` |
| `es` | Spanish | `/es/merge-pdf` |
| `pt` | Portuguese (Brazil) | `/pt/merge-pdf` |
| `de` | German | `/de/merge-pdf` |
| `fr` | French | `/fr/merge-pdf` |
| `ja` | Japanese | `/ja/merge-pdf` |
| `zh` | Chinese (Simplified) | `/zh/merge-pdf` |

- Use the **language switcher** in the site header (preference is stored in `localStorage`).
- Path slugs stay English in every locale (`merge-pdf`, `faq`, …).
- Document **file contents** (PDF/DOCX) are not translated by the app UI locale.
- Browser built-in page translate can still rewrite English pages if a user prefers that over a shipped locale.
- **Not shipped yet:** Arabic and full RTL layout.

Catalogs and runtime: `apps/web/src/i18n/`. Keep this section aligned with the live [/browser-support](https://www.localdocu.org/browser-support) note.

## What “works on mobile” means

Supported on typical phones/tablets when the file fits capacity:

1. Open a tool page (for example [/merge-pdf](https://www.localdocu.org/merge-pdf)) or the homepage workspace  
2. **Select files** (multi-select) — do not rely on folder pick  
3. Run the operation  
4. **Download** the result (native Save As is not available)

Not available (or unreliable) on mobile web today:

- True recursive folder pick with on-disk create-folder  
- Native Save As / overwrite via File System Access  
- Guaranteed in-page PDF iframe preview on iOS  

## Capacity and honesty

- **Convert to PDF** is capacity-gated from approximate device RAM / cores (smaller ceilings on phones).  
- **Compress** hard-caps large PDFs; Maximum mode needs more memory — prefer Balanced on mobile.  
- **DOCX** merge/convert is practical / text-oriented — not full Word layout fidelity.  
- Session work is cleared on tab refresh; files you downloaded stay where you saved them.

## Related docs

- [ADR 0001 — Local-first](../decisions/0001-local-first.md)  
- [ADR 0002 — pdf-lib and FS adapters](../decisions/0002-pdf-lib-and-fs-adapters.md)  
- [Privacy model](../privacy/privacy-model.md)  
- [Roadmap](./roadmap.md)  
- Product FAQ: [https://www.localdocu.org/faq](https://www.localdocu.org/faq)
