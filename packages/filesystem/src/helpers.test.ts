import { describe, expect, it } from 'vitest';
import { Permission } from '@localdoc/core';
import {
  createMemoryFilesystemAdapter,
  describeCapabilities,
  filterByExtension,
  matchesExtension,
  readAllBytes,
} from '../src/index.js';

describe('@localdoc/filesystem helpers', () => {
  it('matches extensions with or without a leading dot', () => {
    expect(matchesExtension('a.pdf', ['pdf'])).toBe(true);
    expect(matchesExtension('a.pdf', ['.pdf'])).toBe(true);
    expect(matchesExtension('a.txt', ['pdf'])).toBe(false);
  });

  it('filters file refs by extension', () => {
    const files = [
      { id: '1', name: 'a.pdf', size: 1 },
      { id: '2', name: 'b.txt', size: 1 },
    ];
    expect(filterByExtension(files, ['pdf']).map((f) => f.name)).toEqual(['a.pdf']);
  });

  it('describes chromium capabilities', () => {
    const text = describeCapabilities({
      supportsDirectoryPicker: true,
      supportsFilePicker: true,
      supportsWriteToHandle: true,
      supportsBlobDownload: true,
      supportsSessionMutation: true,
      supportsCreateFolder: true,
    });
    expect(text.toLowerCase()).toContain('folder');
  });
});

describe('@localdoc/filesystem memory adapter', () => {
  it('picks a directory and filters to PDFs', async () => {
    const adapter = createMemoryFilesystemAdapter({
      pickDirectoryResult: {
        name: 'docs',
        files: [
          { name: '1.pdf', bytes: new Uint8Array([1]) },
          { name: 'notes.txt', bytes: new Uint8Array([2]) },
          { name: '2.pdf', bytes: new Uint8Array([3]) },
        ],
      },
    });

    const result = await adapter.pickDirectory({ extensions: ['pdf'] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.files.map((f) => f.name)).toEqual(['1.pdf', '2.pdf']);
    expect(result.value.directory.name).toBe('docs');
  });

  it('lists a previously picked directory', async () => {
    const adapter = createMemoryFilesystemAdapter({
      pickDirectoryResult: {
        name: 'docs',
        files: [{ name: 'a.pdf', bytes: new Uint8Array([9]) }],
      },
    });

    const picked = await adapter.pickDirectory();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const listed = await adapter.listDirectory(picked.value.directory.id);
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.value[0]?.name).toBe('a.pdf');
  });

  it('reads files sequentially with progress', async () => {
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [
        { name: 'a.pdf', bytes: new Uint8Array([1, 2]) },
        { name: 'b.pdf', bytes: new Uint8Array([3, 4, 5]) },
      ],
    });

    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const progress: number[] = [];
    const bytes = await readAllBytes(adapter, picked.value, {
      onProgress: (u) => progress.push(u.filesProcessed),
    });

    expect(bytes.ok).toBe(true);
    if (!bytes.ok) return;
    expect(bytes.value).toHaveLength(2);
    expect(bytes.value[0]?.bytes).toEqual(new Uint8Array([1, 2]));
    expect(progress.at(-1)).toBe(2);
  });

  it('honors AbortSignal during readAllBytes', async () => {
    const adapter = createMemoryFilesystemAdapter({
      pickFilesResult: [
        { name: 'a.pdf', bytes: new Uint8Array([1]) },
        { name: 'b.pdf', bytes: new Uint8Array([2]) },
      ],
    });
    const picked = await adapter.pickFiles();
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;

    const controller = new AbortController();
    controller.abort();

    const result = await readAllBytes(adapter, picked.value, { signal: controller.signal });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('cancelled');
  });

  it('reports unsupported folder pick when capability is off', async () => {
    const adapter = createMemoryFilesystemAdapter({
      capabilities: { supportsDirectoryPicker: false },
    });
    const result = await adapter.pickDirectory();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('unsupported');
    expect(result.error.recovery).toBeTruthy();
  });

  it('returns not_found for unknown file ids', async () => {
    const adapter = createMemoryFilesystemAdapter();
    const result = await adapter.readBytes({ id: 'missing', name: 'gone.pdf', size: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('not_found');
    expect(result.error.recovery).toBeTruthy();
  });

  it('denies list_directory permission when directory picker unsupported', () => {
    const adapter = createMemoryFilesystemAdapter({
      capabilities: { supportsDirectoryPicker: false },
    });
    expect(adapter.hasPermission(Permission.LIST_DIRECTORY)).toBe(false);
    expect(adapter.hasPermission(Permission.READ_FILES)).toBe(true);
  });
});
