import { useMemo } from 'react';
import { CommandName } from '@localdoc/core';
import type { ProgressUpdate } from '@localdoc/core';
import { getCatalogEntry } from '@localdoc/orchestration/catalog';
import type { CompressMode, CompressQuality } from '@localdoc/pdf/compress-presets';
import type { PdfOpKind } from '../lib/pdfOpsWorkflow';
import { ProgressBar } from './ProgressBar';

export type PdfAction = 'merge' | 'convertToPdf' | PdfOpKind;

interface PdfOpsPanelProps {
  action: PdfAction;
  onActionChange: (action: PdfAction) => void;
  pageSpec: string;
  onPageSpecChange: (value: string) => void;
  rotation: 90 | 180 | 270;
  onRotationChange: (value: 90 | 180 | 270) => void;
  orderSpec: string;
  onOrderSpecChange: (value: string) => void;
  compressQuality: CompressQuality;
  onCompressQualityChange: (value: CompressQuality) => void;
  compressMode: CompressMode;
  onCompressModeChange: (value: CompressMode) => void;
  canRun: boolean;
  running: boolean;
  /** Locks inputs while another workspace task (pick / organize) is in flight. */
  locked?: boolean;
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

/** Maps UI action values to registry command names. */
const ACTION_TO_COMMAND: Record<PdfAction, string> = {
  merge: CommandName.MERGE_FILES,
  convertToPdf: CommandName.CONVERT_TO_PDF,
  split: CommandName.SPLIT_FILE,
  extract: CommandName.EXTRACT_PAGES,
  delete: CommandName.DELETE_PAGES,
  rotate: CommandName.ROTATE_PAGES,
  reorder: CommandName.REORDER_PAGES,
  compress: CommandName.COMPRESS_PDF,
};

const DOCUMENT_ACTIONS: { value: PdfAction; label: string }[] = [
  { value: 'merge', label: 'Merge documents' },
  { value: 'convertToPdf', label: 'Convert DOC/DOCX to PDF' },
  { value: 'compress', label: 'Compress PDF' },
];

const PDF_PAGE_ACTIONS: { value: PdfAction; label: string }[] = [
  { value: 'split', label: 'Split into pages' },
  { value: 'extract', label: 'Extract pages' },
  { value: 'delete', label: 'Delete pages' },
  { value: 'rotate', label: 'Rotate pages' },
  { value: 'reorder', label: 'Reorder pages' },
];

function runButtonLabel(running: boolean, resultMessage: string | null, errorMessage: string | null) {
  if (running) return 'Processing…';
  if (errorMessage) return 'Try again';
  if (resultMessage) {
    return /cancell?ed/i.test(resultMessage) ? 'Run again' : 'Completed';
  }
  return 'Run';
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
  compressQuality,
  onCompressQualityChange,
  compressMode,
  onCompressModeChange,
  canRun,
  running,
  locked = false,
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
  const needsPages = action === 'extract' || action === 'delete' || action === 'rotate';
  const needsOrder = action === 'reorder';
  const needsRotation = action === 'rotate';
  const isConvert = action === 'convertToPdf';
  const isCompress = action === 'compress';
  const controlsLocked = running || locked;

  const catalogNote = useMemo(() => {
    const entry = getCatalogEntry(ACTION_TO_COMMAND[action] as never);
    return entry?.notes ?? null;
  }, [action]);

  const documentOptions = useMemo(
    () =>
      DOCUMENT_ACTIONS.filter((opt) => {
        const entry = getCatalogEntry(ACTION_TO_COMMAND[opt.value] as never);
        return entry != null;
      }),
    [],
  );

  const pdfPageOptions = useMemo(
    () =>
      PDF_PAGE_ACTIONS.filter((opt) => {
        const entry = getCatalogEntry(ACTION_TO_COMMAND[opt.value] as never);
        return entry != null;
      }),
    [],
  );

  const progressLabel =
    progress && progress.totalFiles > 1
      ? `Processing ${progress.filesProcessed} of ${progress.totalFiles} documents`
      : (progress?.message ?? 'Processing…');

  return (
    <section className="panel" aria-labelledby="ops-heading">
      <h2 id="ops-heading" className="panel-title">
        What would you like to do?
      </h2>
      <p className="panel-desc">
        Choose an operation now. LocalDocu AI natural language arrives with the desktop app.
      </p>

      <label className="field mt-5">
        <span className="field-label">Select an operation</span>
        <select
          className="select"
          value={action}
          disabled={controlsLocked}
          onChange={(e) => onActionChange(e.target.value as PdfAction)}
        >
          <optgroup label="Document">
            {documentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="PDF pages">
            {pdfPageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      {/* Reserved extension point for future natural-language / AI input */}
      <label className="field mt-3">
        <span className="field-label">Tell LocalDocu what you want</span>
        <input
          className="input"
          type="text"
          disabled
          placeholder="LocalDocu AI arrives with the desktop app — choose an operation above for now"
          aria-disabled="true"
          title="LocalDocu AI natural-language commands are not available in this web release"
        />
      </label>

      <p className="mt-2 text-xs text-[var(--text-tertiary)]">{hint}</p>

      {isConvert ? (
        <p
          className="mt-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm text-[var(--text-secondary)]"
          role="note"
        >
          Creates a locally generated PDF from the document&apos;s readable content. Complex Word
          layouts may not be preserved exactly.
          {catalogNote?.includes('desktop') ? (
            <span className="mt-1 block text-xs text-[var(--text-tertiary)]">
              Some advanced file operations will be available in the LocalDocu desktop app.
            </span>
          ) : null}
        </p>
      ) : null}

      {isCompress ? (
        <>
          <p
            className="mt-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm text-[var(--text-secondary)]"
            role="note"
          >
            Runs entirely on this device — nothing is uploaded. Balanced keeps selectable text.
            Maximum re-encodes pages as images for stronger size reduction. Deeper engines land in
            the desktop app.
          </p>

          <label className="field mt-3">
            <span className="field-label">Compression mode</span>
            <select
              className="select"
              value={compressMode}
              disabled={controlsLocked}
              onChange={(e) => onCompressModeChange(e.target.value as CompressMode)}
            >
              <option value="balanced">Balanced (keep text selectable)</option>
              <option value="maximum">Maximum (pages as images)</option>
            </select>
          </label>

          <label className="field mt-3">
            <span className="field-label">Quality target</span>
            <select
              className="select"
              value={compressQuality}
              disabled={controlsLocked}
              onChange={(e) => onCompressQualityChange(e.target.value as CompressQuality)}
            >
              <option value="high">Higher quality (larger file)</option>
              <option value="medium">Balanced size</option>
              <option value="low">Smaller file (more compression)</option>
            </select>
          </label>
        </>
      ) : null}

      {needsPages ? (
        <label className="field mt-3">
          <span className="field-label">
            Pages {action === 'rotate' ? '(optional — leave blank for all)' : '(required)'}
          </span>
          <input
            className="input"
            placeholder={action === 'rotate' ? 'blank = all pages' : 'e.g. 1-3,5'}
            value={pageSpec}
            disabled={controlsLocked}
            onChange={(e) => onPageSpecChange(e.target.value)}
          />
        </label>
      ) : null}

      {needsRotation ? (
        <label className="field mt-3">
          <span className="field-label">Rotation</span>
          <select
            className="select"
            value={rotation}
            disabled={controlsLocked}
            onChange={(e) => onRotationChange(Number(e.target.value) as 90 | 180 | 270)}
          >
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </label>
      ) : null}

      {needsOrder ? (
        <label className="field mt-3">
          <span className="field-label">New page order</span>
          <input
            className="input"
            placeholder="e.g. 3,1,2"
            value={orderSpec}
            disabled={controlsLocked}
            onChange={(e) => onOrderSpecChange(e.target.value)}
          />
        </label>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canRun || running}
          onClick={onRun}
          className="btn btn-primary min-w-[7.5rem]"
          aria-describedby={!canRun && disabledReason ? 'run-disabled-reason' : undefined}
        >
          {runButtonLabel(running, resultMessage, errorMessage)}
        </button>
        {running ? (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            aria-label="Cancel the current document operation"
          >
            Cancel
          </button>
        ) : null}
      </div>

      {!canRun && !running && disabledReason ? (
        <p id="run-disabled-reason" className="mt-2 text-sm text-[var(--text-secondary)]">
          {disabledReason}
        </p>
      ) : null}

      {running && progress ? (
        <ProgressBar
          label={progressLabel}
          filesProcessed={progress.filesProcessed}
          totalFiles={progress.totalFiles}
          fraction={progress.fraction}
        />
      ) : null}

      {resultMessage && !running ? (
        <div
          className={`mt-4 rounded-[var(--radius-surface)] border border-[var(--border)] px-3 py-3 text-sm ${
            /cancell?ed/i.test(resultMessage)
              ? 'bg-[var(--surface-subtle)]'
              : 'bg-[var(--success-surface)]'
          }`}
          role="status"
        >
          <p
            className={`font-medium ${
              /cancell?ed/i.test(resultMessage)
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--success)]'
            }`}
          >
            {/cancell?ed/i.test(resultMessage) ? resultMessage : `✓ ${resultMessage}`}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Processed locally on your device.</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          className="mt-4 rounded-[var(--radius-surface)] border border-[var(--border-strong)] bg-[var(--danger-surface)] px-3 py-3 text-sm"
          role="alert"
        >
          <p className="text-[var(--danger)]">{errorMessage}</p>
          {recovery ? <p className="mt-1 text-[var(--text-secondary)]">{recovery}</p> : null}
          {errorCategory || affectedFiles.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-[var(--text-primary)]">View details</summary>
              {errorCategory ? (
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">Category: {errorCategory}</p>
              ) : null}
              {affectedFiles.length > 0 ? (
                <ul className="mt-1 list-disc pl-5 text-[var(--text-secondary)]">
                  {affectedFiles.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              ) : null}
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
