import { memo } from 'react';
import type { LocalFileRef } from '@localdoc/core';
import { isPdfFile, isWordFile } from '@localdoc/core';
import { useT } from '../i18n';

interface FileListProps {
  files: LocalFileRef[];
  selectedId: string | null;
  disabled?: boolean;
  directoryName?: string | null;
  onSelect: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
}

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeLabel(
  file: LocalFileRef,
  t: (key: string) => string,
): string {
  if (isPdfFile(file)) return t('workspace.fileList.typePdf');
  if (isWordFile(file)) {
    const lower = file.name.toLowerCase();
    return lower.endsWith('.doc') && !lower.endsWith('.docx')
      ? t('workspace.fileList.typeDoc')
      : t('workspace.fileList.typeDocx');
  }
  return t('workspace.fileList.typeFile');
}

interface FileRowProps {
  file: LocalFileRef;
  index: number;
  selected: boolean;
  disabled?: boolean;
  isLast: boolean;
  onSelect: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
}

const FileRow = memo(function FileRow({
  file,
  index,
  selected,
  disabled,
  isLast,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
}: FileRowProps) {
  const t = useT();

  return (
    <li>
      <div
        className={`flex items-stretch gap-2 rounded-[var(--radius-surface)] border px-3 py-2.5 transition-colors duration-[var(--duration-fast)] ${
          selected
            ? 'border-[var(--border-strong)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]'
            : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-subtle)]'
        }`}
      >
        <button
          type="button"
          className="min-w-0 flex-1 rounded-[6px] text-left"
          onClick={() => onSelect(file.id)}
          disabled={disabled}
          aria-pressed={selected}
          aria-label={t('workspace.fileList.ariaSelectForPreview', { name: file.name })}
        >
          <div className="flex items-start gap-2.5">
            <span
              className="mt-0.5 w-5 shrink-0 text-xs tabular-nums text-[var(--text-tertiary)]"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {file.name}
              </p>
              {file.path && file.path !== file.name ? (
                <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                  {file.path}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {fileTypeLabel(file, t)} · {formatSize(file.size)}
              </p>
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1 self-center">
          <button
            type="button"
            aria-label={t('workspace.fileList.ariaMoveUp')}
            title={t('workspace.fileList.moveUp')}
            disabled={disabled || index === 0}
            onClick={() => onMoveUp(index)}
            className="btn btn-secondary btn-sm btn-icon"
          >
            <span aria-hidden>↑</span>
          </button>
          <button
            type="button"
            aria-label={t('workspace.fileList.ariaMoveDown')}
            title={t('workspace.fileList.moveDown')}
            disabled={disabled || isLast}
            onClick={() => onMoveDown(index)}
            className="btn btn-secondary btn-sm btn-icon"
          >
            <span aria-hidden>↓</span>
          </button>
          <button
            type="button"
            aria-label={t('workspace.fileList.ariaRemove')}
            title={t('workspace.fileList.remove')}
            disabled={disabled}
            onClick={() => onRemove(file.id)}
            className="btn btn-ghost btn-sm text-[var(--danger)]"
          >
            {t('workspace.fileList.remove')}
          </button>
        </div>
      </div>
    </li>
  );
});

export function FileList({
  files,
  selectedId,
  disabled,
  directoryName,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
}: FileListProps) {
  const t = useT();

  if (files.length === 0) {
    return null;
  }

  const countLabel =
    files.length === 1
      ? t('workspace.fileList.oneDocument')
      : t('workspace.fileList.nDocuments', { count: files.length });
  const sourceLabel = directoryName
    ? t('workspace.fileList.fromDirectory', { name: directoryName })
    : t('workspace.fileList.localOnly');

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
          {countLabel}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)]">{sourceLabel}</p>
      </div>

      <ol className="max-h-80 space-y-2 overflow-auto pr-0.5">
        {files.map((file, index) => (
          <FileRow
            key={file.id}
            file={file}
            index={index}
            selected={file.id === selectedId}
            disabled={disabled}
            isLast={index === files.length - 1}
            onSelect={onSelect}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onRemove={onRemove}
          />
        ))}
      </ol>
    </div>
  );
}
