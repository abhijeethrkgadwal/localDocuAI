import {
  cancelledError,
  formatAppError,
  isWordFile,
  validationError,
  type LocalFileRef,
  type ProgressUpdate,
} from '@localdoc/core';
import { executeConvertToPdf, gateWordToPdfCapacity } from '@localdoc/docx';
import type { FilesystemAdapter } from '@localdoc/filesystem';
import { getT } from '../i18n';

export interface ConvertWorkflowSuccess {
  filename: string;
  pageCount: number;
  saveMethod: 'handle' | 'download';
  uri: string;
  message: string;
  fidelityNote: string;
}

export interface ConvertWorkflowFailure {
  message: string;
  category: string;
  recovery: string | null;
  affectedFiles: string[];
}

export type ConvertWorkflowResult =
  | { ok: true; value: ConvertWorkflowSuccess }
  | { ok: false; error: ConvertWorkflowFailure };

export interface ConvertWorkflowOptions {
  signal?: AbortSignal;
  onProgress?: (update: ProgressUpdate) => void;
  outputFilename?: string;
}

/**
 * Capacity-gated DOC/DOCX → PDF orchestration for the web shell.
 * Measures size + device capacity before reading bytes or converting,
 * then re-gates on the actual byte length after read.
 */
export async function runLocalWordToPdf(
  adapter: FilesystemAdapter,
  file: LocalFileRef,
  options: ConvertWorkflowOptions = {},
): Promise<ConvertWorkflowResult> {
  const t = getT();

  if (!isWordFile(file)) {
    return {
      ok: false,
      error: formatAppError(
        validationError(
          t('workspace.convertWorkflow.requiresWord'),
          t('workspace.convertWorkflow.requiresWordRecovery'),
        ),
      ),
    };
  }

  options.onProgress?.({
    operation: 'CONVERT_TO_PDF',
    filesProcessed: 0,
    totalFiles: 1,
    fraction: 0.05,
    message: t('workspace.convertWorkflow.checkingCapacity'),
  });

  // size === 0 often means “unknown” from some pickers — skip pre-gate and recheck after read.
  if (file.size > 0) {
    const capacity = gateWordToPdfCapacity({
      fileSizeBytes: file.size,
      filename: file.name,
    });
    if (!capacity.ok) return { ok: false, error: formatAppError(capacity.error) };
  }

  const read = await adapter.readBytes(file, { signal: options.signal });
  if (!read.ok) return { ok: false, error: formatAppError(read.error) };

  const actualSize = read.value.byteLength;
  const reGate = gateWordToPdfCapacity({
    fileSizeBytes: actualSize,
    filename: file.name,
  });
  if (!reGate.ok) {
    const formatted = formatAppError(reGate.error);
    if (file.size > 0 && file.size !== actualSize) {
      return {
        ok: false,
        error: {
          ...formatted,
          message: t('workspace.convertWorkflow.sizeMismatch', { message: formatted.message }),
        },
      };
    }
    return { ok: false, error: formatted };
  }

  const converted = await executeConvertToPdf(
    {
      file: { name: file.name, bytes: read.value },
      declaredSizeBytes: actualSize,
      outputFilename: options.outputFilename,
    },
    { signal: options.signal, onProgress: options.onProgress },
  );
  if (!converted.ok) return { ok: false, error: formatAppError(converted.error) };

  if (options.signal?.aborted) {
    return {
      ok: false,
      error: formatAppError(
        cancelledError(t('workspace.convertWorkflow.saveCancelled')),
      ),
    };
  }

  options.onProgress?.({
    operation: 'CONVERT_TO_PDF',
    filesProcessed: 1,
    totalFiles: 1,
    fraction: 0.9,
    message: t('workspace.convertWorkflow.savingPdf'),
  });

  const saved = await adapter.writeBytes(converted.value.bytes, {
    suggestedName: converted.value.filename,
    signal: options.signal,
  });
  if (!saved.ok) {
    const formatted = formatAppError(saved.error);
    if (formatted.category === 'cancelled') {
      return {
        ok: false,
        error: {
          ...formatted,
          message: t('workspace.convertWorkflow.saveCancelled'),
          recovery: t('workspace.convertWorkflow.saveCancelledRecovery'),
        },
      };
    }
    return { ok: false, error: formatted };
  }

  const method =
    saved.value.method === 'handle'
      ? t('workspace.mergeWorkflow.savedLocally')
      : t('workspace.mergeWorkflow.downloaded');
  const base = t('workspace.convertWorkflow.converted', {
    source: file.name,
    filename: converted.value.filename,
    pages: converted.value.pageCount,
    method,
    fidelityNote: converted.value.fidelityNote,
  });

  return {
    ok: true,
    value: {
      filename: converted.value.filename,
      pageCount: converted.value.pageCount,
      saveMethod: saved.value.method,
      uri: saved.value.uri,
      fidelityNote: converted.value.fidelityNote,
      message: `${base}${saved.value.note ? ` ${saved.value.note}` : ''}`,
    },
  };
}
