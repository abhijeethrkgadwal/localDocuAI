import type { LocalFileRef } from '@localdoc/core';

interface FileListProps {
  files: LocalFileRef[];
  selectedId: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
}

export function FileList({
  files,
  selectedId,
  disabled,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
}: FileListProps) {
  if (files.length === 0) {
    return (
      <p className="mt-6 border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--ink-muted)]">
        Drop PDF or DOCX here, or use the buttons above.
      </p>
    );
  }

  return (
    <ol className="mt-4 max-h-72 space-y-2 overflow-auto">
      {files.map((file, index) => {
        const selected = file.id === selectedId;
        return (
          <li
            key={file.id}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              selected
                ? 'border-[var(--accent)] bg-[var(--accent-soft)]/50'
                : 'border-[var(--border)] bg-white'
            }`}
          >
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onSelect(file.id)}
              disabled={disabled}
            >
              <span className="mr-2 text-[var(--ink-muted)]">{index + 1}.</span>
              <span className="font-medium">{file.name}</span>
              {file.path && file.path !== file.name ? (
                <span className="mt-0.5 block truncate text-xs text-[var(--ink-muted)]">
                  {file.path}
                </span>
              ) : null}
              <span className="text-[var(--ink-muted)]">
                {' '}
                (
                {file.size < 1024
                  ? `${file.size} B`
                  : `${Math.round(file.size / 1024)} KB`}
                )
              </span>
            </button>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                aria-label={`Move ${file.name} up`}
                disabled={disabled || index === 0}
                onClick={() => onMoveUp(index)}
                className="rounded border border-[var(--border)] px-2 py-1 text-xs disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${file.name} down`}
                disabled={disabled || index === files.length - 1}
                onClick={() => onMoveDown(index)}
                className="rounded border border-[var(--border)] px-2 py-1 text-xs disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
                onClick={() => onRemove(file.id)}
                className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--warn)] disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
