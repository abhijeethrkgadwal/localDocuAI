import type { ProgressUpdate } from '@localdoc/core';
import { ProgressBar } from './ProgressBar';

export type FileManageBusyAction =
  | 'rename'
  | 'copy'
  | 'move'
  | 'createFolder'
  | 'export';

interface FileManagePanelProps {
  sortType: string;
  onSortTypeChange: (value: string) => void;
  onSort: () => void;
  filterQuery: string;
  onFilterQueryChange: (value: string) => void;
  onFilter: () => void;
  onClearFilter: () => void;
  filterActive: boolean;
  renamePattern: string;
  onRenamePatternChange: (value: string) => void;
  onRename: () => void;
  onCopy: () => void;
  moveDestination: string;
  onMoveDestinationChange: (value: string) => void;
  onMove: () => void;
  folderName: string;
  onFolderNameChange: (value: string) => void;
  onCreateFolder: () => void;
  canCreateFolder: boolean;
  directoryLabel: string | null;
  onExportAll: () => void;
  disabled: boolean;
  busyAction: FileManageBusyAction | null;
  progress: ProgressUpdate | null;
  hasFiles: boolean;
  status: string | null;
  error: string | null;
  visibleCount?: number;
  sessionCount?: number;
}

export function FileManagePanel({
  sortType,
  onSortTypeChange,
  onSort,
  filterQuery,
  onFilterQueryChange,
  onFilter,
  onClearFilter,
  filterActive,
  renamePattern,
  onRenamePatternChange,
  onRename,
  onCopy,
  moveDestination,
  onMoveDestinationChange,
  onMove,
  folderName,
  onFolderNameChange,
  onCreateFolder,
  canCreateFolder,
  directoryLabel,
  onExportAll,
  disabled,
  busyAction,
  progress,
  hasFiles,
  status,
  error,
  visibleCount,
  sessionCount,
}: FileManagePanelProps) {
  const noFilterResults =
    filterActive && typeof visibleCount === 'number' && visibleCount === 0;

  const progressLabel =
    progress && progress.totalFiles > 1
      ? `Exporting ${progress.filesProcessed} of ${progress.totalFiles} documents`
      : (progress?.message ?? 'Working…');

  return (
    <section className="panel" aria-labelledby="organize-heading" aria-busy={disabled}>
      <h2 id="organize-heading" className="panel-title">
        Organize files
      </h2>
      <p className="panel-desc">
        Sort, filter, rename, and export stay on this device.
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <p className="group-label">View / Filter</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span className="field-label">Sort</span>
              <div className="flex gap-2">
                <select
                  className="select"
                  value={sortType}
                  disabled={disabled || !hasFiles}
                  onChange={(e) => onSortTypeChange(e.target.value)}
                >
                  <option value="natural_filename">Natural name</option>
                  <option value="alphabetical">A–Z</option>
                  <option value="modified_asc">Oldest first</option>
                  <option value="modified_desc">Newest first</option>
                </select>
                <button
                  type="button"
                  disabled={disabled || !hasFiles}
                  onClick={onSort}
                  className="btn btn-secondary shrink-0"
                >
                  Apply
                </button>
              </div>
            </label>

            <label className="field">
              <span className="field-label">Filter</span>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Name contains…"
                  value={filterQuery}
                  disabled={disabled || (!hasFiles && !filterActive)}
                  onChange={(e) => onFilterQueryChange(e.target.value)}
                />
                <button
                  type="button"
                  disabled={disabled || (!hasFiles && !filterActive)}
                  onClick={onFilter}
                  className="btn btn-secondary shrink-0"
                >
                  Apply
                </button>
                {filterActive ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={onClearFilter}
                    className="btn btn-ghost shrink-0"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </label>
          </div>
          {noFilterResults ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]" role="status">
              No documents match this filter.
              {typeof sessionCount === 'number' ? ` (${sessionCount} in session)` : null}
            </p>
          ) : null}
        </div>

        <div>
          <p className="group-label">Rename</p>
          <label className="field">
            <span className="field-label">Rename pattern</span>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="{name}_{nn}"
                value={renamePattern}
                disabled={disabled || !hasFiles}
                onChange={(e) => onRenamePatternChange(e.target.value)}
                aria-describedby="rename-tokens"
              />
              <button
                type="button"
                disabled={disabled || !hasFiles}
                onClick={onRename}
                className="btn btn-secondary shrink-0"
                aria-busy={busyAction === 'rename'}
              >
                {busyAction === 'rename' ? 'Renaming…' : 'Rename'}
              </button>
            </div>
            <span id="rename-tokens" className="mt-1 block text-xs text-[var(--text-tertiary)]">
              Tokens: {'{name}'}, {'{ext}'}, {'{n}'}, {'{nn}'}
            </span>
          </label>
        </div>

        <div>
          <p className="group-label">File actions</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || !hasFiles}
              onClick={onCopy}
              className="btn btn-secondary"
              aria-busy={busyAction === 'copy'}
            >
              {busyAction === 'copy' ? 'Duplicating…' : 'Duplicate'}
            </button>
            <button
              type="button"
              disabled={disabled || !hasFiles}
              onClick={onExportAll}
              className="btn btn-secondary"
              aria-busy={busyAction === 'export'}
            >
              {busyAction === 'export' ? 'Exporting…' : 'Export'}
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span className="field-label">Move (session path — not on disk)</span>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="archive"
                  value={moveDestination}
                  disabled={disabled || !hasFiles}
                  onChange={(e) => onMoveDestinationChange(e.target.value)}
                />
                <button
                  type="button"
                  disabled={disabled || !hasFiles}
                  onClick={onMove}
                  className="btn btn-secondary shrink-0"
                  aria-busy={busyAction === 'move'}
                >
                  {busyAction === 'move' ? 'Moving…' : 'Move'}
                </button>
              </div>
            </label>

            <label className="field">
              <span className="field-label">
                Create folder{directoryLabel ? ` in “${directoryLabel}”` : ''}
              </span>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="exports"
                  value={folderName}
                  disabled={disabled || !canCreateFolder}
                  onChange={(e) => onFolderNameChange(e.target.value)}
                  aria-describedby={!canCreateFolder ? 'create-folder-hint' : undefined}
                />
                <button
                  type="button"
                  disabled={disabled || !canCreateFolder}
                  onClick={onCreateFolder}
                  className="btn btn-secondary shrink-0"
                  aria-busy={busyAction === 'createFolder'}
                >
                  {busyAction === 'createFolder' ? 'Creating…' : 'Create'}
                </button>
              </div>
              {!canCreateFolder ? (
                <span
                  id="create-folder-hint"
                  className="mt-1 block text-xs text-[var(--text-tertiary)]"
                >
                  Select a folder first (Chrome/Edge) to create a subfolder.
                </span>
              ) : null}
            </label>
          </div>
        </div>
      </div>

      {busyAction && progress ? (
        <ProgressBar
          label={progressLabel}
          filesProcessed={progress.filesProcessed}
          totalFiles={progress.totalFiles}
          fraction={progress.fraction}
        />
      ) : busyAction ? (
        <p className="mt-4 text-sm text-[var(--text-secondary)]" role="status" aria-live="polite">
          {busyAction === 'rename'
            ? 'Renaming files…'
            : busyAction === 'copy'
              ? 'Duplicating files…'
              : busyAction === 'move'
                ? 'Updating session paths…'
                : busyAction === 'createFolder'
                  ? 'Creating folder…'
                  : 'Working…'}
        </p>
      ) : null}

      {status && !busyAction ? (
        <p className="mt-4 text-sm text-[var(--accent)]" role="status">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
