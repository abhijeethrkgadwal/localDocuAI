import { describe, expect, it } from 'vitest';
import { createTestDocx } from '@localdoc/docx';
import { createMemoryFilesystemAdapter } from './test-imports.js';
import { runLocalWordToPdf } from './convertWorkflow.js';

describe('runLocalWordToPdf', () => {
  it('gates on declared file size before conversion', async () => {
    const bytes = await createTestDocx('Gate');
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [{ name: 'huge.docx', bytes }],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const oversized = { ...picked.value[0]!, size: 90 * 1024 * 1024 };
    const result = await runLocalWordToPdf(adapter, oversized);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('unsupported');
    expect(result.error.recovery?.toLowerCase()).toContain('desktop');
  });

  it('re-gates on actual bytes when declared size is unknown (0)', async () => {
    const bytes = await createTestDocx('Unknown Size');
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [{ name: 'unknown.docx', bytes }],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const unknownSize = { ...picked.value[0]!, size: 0 };
    const result = await runLocalWordToPdf(adapter, unknownSize);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.pageCount).toBeGreaterThanOrEqual(1);
  });

  it('converts a small DOCX end-to-end', async () => {
    const bytes = await createTestDocx('Small Convert');
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [{ name: 'small.docx', bytes }],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const result = await runLocalWordToPdf(adapter, picked.value[0]!);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.filename).toBe('small.pdf');
    expect(result.value.pageCount).toBeGreaterThanOrEqual(1);
  });

  it('treats abort as cancelled', async () => {
    const bytes = await createTestDocx('Abort Save');
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [{ name: 'abort.docx', bytes }],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const controller = new AbortController();
    controller.abort();
    const result = await runLocalWordToPdf(adapter, picked.value[0]!, {
      signal: controller.signal,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('cancelled');
  });
});
