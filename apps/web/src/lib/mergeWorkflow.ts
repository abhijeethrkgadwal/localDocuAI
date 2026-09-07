import {
  formatAppError,
  isDocxFile,
  isPdfFile,
  validationError,
  type LocalFileRef,
  type ProgressUpdate,
} from '@localdoc/core';
import { readAllBytes, type FilesystemAdapter } from '@localdoc/filesystem';
import { executeMergeDocx } from '@localdoc/docx';
import { executeMergeFiles } from '@localdoc/pdf';

export interface MergeWorkflowSuccess {
  filename: string;
  pageCount?: number;
  sourceCount: number;
  saveMethod: 'handle' | 'download';
  uri: string;
  message: string;
  fidelityNote?: string;
}

export interface MergeWorkflowFailure {
  message: string;
  category: string;
  recovery: string | null;
  affectedFiles: string[];
}

export type MergeWorkflowResult =
  | { ok: true; value: MergeWorkflowSuccess }
  | { ok: false; error: MergeWorkflowFailure };

export interface MergeWorkflowOptions {
  signal?: AbortSignal;
  onProgress?: (update: ProgressUpdate) => void;
  outputFilename?: string;
}

function detectMergeKind(
  files: LocalFileRef[],
): { ok: true; kind: 'pdf' | 'docx' } | { ok: false; error: MergeWorkflowFailure } {
  const allPdf = files.every(isPdfFile);
  const allDocx = files.every(isDocxFile);
  if (allPdf) return { ok: true, kind: 'pdf' };
  if (allDocx) return { ok: true, kind: 'docx' };
  return {
    ok: false,
    error: formatAppError(
      validationError(
        'Merge requires all files to be the same type (all PDF or all DOCX).',
        'Filter the list to one document type, then merge.',
      ),
    ),
  };
}

/**
 * Local-only merge orchestration: read → format-specific MERGE_FILES → write.
 * Document bytes never leave the device / adapter.
 */
export async function runLocalDocumentMerge(
  adapter: FilesystemAdapter,
  files: LocalFileRef[],
  options: MergeWorkflowOptions = {},
): Promise<MergeWorkflowResult> {
  if (files.length < 2) {
    return {
      ok: false,
      error: formatAppError(
        validationError(
          'Select at least two files to merge.',
          'Add more files of the same type, then try again.',
        ),
      ),
    };
  }

  const kind = detectMergeKind(files);
  if (!kind.ok) return kind;

  const total = files.length;
  const outputFilename =
    options.outputFilename ?? (kind.kind === 'pdf' ? 'merged.pdf' : 'merged.docx');

  const read = await readAllBytes(adapter, files, {
    signal: options.signal,
    onProgress: (update) =>
      options.onProgress?.({
        ...update,
        message: update.message ?? 'Reading files…',
        fraction: update.fraction !== undefined ? update.fraction * 0.35 : undefined,
      }),
  });

  if (!read.ok) {
    return { ok: false, error: formatAppError(read.error) };
  }

  if (kind.kind === 'pdf') {
    const merged = await executeMergeFiles(
      { files: read.value, outputFilename },
      {
        signal: options.signal,
        onProgress: (update) =>
          options.onProgress?.({
            ...update,
            fraction: update.fraction !== undefined ? 0.35 + update.fraction * 0.65 : undefined,
          }),
      },
    );
    if (!merged.ok) return { ok: false, error: formatAppError(merged.error) };

    const saved = await adapter.writeBytes(merged.value.bytes, {
      suggestedName: merged.value.filename,
      signal: options.signal,
    });
    if (!saved.ok) return { ok: false, error: formatAppError(saved.error) };

    return {
      ok: true,
      value: {
        filename: merged.value.filename,
        pageCount: merged.value.pageCount,
        sourceCount: merged.value.sourceCount,
        saveMethod: saved.value.method,
        uri: saved.value.uri,
        message: `Merged ${merged.value.sourceCount} PDFs (${merged.value.pageCount} pages) → ${merged.value.filename} (${saved.value.method === 'handle' ? 'saved locally' : 'downloaded'}).${saved.value.note ? ` ${saved.value.note}` : ''}`,
      },
    };
  }

  const merged = await executeMergeDocx(
    { files: read.value, outputFilename },
    {
      signal: options.signal,
      onProgress: (update) =>
        options.onProgress?.({
          ...update,
          fraction: update.fraction !== undefined ? 0.35 + update.fraction * 0.65 : undefined,
        }),
    },
  );
  if (!merged.ok) return { ok: false, error: formatAppError(merged.error) };

  options.onProgress?.({
    operation: 'MERGE_FILES',
    filesProcessed: total,
    totalFiles: total,
    fraction: 0.95,
    message: 'Saving merged DOCX…',
  });

  const saved = await adapter.writeBytes(merged.value.bytes, {
    suggestedName: merged.value.filename,
    signal: options.signal,
  });
  if (!saved.ok) return { ok: false, error: formatAppError(saved.error) };

  return {
    ok: true,
    value: {
      filename: merged.value.filename,
      sourceCount: merged.value.sourceCount,
      saveMethod: saved.value.method,
      uri: saved.value.uri,
      fidelityNote: merged.value.fidelityNote,
      message: `Merged ${merged.value.sourceCount} DOCX files → ${merged.value.filename} (${saved.value.method === 'handle' ? 'saved locally' : 'downloaded'}).${saved.value.note ? ` ${saved.value.note}` : ''} ${merged.value.fidelityNote}`,
    },
  };
}

/** @deprecated Use runLocalDocumentMerge */
export const runLocalPdfMerge = runLocalDocumentMerge;
