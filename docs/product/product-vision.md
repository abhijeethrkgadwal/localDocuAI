# Product vision

**LocalDocu** is a privacy-first, local-first document automation platform.

Users manipulate, transform, organize, and automate documents primarily with computing resources on their own device instead of uploading documents to cloud servers.

## Tagline

> Tell it what to do. Your files stay on your device.

## Live product

**https://www.localdocu.org** — web workspace for local PDF and Word tools. Cloud document processing and LocalDocu AI are Off until they ship (AI planned for desktop).

## Principles

- Local-first processing
- Privacy by architecture, not marketing claims
- Minimal infrastructure dependency
- No artificial subscription requirement for basic local operations
- AI as an intelligence/orchestration layer — not the document-processing engine
- Deterministic and auditable execution
- Cross-platform architecture with a shared core
- Extensible command system
- Excellent UX for bulk document operations
- Honest limits (browser capacity, DOCX fidelity, feature readiness, **device/browser capability differences**)

Build incrementally. Do not over-engineer early phases. Do not claim unshipped surfaces as live.

**Compatibility:** Mobile web = select files → run → download. Full folder / Save As = desktop Chromium (or future desktop app). Details: [browser-support.md](./browser-support.md).

**Languages:** The web UI ships in English plus Hindi, Spanish, Portuguese (Brazil), German, French, Japanese, and Simplified Chinese (locale-prefixed URLs). Arabic/RTL is planned later. See [browser-support.md](./browser-support.md#ui-languages-locales).
