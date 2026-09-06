import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkspaceStore } from './store';

function resetStore() {
  useWorkspaceStore.setState({
    sessionFiles: [],
    files: [],
    filterQuery: '',
    selectedId: null,
    directoryId: null,
    directoryName: null,
  });
}

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('sorts files naturally on setFiles', () => {
    useWorkspaceStore.getState().setFiles([
      { id: 'a', name: '10.pdf', size: 1 },
      { id: 'b', name: '2.pdf', size: 1 },
      { id: 'c', name: '1.pdf', size: 1 },
    ]);
    expect(useWorkspaceStore.getState().files.map((f) => f.name)).toEqual([
      '1.pdf',
      '2.pdf',
      '10.pdf',
    ]);
    expect(useWorkspaceStore.getState().selectedId).toBe('c');
  });

  it('reorders and removes files', () => {
    useWorkspaceStore.getState().setFiles(
      [
        { id: '1', name: 'a.pdf', size: 1 },
        { id: '2', name: 'b.pdf', size: 1 },
        { id: '3', name: 'c.pdf', size: 1 },
      ],
      false,
    );

    useWorkspaceStore.getState().reorder(0, 2);
    expect(useWorkspaceStore.getState().files.map((f) => f.name)).toEqual([
      'b.pdf',
      'c.pdf',
      'a.pdf',
    ]);

    useWorkspaceStore.getState().removeFile('2');
    expect(useWorkspaceStore.getState().files.map((f) => f.id)).toEqual(['3', '1']);
  });

  it('appends without duplicating ids', () => {
    useWorkspaceStore.getState().setFiles([{ id: '1', name: 'a.pdf', size: 1 }], false);
    useWorkspaceStore.getState().appendFiles(
      [
        { id: '1', name: 'a.pdf', size: 1 },
        { id: '2', name: 'b.pdf', size: 1 },
      ],
      false,
    );
    expect(useWorkspaceStore.getState().files).toHaveLength(2);
  });

  it('filters without destroying the session list', () => {
    useWorkspaceStore.getState().setFiles(
      [
        { id: '1', name: 'invoice.pdf', size: 1 },
        { id: '2', name: 'notes.docx', size: 1 },
        { id: '3', name: 'invoice-final.pdf', size: 1 },
      ],
      false,
    );

    useWorkspaceStore.getState().applyFilter('invoice');
    expect(useWorkspaceStore.getState().files.map((f) => f.name)).toEqual([
      'invoice.pdf',
      'invoice-final.pdf',
    ]);
    expect(useWorkspaceStore.getState().sessionFiles).toHaveLength(3);

    useWorkspaceStore.getState().clearFilter();
    expect(useWorkspaceStore.getState().files).toHaveLength(3);
    expect(useWorkspaceStore.getState().filterQuery).toBe('');
  });

  it('restores full list when filter query is cleared via applyFilter', () => {
    useWorkspaceStore.getState().setFiles(
      [
        { id: '1', name: 'a.pdf', size: 1 },
        { id: '2', name: 'b.pdf', size: 1 },
      ],
      false,
    );
    useWorkspaceStore.getState().applyFilter('zzz');
    expect(useWorkspaceStore.getState().files).toHaveLength(0);
    useWorkspaceStore.getState().applyFilter('');
    expect(useWorkspaceStore.getState().files).toHaveLength(2);
  });
});
