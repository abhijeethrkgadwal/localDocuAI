import type { ProgressUpdate } from '@localdoc/core';
import { useT } from '../i18n';
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
  const t = useT();
  const noFilterResults =
    filterActive && typeof visibleCount === 'number' && visibleCount === 0;

  const progressLabel =
    progress && progress.totalFiles > 1
      ? t('workspace.fileManage.exportProgress', {
          processed: progress.filesProcessed,
          total: progress.totalFiles,
        })
      : (progress?.message ?? t('workspace.fileManage.busyWorking'));

  const busyStatusLabel =
    busyAction === 'rename'
      ? t('workspace.fileManage.busyRename')
      : busyAction === 'copy'
        ? t('workspace.fileManage.busyCopy')
        : busyAction === 'move'
          ? t('workspace.fileManage.busyMove')
          : busyAction === 'createFolder'
            ? t('workspace.fileManage.busyCreateFolder')
            : t('workspace.fileManage.busyWorking');

  return (
    <section className="panel" aria-labelledby="organize-heading" aria-busy={disabled}>
      <h2 id="organize-heading" className="panel-title">
        {t('workspace.fileManage.title')}
      </h2>
      <p className="panel-desc">{t('workspace.fileManage.desc')}</p>

      <div className="mt-5 space-y-5">
        <div>
          <p className="group-label">{t('workspace.fileManage.viewFilter')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span className="field-label">{t('workspace.fileManage.sort')}</span>
              <div className="flex gap-2">
                <select
                  className="select"
                  value={sortType}
                  disabled={disabled || !hasFiles}
                  onChange={(e) => onSortTypeChange(e.target.value)}
                >
                  <option value="natural_filename">{t('workspace.fileManage.sortNatural')}</option>
                  <option value="alphabetical">{t('workspace.fileManage.sortAZ')}</option>
                  <option value="modified_asc">{t('workspace.fileManage.sortOldest')}</option>
                  <option value="modified_desc">{t('workspace.fileManage.sortNewest')}</option>
                </select>
                <button
                  type="button"
                  disabled={disabled || !hasFiles}
                  onClick={onSort}
                  className="btn btn-secondary shrink-0"
                >
                  {t('workspace.fileManage.apply')}
                </button>
              </div>
            </label>

            <label className="field">
              <span className="field-label">{t('workspace.fileManage.filter')}</span>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder={t('workspace.fileManage.filterPlaceholder')}
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
                  {t('workspace.fileManage.apply')}
                </button>
                {filterActive ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={onClearFilter}
                    className="btn btn-ghost shrink-0"
                  >
                    {t('workspace.fileManage.clear')}
                  </button>
                ) : null}
              </div>
            </label>
          </div>
          {noFilterResults ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]" role="status">
              {t('workspace.fileManage.noMatch')}
              {typeof sessionCount === 'number'
                ? t('workspace.fileManage.inSession', { count: sessionCount })
                : null}
            </p>
          ) : null}
        </div>

        <div>
          <p className="group-label">{t('workspace.fileManage.renameGroup')}</p>
          <label className="field">
            <span className="field-label">{t('workspace.fileManage.renamePattern')}</span>
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
                {busyAction === 'rename'
                  ? t('workspace.fileManage.renaming')
                  : t('workspace.fileManage.rename')}
              </button>
            </div>
            <span id="rename-tokens" className="mt-1 block text-xs text-[var(--text-tertiary)]">
              {t('workspace.fileManage.renameTokens')}
            </span>
          </label>
        </div>

        <div>
          <p className="group-label">{t('workspace.fileManage.fileActions')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || !hasFiles}
              onClick={onCopy}
              className="btn btn-secondary"
              aria-busy={busyAction === 'copy'}
            >
              {busyAction === 'copy'
                ? t('workspace.fileManage.duplicating')
                : t('workspace.fileManage.duplicate')}
            </button>
            <button
              type="button"
              disabled={disabled || !hasFiles}
              onClick={onExportAll}
              className="btn btn-secondary"
              aria-busy={busyAction === 'export'}
            >
              {busyAction === 'export'
                ? t('workspace.fileManage.exporting')
                : t('workspace.fileManage.export')}
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span className="field-label">{t('workspace.fileManage.moveLabel')}</span>
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
                  {busyAction === 'move'
                    ? t('workspace.fileManage.moving')
                    : t('workspace.fileManage.move')}
                </button>
              </div>
            </label>

            <label className="field">
              <span className="field-label">
                {directoryLabel
                  ? t('workspace.fileManage.createFolderIn', { name: directoryLabel })
                  : t('workspace.fileManage.createFolder')}
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
                  {busyAction === 'createFolder'
                    ? t('workspace.fileManage.creating')
                    : t('workspace.fileManage.create')}
                </button>
              </div>
              {!canCreateFolder ? (
                <span
                  id="create-folder-hint"
                  className="mt-1 block text-xs text-[var(--text-tertiary)]"
                >
                  {t('workspace.fileManage.createFolderHint')}
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
          {busyStatusLabel}
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
