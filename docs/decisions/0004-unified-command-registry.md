# ADR 0004: Unified command registry as the AI security boundary

## Status

Accepted

## Context

LocalDoc AI will interpret natural language into structured plans. The AI must never invent capabilities or execute filesystem actions directly. Multiple packages already exposed separate registries (`pdf`, `filesystem`, `docx`).

## Decision

- Introduce `@localdoc/orchestration` with:
  - `COMMAND_CATALOG` — AI-safe metadata (no handlers, no document bytes)
  - `createAppCommandRegistry()` / `appCommandRegistry` — one registered handler set
  - `assertCommandAllowed()` — reject unknown/invented commands before execution
- `MERGE_FILES` is registered once (PDF schemas). DOCX merge remains a separate engine selected by file type at runtime; the catalog lists both engines.
- Future AI providers may only propose commands present in the catalog / registry.

## Consequences

- Step 11 interpreter validates against this registry/catalog.
- Adding a capability requires: CommandName (if new), handler, catalog entry, tests.
- Adapter-injected commands (rename/copy/create folder) keep schemas in the registry; shells pass adapters at execute time where needed.
