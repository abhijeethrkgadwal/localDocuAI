import type { ProgressUpdate } from '@localdoc/core';
import type { PdfOpKind } from '../lib/pdfOpsWorkflow';

export type PdfAction = 'merge' | PdfOpKind;

interface PdfOpsPanelProps {
  action: PdfAction;
  onActionChange: (action: PdfAction) => void;
  pageSpec: string;
  onPageSpecChange: (value: string) => void;
  rotation: 90 | 180 | 270;
  onRotationChange: (value: 90 | 180 | 270) => void;
  orderSpec: string;
  onOrderSpecChange: (value: string) => void;
  canRun: boolean;
  running: boolean;
  progress: ProgressUpdate | null;
  resultMessage: string | null;
  errorMessage: string | null;
  recovery: string | null;
  errorCategory: string | null;
  affectedFiles: string[];
  hint: string;
  disabledReason: string | null;
  onRun: () => void;
  onCancel: () => void;
}

export function PdfOpsPanel({
  action,
  onActionChange,
  pageSpec,
  onPageSpecChange,
  rotation,
  onRotationChange,
  orderSpec,
  onOrderSpecChange,
  canRun,
  running,
  progress,
  resultMessage,
  errorMessage,
  recovery,
  errorCategory,
  affectedFiles,
  hint,
  disabledReason,
  onRun,
  onCancel,
}: PdfOpsPanelProps) {
  const fraction = progress?.fraction;
  const percent =
    typeof fraction === 'number' ? Math.round(Math.min(1, Math.max(0, fraction)) * 100) : null;

  const needsPages = action === 'extract' || action === 'delete' || action === 'rotate';
  const needsOrder = action === 'reorder';
  const needsRotation = action === 'rotate';

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 shadow-sm">
      <h2 className="text-xl font-medium">What would you like to do?</h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">{hint}</p>

      <label className="mt-4 block text-sm">
        <span className="text-[var(--ink-muted)]">Operation</span>
        <select
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
          value={action}
          disabled={running}
          onChange={(e) => onActionChange(e.target.value as PdfAction)}
        >
          <option value="merge">Merge documents</option>
          <option value="split">Split into pages</option>
          <option value="extract">Extract pages</option>
          <option value="delete">Delete pages</option>
          <option value="rotate">Rotate pages</option>
          <option value="reorder">Reorder pages</option>
        </select>
      </label>

      {needsPages ? (
        <label className="mt-3 block text-sm">
          <span className="text-[var(--ink-muted)]">
            Pages {action === 'rotate' ? '(optional — leave blank for all)' : '(required)'}
          </span>
          <input
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            placeholder={action === 'rotate' ? 'blank = all pages' : 'e.g. 1-3,5'}
            value={pageSpec}
            disabled={running}
            onChange={(e) => onPageSpecChange(e.target.value)}
          />
        </label>
      ) : null}

      {needsRotation ? (
        <label className="mt-3 block text-sm">
          <span className="text-[var(--ink-muted)]">Rotation</span>
          <select
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            value={rotation}
            disabled={running}
            onChange={(e) => onRotationChange(Number(e.target.value) as 90 | 180 | 270)}
          >
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </label>
      ) : null}

      {needsOrder ? (
        <label className="mt-3 block text-sm">
          <span className="text-[var(--ink-muted)]">New page order</span>
          <input
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
            placeholder="e.g. 3,1,2"
            value={orderSpec}
            disabled={running}
            onChange={(e) => onOrderSpecChange(e.target.value)}
          />
        </label>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canRun || running}
          onClick={onRun}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Working…' : 'Run'}
        </button>
        {running ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
        ) : null}
      </div>

      {!canRun && !running && disabledReason ? (
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{disabledReason}</p>
      ) : null}

      {running && progress ? (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-[var(--ink-muted)]">
            <span>{progress.message ?? progress.operation}</span>
            <span>
              {progress.filesProcessed}/{progress.totalFiles}
              {percent !== null ? ` · ${percent}%` : ''}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--accent-soft)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: `${percent ?? 0}%` }}
            />
          </div>
        </div>
      ) : null}

      {resultMessage ? <p className="mt-4 text-sm text-[var(--accent)]">{resultMessage}</p> : null}

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-[var(--warn)]/40 bg-[#fff8ef] px-3 py-2 text-sm">
          <p className="text-[var(--warn)]">{errorMessage}</p>
          {recovery ? <p className="mt-1 text-[var(--ink-muted)]">{recovery}</p> : null}
          {errorCategory ? (
            <p className="mt-1 text-xs text-[var(--ink-muted)]">Category: {errorCategory}</p>
          ) : null}
          {affectedFiles.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-[var(--ink)]">View affected files</summary>
              <ul className="mt-1 list-disc pl-5 text-[var(--ink-muted)]">
                {affectedFiles.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
