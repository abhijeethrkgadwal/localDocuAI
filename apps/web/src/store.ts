import { create } from 'zustand';
import {
  SortingType,
  filterFiles,
  sortFiles,
  type LocalFileRef,
  type SortingSpec,
} from '@localdoc/core';

function applyVisibleFilter(sessionFiles: LocalFileRef[], filterQuery: string): LocalFileRef[] {
  const query = filterQuery.trim();
  if (!query) return sessionFiles;
  return filterFiles(sessionFiles, {
    query,
    extensions: ['pdf', 'docx'],
  });
}

function pickSelectedId(
  files: LocalFileRef[],
  preferredId: string | null,
): string | null {
  if (preferredId && files.some((f) => f.id === preferredId)) return preferredId;
  return files[0]?.id ?? null;
}

interface WorkspaceState {
  /** Full session set — never destroyed by filter. */
  sessionFiles: LocalFileRef[];
  /** Visible list (filtered view of sessionFiles). */
  files: LocalFileRef[];
  filterQuery: string;
  selectedId: string | null;
  /** Last picked directory id for CREATE_FOLDER (Chrome/Edge). */
  directoryId: string | null;
  directoryName: string | null;
  setFiles: (files: LocalFileRef[], sort?: boolean) => void;
  appendFiles: (files: LocalFileRef[], sort?: boolean) => void;
  setDirectory: (id: string | null, name?: string | null) => void;
  reorder: (from: number, to: number) => void;
  removeFile: (id: string) => void;
  selectFile: (id: string | null) => void;
  replaceFiles: (files: LocalFileRef[]) => void;
  applySort: (sorting: SortingSpec) => void;
  applyFilter: (query: string) => void;
  clearFilter: () => void;
  clear: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  sessionFiles: [],
  files: [],
  filterQuery: '',
  selectedId: null,
  directoryId: null,
  directoryName: null,
  setFiles: (files, sort = true) => {
    const next = sort ? sortFiles(files, { type: SortingType.NATURAL_FILENAME }) : files;
    set({
      sessionFiles: next,
      filterQuery: '',
      files: next,
      selectedId: next[0]?.id ?? null,
    });
  },
  appendFiles: (files, sort = true) =>
    set((state) => {
      const seen = new Set(state.sessionFiles.map((f) => f.id));
      const merged = [...state.sessionFiles, ...files.filter((f) => !seen.has(f.id))];
      const sessionFiles = sort
        ? sortFiles(merged, { type: SortingType.NATURAL_FILENAME })
        : merged;
      const visible = applyVisibleFilter(sessionFiles, state.filterQuery);
      return {
        sessionFiles,
        files: visible,
        selectedId: pickSelectedId(visible, state.selectedId),
      };
    }),
  setDirectory: (id, name = null) => set({ directoryId: id, directoryName: name }),
  reorder: (from, to) =>
    set((state) => {
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= state.files.length ||
        to >= state.files.length
      ) {
        return state;
      }
      const visible = [...state.files];
      const [item] = visible.splice(from, 1);
      if (!item) return state;
      visible.splice(to, 0, item);

      // Preserve hidden (filtered-out) files; rewrite order of visible ids in session.
      if (!state.filterQuery.trim()) {
        return { files: visible, sessionFiles: visible };
      }
      const visibleIds = new Set(visible.map((f) => f.id));
      const hidden = state.sessionFiles.filter((f) => !visibleIds.has(f.id));
      return { files: visible, sessionFiles: [...visible, ...hidden] };
    }),
  removeFile: (id) =>
    set((state) => {
      const sessionFiles = state.sessionFiles.filter((f) => f.id !== id);
      const files = applyVisibleFilter(sessionFiles, state.filterQuery);
      return {
        sessionFiles,
        files,
        selectedId: pickSelectedId(files, state.selectedId === id ? null : state.selectedId),
      };
    }),
  selectFile: (id) => set({ selectedId: id }),
  replaceFiles: (files) =>
    set((state) => {
      const sessionFiles = files;
      const visible = applyVisibleFilter(sessionFiles, state.filterQuery);
      return {
        sessionFiles,
        files: visible,
        selectedId: pickSelectedId(visible, state.selectedId),
      };
    }),
  applySort: (sorting) => {
    const sessionFiles = sortFiles(get().sessionFiles, sorting);
    const files = applyVisibleFilter(sessionFiles, get().filterQuery);
    set({
      sessionFiles,
      files,
      selectedId: pickSelectedId(files, get().selectedId),
    });
  },
  applyFilter: (query) => {
    const filterQuery = query.trim();
    const files = applyVisibleFilter(get().sessionFiles, filterQuery);
    set({
      filterQuery,
      files,
      selectedId: pickSelectedId(files, get().selectedId),
    });
  },
  clearFilter: () => {
    const sessionFiles = get().sessionFiles;
    set({
      filterQuery: '',
      files: sessionFiles,
      selectedId: pickSelectedId(sessionFiles, get().selectedId),
    });
  },
  clear: () =>
    set({
      sessionFiles: [],
      files: [],
      filterQuery: '',
      selectedId: null,
      directoryId: null,
      directoryName: null,
    }),
}));
