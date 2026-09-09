# AI command layer (foundation)

Status:

- **Registry / catalog:** ready (`@localdoc/orchestration`, Step 10)
- **Interpreter (LocalDocu AI):** not shipped — **Off** on the live web product
- **Target home:** LocalDocu desktop app (not the browser release)

## Flow (target)

```text
User request
  → AI interpretation (metadata only — no document bytes)
    → structured command plan
      → assertCommandAllowed() + schema validation
        → permission validation
          → confirmation when destructive
            → deterministic handler execution
              → verification + result
```

## Security boundary

- AI may only select from [`COMMAND_CATALOG`](../../packages/orchestration/src/catalog.ts) / `appCommandRegistry`.
- AI never receives document contents by default.
- AI never executes filesystem actions directly.

## Current surface

Use `listAiSelectableCommands()` and `assertCommandAllowed(name)` from `@localdoc/orchestration`.

Do not expose natural-language AI as active in the web UI until the interpreter ships and product status pills are updated.
