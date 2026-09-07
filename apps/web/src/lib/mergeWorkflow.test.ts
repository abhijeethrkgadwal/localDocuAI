import { describe, expect, it } from 'vitest';
import { createMemoryFilesystemAdapter, createTestPdf } from './test-imports.js';
import { runLocalDocumentMerge } from './mergeWorkflow.js';

describe('runLocalDocumentMerge', () => {
  it('rejects fewer than two files', async () => {
    const adapter = createMemoryFilesystemAdapter();
    const result = await runLocalDocumentMerge(adapter, [{ id: '1', name: 'a.pdf', size: 1 }]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('validation');
  });

  it('merges through memory adapter end-to-end', async () => {
    const a = await createTestPdf('A');
    const b = await createTestPdf('B');
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [
        { name: 'a.pdf', bytes: a },
        { name: 'b.pdf', bytes: b },
      ],
    });

    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const progress: number[] = [];
    const result = await runLocalDocumentMerge(adapter, picked.value, {
      onProgress: (u) => progress.push(u.filesProcessed),
      outputFilename: 'combined.pdf',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.sourceCount).toBe(2);
    expect(result.value.pageCount).toBe(2);
    expect(result.value.filename).toBe('combined.pdf');
    expect(result.value.saveMethod).toBe('handle');
    expect(progress.length).toBeGreaterThan(0);
  });

  it('surfaces corrupt file errors with affectedFiles', async () => {
    const good = await createTestPdf('good');
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [
        { name: 'good.pdf', bytes: good },
        { name: 'bad.pdf', bytes: new Uint8Array([1, 2, 3]) },
      ],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const result = await runLocalDocumentMerge(adapter, picked.value);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('corrupt');
    expect(result.error.affectedFiles).toContain('bad.pdf');
    expect(result.error.recovery).toBeTruthy();
  });

  it('honors cancellation', async () => {
    const a = await createTestPdf('A');
    const b = await createTestPdf('B');
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [
        { name: 'a.pdf', bytes: a },
        { name: 'b.pdf', bytes: b },
      ],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const controller = new AbortController();
    controller.abort();

    const result = await runLocalDocumentMerge(adapter, picked.value, {
      signal: controller.signal,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('cancelled');
  });
});
