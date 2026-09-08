# Contributing to LocalDocu

Thank you for helping improve **LocalDocu** — privacy-first, local-first document
automation for PDF and Word files.

> Tell it what to do. Your files stay on your device.

By contributing, you agree that your contributions are licensed under the
project’s [Apache License 2.0](LICENSE), and that you have the right to submit
them under that license.

## Project intent

LocalDocu exists so people can merge, split, compress, convert, organize, and
otherwise process documents **on their own device**.

Please keep contributions aligned with:

1. **Local-first processing** — document contents stay on the user’s device for current workflows
2. **Honest product claims** — do not overstate privacy, offline support, Word layout fidelity, or AI readiness
3. **Small, reviewable changes** — prefer focused PRs over large mixed patches
4. **Accessibility** — keep keyboard use, labels, focus, and status messaging intact
5. **Open roadmap discipline** — implement in phases; do not jump ahead of agreed scope

### What not to add without explicit maintainer scope

* Authentication / accounts
* Document-upload backends or cloud document-processing pipelines
* Subscription / paywall systems
* Covert or undisclosed telemetry that ships document contents or fingerprints users by default
* Remote AI APIs that send document contents for processing

If you believe an exception is needed, open an issue **before** writing the PR.

## Future directions (contribute carefully)

| Direction | Intent | Contribution guidance |
| --------- | ------ | -------------------- |
| **Web workspace** | Current product | Preferred place for most contributions |
| **Desktop app** | Heavier local workloads (planned) | Positioning and architecture discussion welcome; do not claim it ships until it does |
| **LocalDocu AI** | Desktop, open-weight on-device model using **metadata + user intent** to drive LocalDocu commands | Keep AI design metadata-only by default; validate plans against the command registry; never let a model execute filesystem actions directly |

See [docs/product/roadmap.md](docs/product/roadmap.md) and
[docs/privacy/privacy-model.md](docs/privacy/privacy-model.md).

## Ways to contribute

* Bug reports and reproducible test cases
* Accessibility and UX improvements
* Documentation and discoverability (accurate SEO/AEO copy)
* Tests for merge, compress, convert, file-manage, and error paths
* Performance and capacity hardening within browser limits
* Design polish that preserves the existing visual language

## Development setup

### Requirements

* Node.js **20+**
* [pnpm](https://pnpm.io) **9** (`npx pnpm@9` works if pnpm is not installed globally)

### Install and run

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173

### Useful commands

```bash
pnpm test
pnpm typecheck
pnpm --filter @localdoc/web build
pnpm --filter @localdoc/web preview
```

### Monorepo map

| Path | Role |
| ---- | ---- |
| `apps/web` | React web app / PWA |
| `packages/core` | Shared types, errors, sorting/filter helpers |
| `packages/filesystem` | Browser / memory filesystem adapters |
| `packages/pdf` | PDF engines (merge, page ops, compress) |
| `packages/docx` | DOCX merge, text extract, convert-to-PDF |
| `packages/orchestration` | Unified command catalog / registry |

## Pull request process

1. Fork (or branch from) the latest `main` (or the active contribution branch maintainers specify).
2. Keep changes focused; separate refactors from behavior changes when practical.
3. Add or update tests when behavior changes.
4. Run the checks above before requesting review.
5. Fill in the PR template: summary, privacy/offline impact, and test plan.
6. Link related issues.

### PR checklist (summary)

* [ ] `pnpm test` passes
* [ ] `pnpm typecheck` passes
* [ ] Web build succeeds if UI changed
* [ ] No document-upload / auth / cloud processing unless explicitly scoped
* [ ] Privacy, offline, and LocalDocu AI claims remain accurate
* [ ] UI changes preserve accessibility basics (labels, focus, live status where used)

## Issues

* Use GitHub issues for bugs and scoped feature requests.
* Search existing issues before opening a new one.
* For security vulnerabilities, follow [SECURITY.md](SECURITY.md) — **do not** file a public issue.

## Code of conduct

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Questions

* Maintainer: [Abhijeeth Gadwal](https://github.com/abhijeethrkgadwal)
* Portfolio: [davnix.com/abhijeeth-gadwal](https://www.davnix.com/abhijeeth-gadwal)
* Product pages in-app: `/contribute`, `/roadmap`, `/privacy`, `/local-ai`, `/desktop`

Thank you for helping keep LocalDocu local, private, and useful.
