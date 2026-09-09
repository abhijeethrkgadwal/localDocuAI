import { useMemo } from 'react';
import { CommandName } from '@localdoc/core';
import type { ProgressUpdate } from '@localdoc/core';
import { getCatalogEntry } from '@localdoc/orchestration/catalog';
import type { CompressMode, CompressQuality } from '@localdoc/pdf/compress-presets';
import type { TranslateFn } from '../i18n';
import { useT } from '../i18n';
import type { PdfOpKind } from '../lib/pdfOpsWorkflow';
import { ProgressBar } from './ProgressBar';

export type PdfAction = 'merge' | 'convertToPdf' | PdfOpKind;

interface PdfOpsPanelProps {
  action: PdfAction;
  onActionChange: (action: PdfAction) => void;
  /** When set, only these operations appear in the picker (or the locked action). */
  allowedActions?: PdfAction[];
  /** Hide the operation dropdown (single-purpose tool pages). */
  showActionPicker?: boolean;
  /** Hide the disabled LocalDocu AI placeholder input. */
  showAiPlaceholder?: boolean;
  panelTitle?: string;
  panelDesc?: string;
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

const DOCUMENT_ACTION_VALUES: PdfAction[] = ['merge', 'convertToPdf', 'compress'];
const PDF_PAGE_ACTION_VALUES: PdfAction[] = [
  'split',
  'extract',
  'delete',
  'rotate',
  'reorder',
];

function documentActionLabel(value: PdfAction, t: TranslateFn): string {
  switch (value) {
    case 'merge':
      return t('workspace.ops.mergeDocuments');
    case 'convertToPdf':
      return t('workspace.ops.convertDocToPdf');
    case 'compress':
      return t('workspace.ops.compressPdf');
    default:
      return value;
  }
}

function pdfPageActionLabel(value: PdfAction, t: TranslateFn): string {
  switch (value) {
    case 'split':
      return t('workspace.ops.splitIntoPages');
    case 'extract':
      return t('workspace.ops.extractPages');
    case 'delete':
      return t('workspace.ops.deletePages');
    case 'rotate':
      return t('workspace.ops.rotatePages');
    case 'reorder':
      return t('workspace.ops.reorderPages');
    default:
      return value;
  }
}

function idleRunLabel(action: PdfAction, t: TranslateFn): string {
  switch (action) {
    case 'merge':
      return t('workspace.ops.merge');
    case 'compress':
      return t('workspace.ops.compress');
    case 'convertToPdf':
      return t('workspace.ops.convert');
    case 'split':
      return t('workspace.ops.split');
    case 'extract':
      return t('workspace.ops.extract');
    case 'delete':
      return t('workspace.ops.deletePagesAction');
    case 'rotate':
      return t('workspace.ops.rotate');
    case 'reorder':
      return t('workspace.ops.reorder');
    default:
      return t('workspace.ops.run');
  }
}

function runButtonLabel(
  running: boolean,
  resultMessage: string | null,
  errorMessage: string | null,
  action: PdfAction,
  showActionPicker: boolean,
  t: TranslateFn,
) {
  if (running) return t('workspace.ops.processing');
  if (errorMessage) return t('workspace.ops.tryAgain');
  if (resultMessage) {
    return /cancell?ed/i.test(resultMessage)
      ? t('workspace.ops.runAgain')
      : t('workspace.ops.completed');
  }
  return showActionPicker ? t('workspace.ops.run') : idleRunLabel(action, t);
}

export function PdfOpsPanel({
  action,
  onActionChange,
  allowedActions,
  showActionPicker = true,
  showAiPlaceholder = true,
  panelTitle,
  panelDesc,
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
  const t = useT();
  const resolvedTitle = panelTitle ?? t('workspace.ops.defaultTitle');
  const resolvedDesc = panelDesc ?? t('workspace.ops.defaultDesc');
  const needsPages = action === 'extract' || action === 'delete' || action === 'rotate';
  const needsOrder = action === 'reorder';
  const needsRotation = action === 'rotate';
  const isConvert = action === 'convertToPdf';
  const isCompress = action === 'compress';
  const controlsLocked = running || locked;
  const allowed = useMemo(
    () => (allowedActions && allowedActions.length > 0 ? new Set(allowedActions) : null),
    [allowedActions],
  );

  const catalogNote = useMemo(() => {
    const entry = getCatalogEntry(ACTION_TO_COMMAND[action] as never);
    return entry?.notes ?? null;
  }, [action]);

  const documentOptions = useMemo(
    () =>
      DOCUMENT_ACTION_VALUES.filter((value) => {
        if (allowed && !allowed.has(value)) return false;
        const entry = getCatalogEntry(ACTION_TO_COMMAND[value] as never);
        return entry != null;
      }).map((value) => ({ value, label: documentActionLabel(value, t) })),
    [allowed, t],
  );

  const pdfPageOptions = useMemo(
    () =>
      PDF_PAGE_ACTION_VALUES.filter((value) => {
        if (allowed && !allowed.has(value)) return false;
        const entry = getCatalogEntry(ACTION_TO_COMMAND[value] as never);
        return entry != null;
      }).map((value) => ({ value, label: pdfPageActionLabel(value, t) })),
    [allowed, t],
  );

  const progressLabel =
    progress && progress.totalFiles > 1
      ? t('workspace.ops.progressMulti', {
          processed: progress.filesProcessed,
          total: progress.totalFiles,
        })
      : (progress?.message ?? t('workspace.ops.processing'));

  return (
    <section className="panel" aria-labelledby="ops-heading">
      <h2 id="ops-heading" className="panel-title">
        {resolvedTitle}
      </h2>
      <p className="panel-desc">{resolvedDesc}</p>

      {showActionPicker ? (
        <label className="field mt-5">
          <span className="field-label">{t('workspace.ops.selectOperation')}</span>
          <select
            className="select"
            value={action}
            disabled={controlsLocked}
            onChange={(e) => onActionChange(e.target.value as PdfAction)}
          >
            {documentOptions.length > 0 ? (
              <optgroup label={t('workspace.ops.optgroupDocument')}>
                {documentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {pdfPageOptions.length > 0 ? (
              <optgroup label={t('workspace.ops.optgroupPdfPages')}>
                {pdfPageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </label>
      ) : null}

      {showAiPlaceholder ? (
        <label className={`field ${showActionPicker ? 'mt-3' : 'mt-5'}`}>
          <span className="field-label">{t('workspace.ops.tellLocalDocu')}</span>
          <input
            className="input"
            type="text"
            disabled
            placeholder={t('workspace.ops.aiPlaceholder')}
            aria-disabled="true"
            title={t('workspace.ops.aiTitle')}
          />
        </label>
      ) : null}

      <p className={`${showActionPicker || showAiPlaceholder ? 'mt-2' : 'mt-5'} text-xs text-[var(--text-tertiary)]`}>
        {hint}
      </p>

      {isConvert ? (
        <p
          className="mt-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-sm text-[var(--text-secondary)]"
          role="note"
        >
          {t('workspace.ops.convertNote')}
          {catalogNote?.includes('desktop') ? (
            <span className="mt-1 block text-xs text-[var(--text-tertiary)]">
              {t('workspace.ops.desktopAdvancedNote')}
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
            {t('workspace.ops.compressNote')}
          </p>

          <label className="field mt-3">
            <span className="field-label">{t('workspace.ops.compressionMode')}</span>
            <select
              className="select"
              value={compressMode}
              disabled={controlsLocked}
              onChange={(e) => onCompressModeChange(e.target.value as CompressMode)}
            >
              <option value="balanced">{t('workspace.ops.modeBalanced')}</option>
              <option value="maximum">{t('workspace.ops.modeMaximum')}</option>
            </select>
          </label>

          <label className="field mt-3">
            <span className="field-label">{t('workspace.ops.qualityTarget')}</span>
            <select
              className="select"
              value={compressQuality}
              disabled={controlsLocked}
              onChange={(e) => onCompressQualityChange(e.target.value as CompressQuality)}
            >
              <option value="high">{t('workspace.ops.qualityHigh')}</option>
              <option value="medium">{t('workspace.ops.qualityMedium')}</option>
              <option value="low">{t('workspace.ops.qualityLow')}</option>
            </select>
          </label>
        </>
      ) : null}

      {needsPages ? (
        <label className="field mt-3">
          <span className="field-label">
            {action === 'rotate'
              ? t('workspace.ops.pagesOptional')
              : t('workspace.ops.pagesRequired')}
          </span>
          <input
            className="input"
            placeholder={
              action === 'rotate'
                ? t('workspace.ops.pagesPlaceholderAll')
                : t('workspace.ops.pagesPlaceholderExample')
            }
            value={pageSpec}
            disabled={controlsLocked}
            onChange={(e) => onPageSpecChange(e.target.value)}
          />
        </label>
      ) : null}

      {needsRotation ? (
        <label className="field mt-3">
          <span className="field-label">{t('workspace.ops.rotation')}</span>
          <select
            className="select"
            value={rotation}
            disabled={controlsLocked}
            onChange={(e) => onRotationChange(Number(e.target.value) as 90 | 180 | 270)}
          >
            <option value={90}>{t('workspace.ops.rotation90')}</option>
            <option value={180}>{t('workspace.ops.rotation180')}</option>
            <option value={270}>{t('workspace.ops.rotation270')}</option>
          </select>
        </label>
      ) : null}

      {needsOrder ? (
        <label className="field mt-3">
          <span className="field-label">{t('workspace.ops.newPageOrder')}</span>
          <input
            className="input"
            placeholder={t('workspace.ops.orderPlaceholder')}
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
          {runButtonLabel(running, resultMessage, errorMessage, action, showActionPicker, t)}
        </button>
        {running ? (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            aria-label={t('workspace.ops.ariaCancelOp')}
          >
            {t('workspace.ops.cancel')}
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
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {t('workspace.ops.processedLocally')}
          </p>
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
              <summary className="cursor-pointer text-[var(--text-primary)]">
                {t('workspace.ops.viewDetails')}
              </summary>
              {errorCategory ? (
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  {t('workspace.ops.category', { category: errorCategory })}
                </p>
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
