# Test fixtures

PDF bytes for unit tests are generated in-process with `pdf-lib` via
`packages/pdf/src/test-utils.ts` (`createTestPdf` / `createTestPdfs`).

That keeps the repo free of binary fixtures while still covering:

- Happy-path merge
- Invalid / corrupt input
- Cancellation
- 30+ file bulk merge

Optional on-disk samples can be added here later for e2e / Playwright.
