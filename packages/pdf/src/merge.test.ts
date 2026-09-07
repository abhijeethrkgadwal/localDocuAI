import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  executeMergeFiles,
  mergeFilesCommand,
  phase1CommandRegistry,
  validateMergeFilesInput,
} from '../src/index.js';
import { createTestPdf, createTestPdfs } from '../src/test-utils.js';

describe('@localdoc/pdf MERGE_FILES registry', () => {
  it('is registered in phase1CommandRegistry', () => {
    expect(phase1CommandRegistry.has('MERGE_FILES')).toBe(true);
    expect(phase1CommandRegistry.get('MERGE_FILES')).toBe(mergeFilesCommand);
  });

  it('rejects fewer than two files', () => {
    const result = validateMergeFilesInput({
      files: [{ name: 'a.pdf', bytes: new Uint8Array([1]) }],
    });
    expect(result.ok).toBe(false);
  });

  it('validates required permissions when checker passes', () => {
    const result = phase1CommandRegistry.validatePermissions('MERGE_FILES', () => true);
    expect(result.ok).toBe(true);
  });
});

describe('@localdoc/pdf MERGE_FILES engine', () => {
  it('merges two PDFs and preserves page order', async () => {
    const a = await createTestPdf('A', { pageCount: 2 });
    const b = await createTestPdf('B', { pageCount: 1 });

    const result = await executeMergeFiles({
      files: [
        { name: 'a.pdf', bytes: a },
        { name: 'b.pdf', bytes: b },
      ],
      outputFilename: 'out.pdf',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.filename).toBe('out.pdf');
    expect(result.value.sourceCount).toBe(2);
    expect(result.value.pageCount).toBe(3);
    expect(result.value.bytes.byteLength).toBeGreaterThan(0);

    const reopened = await PDFDocument.load(result.value.bytes);
    expect(reopened.getPageCount()).toBe(3);
  });

  it('reports progress while merging', async () => {
    const files = await createTestPdfs(3);
    const progress: number[] = [];

    const result = await executeMergeFiles(
      { files },
      {
        onProgress: (u) => progress.push(u.filesProcessed),
      },
    );

    expect(result.ok).toBe(true);
    expect(progress.length).toBeGreaterThan(0);
    expect(progress.at(-1)).toBe(3);
  });

  it('cancels when AbortSignal is aborted before work', async () => {
    const files = await createTestPdfs(2);
    const controller = new AbortController();
    controller.abort();

    const result = await executeMergeFiles({ files }, { signal: controller.signal });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('cancelled');
  });

  it('cancels mid-merge when signal aborts', async () => {
    const files = await createTestPdfs(5);
    const controller = new AbortController();

    const resultPromise = executeMergeFiles(
      { files },
      {
        signal: controller.signal,
        onProgress: (u) => {
          if (u.filesProcessed >= 1) controller.abort();
        },
      },
    );

    const result = await resultPromise;
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('cancelled');
  });

  it('returns corrupt error for invalid PDF bytes', async () => {
    const good = await createTestPdf('good');
    const result = await executeMergeFiles({
      files: [
        { name: 'good.pdf', bytes: good },
        { name: 'bad.pdf', bytes: new Uint8Array([0, 1, 2, 3, 4]) },
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('corrupt');
    expect(result.error.details?.affectedFiles).toEqual(['bad.pdf']);
  });

  it('merges 30+ PDFs locally without upload', async () => {
    const files = await createTestPdfs(32, 'batch');
    const result = await executeMergeFiles({
      files,
      outputFilename: 'bulk-merged.pdf',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.sourceCount).toBe(32);
    expect(result.value.pageCount).toBe(32);
    expect(result.value.filename).toBe('bulk-merged.pdf');

    const reopened = await PDFDocument.load(result.value.bytes);
    expect(reopened.getPageCount()).toBe(32);
  });

  it('appends .pdf when output filename omits extension', async () => {
    const files = await createTestPdfs(2);
    const result = await executeMergeFiles({
      files,
      outputFilename: 'combined',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.filename).toBe('combined.pdf');
  });
});
