import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  executeDeletePages,
  executeExtractPages,
  executeReorderPages,
  executeRotatePages,
  executeSplitFile,
  parsePageSpec,
  pdfCommandRegistry,
} from '../src/index.js';
import { createTestPdf } from '../src/test-utils.js';

describe('parsePageSpec', () => {
  it('parses ranges and singles', () => {
    const result = parsePageSpec('1-3,5', 6);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual([1, 2, 3, 5]);
  });

  it('rejects out-of-range pages', () => {
    const result = parsePageSpec('1,9', 3);
    expect(result.ok).toBe(false);
  });
});

describe('pdfCommandRegistry', () => {
  it('registers all Step 7 PDF commands', () => {
    const names = pdfCommandRegistry.list().map((c) => c.name).sort();
    expect(names).toEqual([
      'COMPRESS_PDF',
      'DELETE_PAGES',
      'EXTRACT_PAGES',
      'MERGE_FILES',
      'REORDER_PAGES',
      'ROTATE_PAGES',
      'SPLIT_FILE',
    ]);
  });
});

describe('page commands', () => {
  it('splits a multi-page PDF into one file per page', async () => {
    const bytes = await createTestPdf('split-me', { pageCount: 3 });
    const result = await executeSplitFile({
      file: { name: 'doc.pdf', bytes },
      outputBasename: 'part',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.files).toHaveLength(3);
    expect(result.value.files[0]?.filename).toBe('part-1.pdf');
    const first = await PDFDocument.load(result.value.files[0]!.bytes);
    expect(first.getPageCount()).toBe(1);
  });

  it('extracts a page range', async () => {
    const bytes = await createTestPdf('extract', { pageCount: 4 });
    const result = await executeExtractPages({
      file: { name: 'doc.pdf', bytes },
      pageSpec: '2-3',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.pageCount).toBe(2);
    expect(result.value.extractedPages).toEqual([2, 3]);
  });

  it('deletes pages and keeps the rest', async () => {
    const bytes = await createTestPdf('delete', { pageCount: 4 });
    const result = await executeDeletePages({
      file: { name: 'doc.pdf', bytes },
      pages: [2, 4],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.pageCount).toBe(2);
    expect(result.value.deletedPages).toEqual([2, 4]);
  });

  it('refuses deleting all pages', async () => {
    const bytes = await createTestPdf('delete-all', { pageCount: 2 });
    const result = await executeDeletePages({
      file: { name: 'doc.pdf', bytes },
      pageSpec: '1-2',
    });
    expect(result.ok).toBe(false);
  });

  it('rotates selected pages', async () => {
    const bytes = await createTestPdf('rotate', { pageCount: 2 });
    const result = await executeRotatePages({
      file: { name: 'doc.pdf', bytes },
      rotation: 90,
      pages: [1],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rotatedPages).toEqual([1]);
    const doc = await PDFDocument.load(result.value.bytes);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(0);
  });

  it('reorders pages', async () => {
    const bytes = await createTestPdf('reorder', { pageCount: 3 });
    const result = await executeReorderPages({
      file: { name: 'doc.pdf', bytes },
      order: [3, 1, 2],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order).toEqual([3, 1, 2]);
    expect(result.value.pageCount).toBe(3);
  });

  it('rejects invalid reorder permutations', async () => {
    const bytes = await createTestPdf('bad-order', { pageCount: 3 });
    const result = await executeReorderPages({
      file: { name: 'doc.pdf', bytes },
      order: [1, 2],
    });
    expect(result.ok).toBe(false);
  });
});
