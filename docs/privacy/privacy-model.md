# Privacy model (current web release)

Aligned with the live product status strip: files on device, local processing, **Cloud processing: Off**, **LocalDocu AI: Off**.

## What we do

- Read selected files in the browser (or via File System Access API).
- Keep document bytes in memory / local File handles for the session.
- Write results via save picker or local download.
- Cache the **app shell** (HTML/JS/CSS/icons) via a service worker for offline reload — not user document bytes as navigable URLs.

## What we do not do (current web release)

- Upload document contents to LocalDocu servers for processing
- Store document contents on a backend
- Send document text to an AI API
- Require an account
- Run a product analytics pipeline

## Precise claims

We do **not** claim “zero data collection” for future releases if telemetry is added. The current web release has no analytics sink.

When LocalDocu AI lands (desktop), requests should receive instructions and **document metadata only** — not PDF/Word contents — unless the user explicitly enables a different mode. The model interprets intent and LocalDocu capabilities, then drives validated local document-management commands.

## Write / save paths

- **Desktop Chrome / Edge:** prefer native save picker (`showSaveFilePicker`) when available.
- **Mobile and many other browsers:** results **download** to the device; UI should say “downloaded,” not imply native Save As.
- Folder pick and create-folder require File System Access (desktop Chromium) or a limited `webkitdirectory` fallback without create-folder.

See [browser-support.md](../product/browser-support.md).

## UI

The web shell shows a privacy / network status strip: files on device, processing location, cloud document processing state, LocalDocu AI state. Public copy: [/privacy](https://www.localdocu.org/privacy) (and locale prefixes such as `/es/privacy`). Source strings: `apps/web/src/i18n/locales/*/pages.json` (`privacy` section), assembled via `apps/web/src/lib/publicPages.tsx`.

Locale preference is stored in the browser (`localStorage` key `localdocu-locale`) and only affects UI language — not document processing or uploads.
