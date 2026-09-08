import { describe, expect, it } from 'vitest';
import {
  CommandName,
  SortingType,
  compareNaturalFilename,
  createCommandRegistry,
  err,
  isDocFile,
  isDocxFile,
  isPdfFile,
  isWordFile,
  ok,
  parseWithSchema,
  sortFiles,
  validationError,
} from '../src/index.js';
import { z } from 'zod';

describe('@localdoc/core', () => {
  it('exposes Phase 1–2 PDF command names', () => {
    expect(CommandName.MERGE_FILES).toBe('MERGE_FILES');
    expect(CommandName.SPLIT_FILE).toBe('SPLIT_FILE');
    expect(CommandName.EXTRACT_PAGES).toBe('EXTRACT_PAGES');
  });

  it('builds Result helpers', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err(validationError('bad')).ok).toBe(false);
  });

  it('sorts filenames naturally', () => {
    const files = [{ name: '10.pdf' }, { name: '2.pdf' }, { name: '1.pdf' }];
    const sorted = sortFiles(files, { type: SortingType.NATURAL_FILENAME });
    expect(sorted.map((f) => f.name)).toEqual(['1.pdf', '2.pdf', '10.pdf']);
  });

  it('compareNaturalFilename orders numeric segments', () => {
    expect(compareNaturalFilename('file2.pdf', 'file10.pdf')).toBeLessThan(0);
  });

  it('detects PDF files', () => {
    expect(isPdfFile({ name: 'doc.pdf' })).toBe(true);
    expect(isPdfFile({ name: 'doc.txt', mimeType: 'application/pdf' })).toBe(true);
    expect(isPdfFile({ name: 'doc.txt' })).toBe(false);
  });

  it('detects Word DOC and DOCX files', () => {
    expect(isDocxFile({ name: 'a.docx' })).toBe(true);
    expect(isDocFile({ name: 'a.doc' })).toBe(true);
    expect(isDocFile({ name: 'a.docx' })).toBe(false);
    expect(isWordFile({ name: 'a.doc' })).toBe(true);
    expect(isWordFile({ name: 'a.docx' })).toBe(true);
    expect(isWordFile({ name: 'a.pdf' })).toBe(false);
  });

  it('parseWithSchema returns validation errors', () => {
    const schema = z.object({ count: z.number().min(2) });
    const result = parseWithSchema(schema, { count: 1 });
    expect(result.ok).toBe(false);
  });

  it('registry validates permissions', () => {
    const registry = createCommandRegistry();
    expect(registry.has(CommandName.MERGE_FILES)).toBe(false);
  });
});
