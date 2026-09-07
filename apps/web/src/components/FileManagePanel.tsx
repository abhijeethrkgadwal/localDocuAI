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
  hasFiles: boolean;
  status: string | null;
  error: string | null;
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
  hasFiles,
  status,
  error,
}: FileManagePanelProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 shadow-sm">
      <h2 className="text-xl font-medium">Organize files</h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Sort, filter, rename, copy, and export stay on this device. Create-folder needs a selected
        folder in Chrome/Edge.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[var(--ink-muted)]">Sort</span>
          <div className="mt-1 flex gap-2">
            <select
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
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
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </label>

        <label className="block text-sm">
          <span className="text-[var(--ink-muted)]">Filter</span>
          <div className="mt-1 flex gap-2">
            <input
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
              placeholder="Name contains…"
              value={filterQuery}
              disabled={disabled || (!hasFiles && !filterActive)}
              onChange={(e) => onFilterQueryChange(e.target.value)}
            />
            <button
              type="button"
              disabled={disabled || (!hasFiles && !filterActive)}
              onClick={onFilter}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Apply
            </button>
            {filterActive ? (
              <button
                type="button"
                disabled={disabled}
                onClick={onClearFilter}
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                Clear
              </button>
            ) : null}
          </div>
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="text-[var(--ink-muted)]">Bulk rename pattern</span>
          <div className="mt-1 flex gap-2">
            <input
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
              placeholder="{name}_{nn}"
              value={renamePattern}
              disabled={disabled || !hasFiles}
              onChange={(e) => onRenamePatternChange(e.target.value)}
            />
            <button
              type="button"
              disabled={disabled || !hasFiles}
              onClick={onRename}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Rename
            </button>
          </div>
          <span className="mt-1 block text-xs text-[var(--ink-muted)]">
            Tokens: {'{name}'}, {'{ext}'}, {'{n}'}, {'{nn}'}
          </span>
        </label>

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="button"
            disabled={disabled || !hasFiles}
            onClick={onCopy}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:opacity-50"
          >
            Duplicate in session
          </button>
          <button
            type="button"
            disabled={disabled || !hasFiles}
            onClick={onExportAll}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:opacity-50"
          >
            Export all (download/save)
          </button>
        </div>

        <label className="block text-sm">
          <span className="text-[var(--ink-muted)]">Move (session path only — not on disk)</span>
          <div className="mt-1 flex gap-2">
            <input
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
              placeholder="archive"
              value={moveDestination}
              disabled={disabled || !hasFiles}
              onChange={(e) => onMoveDestinationChange(e.target.value)}
            />
            <button
              type="button"
              disabled={disabled || !hasFiles}
              onClick={onMove}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Move
            </button>
          </div>
        </label>

        <label className="block text-sm">
          <span className="text-[var(--ink-muted)]">
            Create folder{directoryLabel ? ` in “${directoryLabel}”` : ''}
          </span>
          <div className="mt-1 flex gap-2">
            <input
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
              placeholder="exports"
              value={folderName}
              disabled={disabled || !canCreateFolder}
              onChange={(e) => onFolderNameChange(e.target.value)}
            />
            <button
              type="button"
              disabled={disabled || !canCreateFolder}
              onClick={onCreateFolder}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </label>
      </div>

      {status ? <p className="mt-4 text-sm text-[var(--accent)]">{status}</p> : null}
      {error ? <p className="mt-4 text-sm text-[var(--warn)]">{error}</p> : null}
    </section>
  );
}
