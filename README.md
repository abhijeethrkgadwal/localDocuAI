# LocalDoc AI

Privacy-first, local-first document automation.

> Tell it what to do. Your files stay on your device.

## Current milestone

**Phase 1 Web PDF MVP (Steps 1–6) — complete**

- Select / folder / drag-drop PDFs
- Reorder, preview, merge, save/download (local only)
- Progress + cancel + structured errors
- Shared packages: `core`, `filesystem`, `pdf`

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

### Discoverability (SEO / AEO / GEO)

Set your public origin before production builds:

```bash
# apps/web/.env or CI env
VITE_SITE_URL=https://your-domain.example
```

Optional (leave unset until real URLs exist):

```bash
# VITE_LINKEDIN_URL=
# VITE_SUPPORT_URL=
```

The homepage (`/`) remains the document workspace. Public routes support discovery and trust:

`/merge-pdf`, `/merge-docx`, `/pdf-tools`, `/docx-to-pdf`, `/offline`, `/privacy`, `/how-it-works`, `/open-source`, `/contribute`, `/roadmap`, `/desktop`, `/local-ai`, `/faq`

Build emits crawl assets at the site root:

| Path | Purpose |
|------|---------|
| `/robots.txt` | Allows search + common AI crawlers; points to sitemap |
| `/sitemap.xml` | Home + all public discovery routes |
| `/llms.txt` | Short LLM/answer-engine brief |
| `/llms-full.txt` | Full FAQ + citation guidance |
| `/og-image.svg` | Open Graph / social share image |

The HTML shell includes canonical/Open Graph/Twitter meta. Client routes update title/description/canonical. JSON-LD is route-appropriate (`WebSite` / `SoftwareApplication` on home, `FAQPage` where FAQ is primary, `BreadcrumbList` on public pages).

### Community

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md)
- GitHub issue and PR templates under `.github/`

Recommended GitHub repository topics: `pdf`, `docx`, `local-first`, `privacy`, `pwa`, `open-source`, `document-automation`, `offline-first`, `typescript`, `react`

Funding: do not enable GitHub Sponsors / `FUNDING.yml` until a real funding account is active. The UI shows “Support the project” as coming soon when `VITE_SUPPORT_URL` is unset.

### Accessibility

The web shell targets practical WCAG-oriented use: skip link, landmarks, labeled controls, live status regions, keyboard-operable actions, focus-visible rings, larger touch targets, `prefers-reduced-motion`, and `forced-colors` support.

## Workspace layout

```text
apps/web/                 React web shell
packages/core/            Types, Result, command interface, error formatting
packages/filesystem/      Browser FS adapter + fallbacks
packages/docx/             DOCX merge (practical) + text preview
packages/orchestration/    Unified command registry + AI-safe catalog
docs/                     Product, architecture, privacy, ADRs
tests/fixtures/           Notes for future on-disk fixtures
```

## Privacy (Phase 1)

- Document bytes stay on your device
- No authentication
- No application backend for document processing
- No AI layer yet
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

See [docs/product/roadmap.md](docs/product/roadmap.md) and the in-app [/roadmap](apps/web) page. Next: Step 11 — AI command interpreter (future; not active in the current web release).

## License

Licensed under the [Apache License, Version 2.0](LICENSE).

Created and maintained by Abhijeeth Gadwal, with contributions from the community.

