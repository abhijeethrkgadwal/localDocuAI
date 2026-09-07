import { CommandName } from '@localdoc/core';
import { describe, expect, it } from 'vitest';
import {
  COMMAND_CATALOG,
  appCommandRegistry,
  assertCommandAllowed,
  assertRegistryMatchesCatalog,
  createAppCommandRegistry,
  listAiSelectableCommands,
  listRegisteredCommandNames,
} from '../src/index.js';

describe('@localdoc/orchestration registry', () => {
  it('registers all implemented command names once', () => {
    const names = listRegisteredCommandNames().sort();
    expect(names).toEqual(
      [
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
      ].sort(),
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it('matches catalog coverage', () => {
    const result = assertRegistryMatchesCatalog(appCommandRegistry);
    expect(result.ok).toBe(true);
  });

  it('exposes AI-selectable names only from the catalog', () => {
    const ai = listAiSelectableCommands();
    expect(ai).toContain(CommandName.MERGE_FILES);
    expect(ai).toContain(CommandName.SORT_FILES);
    expect(ai.every((name) => COMMAND_CATALOG.some((e) => e.name === name))).toBe(true);
  });

  it('allows known commands and rejects invented ones', () => {
    expect(assertCommandAllowed('MERGE_FILES').ok).toBe(true);
    const rejected = assertCommandAllowed('DELETE_EVERYTHING');
    expect(rejected.ok).toBe(false);
    if (rejected.ok) return;
    expect(rejected.error.category).toBe('unsupported');
  });

  it('createAppCommandRegistry returns an independent instance', () => {
    const a = createAppCommandRegistry();
    const b = createAppCommandRegistry();
    expect(a.list().length).toBe(b.list().length);
    expect(a.has(CommandName.SPLIT_FILE)).toBe(true);
  });

  it('documents merge engines for pdf and docx', () => {
    const merge = COMMAND_CATALOG.find((e) => e.name === 'MERGE_FILES');
    expect(merge?.engines).toEqual(['pdf', 'docx']);
  });
});
