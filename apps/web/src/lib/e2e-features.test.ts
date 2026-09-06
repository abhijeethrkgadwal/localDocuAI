/**
 * End-to-end feature harness: exercises every shipped command path the same
 * way the web UI does (memory FS + merge/pdf workflows + file-manage cmds).
 */
import { describe, expect, it } from 'vitest';
import {
  SortingType,
  filterFiles,
  sortFiles,
  type LocalFileRef,
} from '@localdoc/core';
import {
  createMemoryFilesystemAdapter,
  executeCopyFiles,
  executeCreateFolder,
  executeMoveFiles,
  executeRenameFiles,
  readAllBytes,
} from '@localdoc/filesystem';
import {
  appCommandRegistry,
  assertCommandAllowed,
  listAiSelectableCommands,
  listRegisteredCommandNames,
} from '@localdoc/orchestration';
import { createTestDocx, executeExtractDocxText } from '@localdoc/docx';
import { createTestPdf } from './test-imports.js';
import { runLocalDocumentMerge } from './mergeWorkflow.js';
import { runSinglePdfOp } from './pdfOpsWorkflow.js';

const ALL_COMMANDS = [
  'COPY_FILES',
  'CREATE_FOLDER',
  'DELETE_PAGES',
  'EXTRACT_PAGES',
  'FILTER_FILES',
  'MERGE_FILES',
  'MOVE_FILES',
  'RENAME_FILES',
  'REORDER_PAGES',
  'ROTATE_PAGES',
  'SORT_FILES',
  'SPLIT_FILE',
] as const;

async function seedPdfs(
  files: { name: string; bytes: Uint8Array; path?: string }[],
) {
  const adapter = createMemoryFilesystemAdapter({ pickFilesResult: files });
  const picked = await adapter.pickFiles();
  if (!picked.ok) throw new Error(picked.error.message);
  return { adapter, files: picked.value };
}

describe('E2E: all shipped features', () => {
  it('registry exposes all 12 commands and rejects invented ones', () => {
    expect(listRegisteredCommandNames().sort()).toEqual([...ALL_COMMANDS].sort());
    expect(listAiSelectableCommands().length).toBe(12);
    expect(assertCommandAllowed('MERGE_FILES').ok).toBe(true);
    expect(assertCommandAllowed('HACK_DEVICE').ok).toBe(false);
    for (const name of ALL_COMMANDS) {
      expect(appCommandRegistry.has(name)).toBe(true);
    }
  });

  it('MERGE_FILES (PDF): pick → merge → save locally', async () => {
    const a = await createTestPdf('Invoice A', { pageCount: 2 });
    const b = await createTestPdf('Invoice B', { pageCount: 1 });
    const { adapter, files } = await seedPdfs([
      { name: 'invoice-a.pdf', bytes: a },
      { name: 'invoice-b.pdf', bytes: b },
    ]);

    const result = await runLocalDocumentMerge(adapter, files, {
      outputFilename: 'invoices-merged.pdf',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.pageCount).toBe(3);
    expect(result.value.sourceCount).toBe(2);
    expect(result.value.saveMethod).toBe('handle');
    expect(result.value.message).toMatch(/Merged 2 PDFs/);
  });

  it('MERGE_FILES (DOCX): pick → merge → save locally', async () => {
    const a = await createTestDocx('Letter A', { withTable: true });
    const b = await createTestDocx('Letter B', { withPageBreak: true });
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [
        { name: 'letter-a.docx', bytes: a },
        { name: 'letter-b.docx', bytes: b },
      ],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const result = await runLocalDocumentMerge(adapter, picked.value, {
      outputFilename: 'letters-merged.docx',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.sourceCount).toBe(2);
    expect(result.value.filename).toBe('letters-merged.docx');
    expect(result.value.fidelityNote).toBeTruthy();
  });

  it('MERGE_FILES rejects mixed PDF+DOCX (UI validation path)', async () => {
    const pdf = await createTestPdf('P');
    const docx = await createTestDocx('D');
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [
        { name: 'a.pdf', bytes: pdf },
        { name: 'b.docx', bytes: docx },
      ],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const result = await runLocalDocumentMerge(adapter, picked.value);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('validation');
    expect(result.error.message).toMatch(/same type/i);
  });

  it('SPLIT_FILE: multi-page PDF → one file per page', async () => {
    const bytes = await createTestPdf('Multi', { pageCount: 3 });
    const { adapter, files } = await seedPdfs([{ name: 'multi.pdf', bytes }]);
    const result = await runSinglePdfOp(adapter, files[0]!, 'split');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.savedCount).toBe(3);
    expect(result.value.message).toMatch(/Split into 3/);
  });

  it('EXTRACT_PAGES: keeps requested pages', async () => {
    const bytes = await createTestPdf('Src', { pageCount: 4 });
    const { adapter, files } = await seedPdfs([{ name: 'src.pdf', bytes }]);
    const result = await runSinglePdfOp(adapter, files[0]!, 'extract', {
      pageSpec: '1,3',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.savedCount).toBe(1);
    expect(result.value.message).toMatch(/1, 3/);
  });

  it('DELETE_PAGES: removes requested pages', async () => {
    const bytes = await createTestPdf('Src', { pageCount: 3 });
    const { adapter, files } = await seedPdfs([{ name: 'src.pdf', bytes }]);
    const result = await runSinglePdfOp(adapter, files[0]!, 'delete', {
      pageSpec: '2',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.message).toMatch(/Deleted pages 2/);
  });

  it('ROTATE_PAGES: rotates selected pages', async () => {
    const bytes = await createTestPdf('Src', { pageCount: 2 });
    const { adapter, files } = await seedPdfs([{ name: 'src.pdf', bytes }]);
    const result = await runSinglePdfOp(adapter, files[0]!, 'rotate', {
      pageSpec: '1',
      rotation: 90,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.message).toMatch(/Rotated 1 page/);
  });

  it('REORDER_PAGES: applies full page order', async () => {
    const bytes = await createTestPdf('Src', { pageCount: 3 });
    const { adapter, files } = await seedPdfs([{ name: 'src.pdf', bytes }]);
    const result = await runSinglePdfOp(adapter, files[0]!, 'reorder', {
      orderSpec: '3,1,2',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.message).toMatch(/3, 1, 2/);
  });

  it('SORT_FILES + FILTER_FILES (session organize)', async () => {
    const refs: LocalFileRef[] = [
      { id: '1', name: '10-report.pdf', size: 10 },
      { id: '2', name: '2-notes.pdf', size: 10 },
      { id: '3', name: 'alpha.docx', size: 10 },
      { id: '4', name: 'readme.txt', size: 10 },
    ];
    const sorted = sortFiles(refs, { type: SortingType.NATURAL_FILENAME });
    expect(sorted.map((f) => f.name)).toEqual([
      '2-notes.pdf',
      '10-report.pdf',
      'alpha.docx',
      'readme.txt',
    ]);
    const filtered = filterFiles(sorted, {
      query: 'report',
      extensions: ['pdf', 'docx'],
    });
    expect(filtered.map((f) => f.name)).toEqual(['10-report.pdf']);
  });

  it('RENAME_FILES + COPY_FILES + MOVE_FILES + export read', async () => {
    const a = await createTestPdf('A');
    const b = await createTestPdf('B');
    const { adapter, files } = await seedPdfs([
      { name: 'a.pdf', bytes: a },
      { name: 'b.pdf', bytes: b },
    ]);

    const renamed = await executeRenameFiles(
      { files, pattern: '{name}_{nn}' },
      undefined,
      adapter,
    );
    expect(renamed.ok).toBe(true);
    if (!renamed.ok) return;
    expect(renamed.value.files.map((f) => f.name)).toEqual(['a_01.pdf', 'b_02.pdf']);

    const copied = await executeCopyFiles(
      { files: renamed.value.files },
      undefined,
      adapter,
    );
    expect(copied.ok).toBe(true);
    if (!copied.ok) return;
    expect(copied.value.copiedCount).toBe(2);
    expect(copied.value.files.every((f) => f.name.includes('_copy'))).toBe(true);

    const moved = await executeMoveFiles({
      files: renamed.value.files,
      destination: 'archive',
    });
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.value.files.every((f) => f.path?.startsWith('archive/'))).toBe(true);

    const exported = await readAllBytes(adapter, renamed.value.files);
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;
    expect(exported.value).toHaveLength(2);
    for (const file of exported.value) {
      const written = await adapter.writeBytes(file.bytes, {
        suggestedName: `export-${file.name}`,
      });
      expect(written.ok).toBe(true);
    }
  });

  it('CREATE_FOLDER under picked directory', async () => {
    const adapter = createMemoryFilesystemAdapter({
      pickDirectoryResult: {
        name: 'workspace',
        files: [{ name: 'seed.pdf', bytes: await createTestPdf('seed') }],
      },
    });
    const picked = await adapter.pickDirectory();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;
    expect(picked.value.files.length).toBe(1);

    const created = await executeCreateFolder(
      {
        parentDirectoryId: picked.value.directory.id,
        folderName: 'exports',
      },
      undefined,
      adapter,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.directory.name).toBe('exports');
  });

  it('Preview path: PDF bytes load; DOCX text extracts', async () => {
    const pdfBytes = await createTestPdf('Preview PDF');
    const docxBytes = await createTestDocx('Preview DOCX');
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [
        { name: 'preview.pdf', bytes: pdfBytes },
        { name: 'preview.docx', bytes: docxBytes },
      ],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const pdfFile = picked.value.find((f) => f.name.endsWith('.pdf'))!;
    const docxFile = picked.value.find((f) => f.name.endsWith('.docx'))!;

    const pdfRead = await adapter.readBytes(pdfFile);
    expect(pdfRead.ok).toBe(true);
    if (!pdfRead.ok) return;
    // PDF header present — browser preview builds a blob from these bytes.
    expect(new TextDecoder().decode(pdfRead.value.slice(0, 5))).toBe('%PDF-');

    const docxRead = await adapter.readBytes(docxFile);
    expect(docxRead.ok).toBe(true);
    if (!docxRead.ok) return;
    const text = await executeExtractDocxText({
      file: { name: docxFile.name, bytes: docxRead.value },
    });
    expect(text.ok).toBe(true);
    if (!text.ok) return;
    expect(text.value.text).toMatch(/Preview DOCX/);
  });

  it('Cancel mid-merge surfaces cancelled error (UI Cancel path)', async () => {
    const files = [];
    for (let i = 0; i < 8; i++) {
      files.push({
        name: `bulk-${i}.pdf`,
        bytes: await createTestPdf(`bulk-${i}`),
      });
    }
    const { adapter, files: refs } = await seedPdfs(files);
    const controller = new AbortController();
    controller.abort();
    const result = await runLocalDocumentMerge(adapter, refs, {
      signal: controller.signal,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('cancelled');
  });

  it('Corrupt PDF surfaces recovery + affectedFiles (UI error panel)', async () => {
    const good = await createTestPdf('good');
    const { adapter, files } = await seedPdfs([
      { name: 'good.pdf', bytes: good },
      { name: 'broken.pdf', bytes: new Uint8Array([0, 1, 2, 3, 4]) },
    ]);
    const result = await runLocalDocumentMerge(adapter, files);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('corrupt');
    expect(result.error.affectedFiles).toContain('broken.pdf');
    expect(result.error.recovery).toBeTruthy();
  });
});
