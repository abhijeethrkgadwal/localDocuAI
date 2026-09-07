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

See [docs/product/roadmap.md](docs/product/roadmap.md). Next: Step 11 — AI command interpreter.

## License

Licensed under the [Apache License, Version 2.0](LICENSE).

