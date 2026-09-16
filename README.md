# LocalDocu

Privacy-first, local-first document automation.

> Tell it what to do. Your files stay on your device.

**Live:** [https://www.localdocu.org](https://www.localdocu.org)

## Current status (web — shipped)

The browser workspace is the product today. Document processing runs on-device. **Cloud processing: Off. LocalDocu AI: Off.**

- Select files (multi-select) / folder when supported / drag-and-drop on desktop (PDF, DOC, DOCX)
- PDF: merge, split, extract, delete pages, rotate, reorder, compress, preview
- Word: practical DOCX merge + text-oriented DOC/DOCX → PDF (not full Word layout fidelity)
- Organize: sort, filter, rename, copy, move, create folder (desktop Chromium), export
- Progress, cancel, structured errors; themes; PWA app shell (offline reload after first visit)
- **UI locales (8):** English (default, unprefixed URLs) plus Hindi, Spanish, Portuguese (Brazil), German, French, Japanese, and Simplified Chinese via `/hi/…`, `/es/…`, `/pt/…`, `/de/…`, `/fr/…`, `/ja/…`, `/zh/…` — language switcher in the header; Arabic/RTL deferred
- Public trust/discovery pages + crawl assets (`robots.txt`, `sitemap.xml`, `llms.txt`, …)
- Packages: `core`, `filesystem`, `pdf`, `docx`, `orchestration`

### Browser support (web)

| Capability | Android Chrome / iOS Safari | Desktop Chrome / Edge |
|------------|-----------------------------|------------------------|
| Select files (multi) + merge / compress / convert | Yes (within memory limits) | Yes |
| Download results | Yes | Yes |
| Folder pick | Limited / often unavailable | Yes |
| Native Save As | No (download instead) | Yes |
| Create folder on disk | No | Yes (after folder pick) |
| In-page PDF preview | May be blank on iOS — use Open in new tab | Usually works |
| PWA / offline shell | Android: install; iOS: Add to Home Screen | Yes |

Mobile is positioned as **select files → run tool → download**. Full folder and Save As workflows need desktop Chromium (or the future desktop app).

**Full matrix (GitHub + live site):** [docs/product/browser-support.md](docs/product/browser-support.md) · [https://www.localdocu.org/browser-support](https://www.localdocu.org/browser-support)

Desktop app and LocalDocu AI are **planned** (not active in the web release). See [docs/product/roadmap.md](docs/product/roadmap.md) and [/roadmap](https://www.localdocu.org/roadmap).

## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io) 9 (`npx pnpm@9` works if pnpm is not installed globally)

## Setup

```bash
npx pnpm@9 install
npx pnpm@9 dev
```

Open http://localhost:5173

### Offline / PWA

After a production build, a service worker caches the app shell so you can reload without a network (document processing was already local).

```bash
npx pnpm@9 --filter @localdoc/web build
npx pnpm@9 --filter @localdoc/web preview
```

Open the preview URL once online, then use DevTools → Network → Offline and refresh to verify.

### Production (Vercel)

Production origin: **https://www.localdocu.org**

- Set Vercel **Root Directory** to `apps/web` so [`apps/web/vercel.json`](apps/web/vercel.json) applies (security headers, SPA rewrites, apex → www).
- Build-time site URL (canonicals, sitemap, Open Graph, `llms.txt`):

```bash
# apps/web/.env or CI / vercel.json build env
VITE_SITE_URL=https://www.localdocu.org
```

Optional (leave unset until real URLs exist):

```bash
# VITE_LINKEDIN_URL=
# VITE_SUPPORT_URL=
```

### Languages (UI locales)

| Code | Language | URL shape |
|------|----------|-----------|
| `en` | English (default) | `/merge-pdf`, `/faq`, … |
| `hi` | Hindi | `/hi/merge-pdf` |
| `es` | Spanish | `/es/merge-pdf` |
| `pt` | Portuguese (Brazil) | `/pt/merge-pdf` |
| `de` | German | `/de/merge-pdf` |
| `fr` | French | `/fr/merge-pdf` |
| `ja` | Japanese | `/ja/merge-pdf` |
| `zh` | Chinese (Simplified) | `/zh/merge-pdf` |

- Catalogs: `apps/web/src/i18n/locales/{locale}/{common,workspace,pages,seo}.json`
- Runtime: `apps/web/src/i18n/` (path helpers, `LocaleProvider`, `t()`)
- English path slugs stay the same in every locale (`merge-pdf`, not translated)
- Missing keys fall back to English; brand tokens (`LocalDocu`, `PDF`, `DOCX`, …) stay untranslated
- **Not in v1:** Arabic / RTL layout

### Discoverability (SEO / AEO / GEO)

The homepage (`/`) remains the document workspace. Public routes support discovery and trust:

`/merge-pdf`, `/merge-docx`, `/compress-pdf`, `/pdf-tools`, `/docx-to-pdf`, `/browser-support`, `/offline`, `/privacy`, `/how-it-works`, `/open-source`, `/contribute`, `/roadmap`, `/desktop`, `/local-ai`, `/faq`

Localized mirrors use the same paths under `/:locale/…` (for example `/es/privacy`). English remains the `x-default` / unprefixed canonical set.

UI and SEO strings live in the i18n catalogs above. Structural routing/meta flags stay in `apps/web/src/lib/routeMeta.ts`, `publicPages.tsx`, and `seoContent.ts`.

Build emits crawl assets at the site root:

| Path | Purpose |
|------|---------|
| `/robots.txt` | Allows search + common AI crawlers; points to sitemap |
| `/sitemap.xml` | Home + public routes **× all UI locales** |
| `/llms.txt` | Short LLM/answer-engine brief (English) |
| `/llms-full.txt` | Full FAQ + citation guidance (English) |
| `/og-image.png` | Open Graph / social share image (official lockup) |
| `/og-image.svg` | Fallback share image for older crawler URLs |

The HTML shell includes canonical/Open Graph/Twitter meta. Client routes update title/description/canonical, `html lang`, `hreflang` alternates, and `og:locale`. JSON-LD is route-appropriate (`WebSite` / `SoftwareApplication` on home, `FAQPage` where FAQ is primary, `BreadcrumbList` on public pages).

### Community

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md)
- GitHub issue and PR templates under `.github/`

Recommended GitHub repository topics: `pdf`, `docx`, `local-first`, `privacy`, `pwa`, `open-source`, `document-automation`, `offline-first`, `typescript`, `react`, `i18n`

Funding: do not enable GitHub Sponsors / `FUNDING.yml` until a real funding account is active. The UI shows “Support the project” as coming soon when `VITE_SUPPORT_URL` is unset.

### Accessibility

The web shell targets practical WCAG-oriented use: skip link, landmarks, labeled controls, live status regions, keyboard-operable actions, focus-visible rings, larger touch targets, `prefers-reduced-motion`, and `forced-colors` support.

## Workspace layout

```text
apps/web/                 React web shell (Vercel root)
  src/i18n/               UI locales, catalogs, LocaleProvider
packages/core/            Types, Result, command interface, error formatting
packages/filesystem/      Browser FS adapter + file-management commands
packages/pdf/             PDF commands (pdf-lib) + compress presets
packages/docx/            DOCX merge (practical) + text preview + convert
packages/orchestration/   Unified command registry + AI-safe catalog
docs/                     Product, architecture, privacy, ADRs
tests/fixtures/           Notes for future on-disk fixtures
```

## Privacy (current web release)

- Document bytes stay on your device
- No authentication
- No application backend for document processing
- Cloud document processing: Off
- LocalDocu AI: Off (planned for desktop; metadata + intent only — not file contents)
- No product analytics pipeline yet

See [docs/privacy/privacy-model.md](docs/privacy/privacy-model.md).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web app |
| `pnpm build` | Build packages + web |
| `pnpm test` | Run Vitest across packages |
| `pnpm typecheck` | Strict TypeScript check |

## Roadmap

See [docs/product/roadmap.md](docs/product/roadmap.md) and [https://www.localdocu.org/roadmap](https://www.localdocu.org/roadmap).

**Next (not shipped):** LocalDocu desktop app, then LocalDocu AI on desktop (open-weight, on-device; drives validated local commands). The orchestration registry is ready; the AI interpreter is not active on the web.

## License

Licensed under the [Apache License, Version 2.0](LICENSE).

Created and maintained by Abhijeeth Gadwal, with contributions from the community.
