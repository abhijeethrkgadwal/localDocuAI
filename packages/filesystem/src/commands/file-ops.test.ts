import { describe, expect, it } from 'vitest';
import { SortingType, applyRenamePattern } from '@localdoc/core';
import {
  createMemoryFilesystemAdapter,
  executeCopyFiles,
  executeCreateFolder,
  executeFilterFiles,
  executeMoveFiles,
  executeRenameFiles,
  executeSortFiles,
  fileCommandRegistry,
} from '../index.js';

describe('applyRenamePattern', () => {
  it('expands tokens', () => {
    expect(applyRenamePattern('invoice.pdf', '{name}_{nn}', 3)).toBe('invoice_03.pdf');
    expect(applyRenamePattern('a.pdf', 'doc-{n}', 1)).toBe('doc-1.pdf');
  });
});

describe('fileCommandRegistry', () => {
  it('registers file-management commands', () => {
    const names = fileCommandRegistry.list().map((c) => c.name).sort();
    expect(names).toEqual([
      'COPY_FILES',
      'CREATE_FOLDER',
      'FILTER_FILES',
      'MOVE_FILES',
      'RENAME_FILES',
      'SORT_FILES',
    ]);
  });
});

describe('file management commands', () => {
  it('sorts files naturally', async () => {
    const result = await executeSortFiles({
      files: [
        { id: '1', name: '10.pdf', size: 1 },
        { id: '2', name: '2.pdf', size: 1 },
      ],
      sorting: { type: SortingType.NATURAL_FILENAME },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.files.map((f) => f.name)).toEqual(['2.pdf', '10.pdf']);
  });

  it('filters by query and extension', async () => {
    const result = await executeFilterFiles({
      files: [
        { id: '1', name: 'alpha.pdf', size: 1 },
        { id: '2', name: 'beta.txt', size: 1 },
        { id: '3', name: 'alpha-report.pdf', size: 1 },
      ],
      query: 'alpha',
      extensions: ['pdf'],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.matchedCount).toBe(2);
  });

  it('renames files in session via adapter', async () => {
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [
        { name: 'a.pdf', bytes: new Uint8Array([1]) },
        { name: 'b.pdf', bytes: new Uint8Array([2]) },
      ],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const result = await executeRenameFiles(
      { files: picked.value, pattern: 'doc-{n}' },
      undefined,
      adapter,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.files.map((f) => f.name)).toEqual(['doc-1.pdf', 'doc-2.pdf']);
    expect(result.value.renamedCount).toBe(2);
  });

  it('copies files in session', async () => {
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [{ name: 'a.pdf', bytes: new Uint8Array([9]) }],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const result = await executeCopyFiles({ files: picked.value }, undefined, adapter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.copiedCount).toBe(1);
    expect(result.value.files[0]?.name).toBe('a_copy.pdf');
  });

  it('updates session paths on move', async () => {
    const result = await executeMoveFiles({
      files: [{ id: '1', name: 'a.pdf', size: 1, path: 'inbox/a.pdf' }],
      destination: 'archive',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.files[0]?.path).toBe('archive/a.pdf');
  });

  it('creates a folder under a picked directory', async () => {
    const adapter = createMemoryFilesystemAdapter({
      pickDirectoryResult: { name: 'root', files: [] },
    });
    const picked = await adapter.pickDirectory();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const result = await executeCreateFolder(
      {
        parentDirectoryId: picked.value.directory.id,
        folderName: 'exports',
      },
      undefined,
      adapter,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.directory.name).toBe('exports');
  });
});
