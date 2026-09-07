# AI command layer (foundation)

Status: **registry ready** (Step 10). Interpreter lands in Step 11.

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
