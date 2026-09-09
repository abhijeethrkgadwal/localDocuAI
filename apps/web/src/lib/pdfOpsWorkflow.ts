import {
  formatAppError,
  validationError,
  type LocalFileRef,
  type ProgressUpdate,
} from '@localdoc/core';
import type { FilesystemAdapter } from '@localdoc/filesystem';
import {
  CompressMode,
  CompressQuality,
  executeCompressPdf,
  executeDeletePages,
  executeExtractPages,
  executeReorderPages,
  executeRotatePages,
  executeSplitFile,
  type CompressMode as CompressModeType,
  type CompressQuality as CompressQualityType,
} from '@localdoc/pdf';
import { getT } from '../i18n';

export type PdfOpKind = 'split' | 'extract' | 'delete' | 'rotate' | 'reorder' | 'compress';

export interface PdfOpSuccess {
  message: string;
  savedCount: number;
}

export interface PdfOpFailure {
  message: string;
  category: string;
  recovery: string | null;
  affectedFiles: string[];
}

export type PdfOpResult =
  | { ok: true; value: PdfOpSuccess }
  | { ok: false; error: PdfOpFailure };

export interface PdfOpOptions {
  signal?: AbortSignal;
  onProgress?: (update: ProgressUpdate) => void;
  pageSpec?: string;
  rotation?: 90 | 180 | 270;
  /** Comma-separated 1-based order, e.g. "3,1,2" */
  orderSpec?: string;
  compressQuality?: CompressQualityType;
  compressMode?: CompressModeType;
}

async function readOne(
  adapter: FilesystemAdapter,
  file: LocalFileRef,
  signal?: AbortSignal,
) {
  return adapter.readBytes(file, { signal });
}

function parseOrderSpec(spec: string): number[] | null {
  const parts = spec
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 1)) return null;
  return nums;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export async function runSinglePdfOp(
  adapter: FilesystemAdapter,
  file: LocalFileRef,
  kind: PdfOpKind,
  options: PdfOpOptions = {},
): Promise<PdfOpResult> {
  const t = getT();
  const read = await readOne(adapter, file, options.signal);
  if (!read.ok) return { ok: false, error: formatAppError(read.error) };

  const payload = { name: file.name, bytes: read.value };
  const outputs: { filename: string; bytes: Uint8Array }[] = [];
  let summary = '';

  if (kind === 'split') {
    const result = await executeSplitFile(
      { file: payload },
      { signal: options.signal, onProgress: options.onProgress },
    );
    if (!result.ok) return { ok: false, error: formatAppError(result.error) };
    for (const f of result.value.files) {
      outputs.push({ filename: f.filename, bytes: f.bytes });
    }
    summary = t('workspace.pdfOpsWorkflow.splitSummary', { count: result.value.files.length });
  } else if (kind === 'extract') {
    const result = await executeExtractPages(
      { file: payload, pageSpec: options.pageSpec },
      { signal: options.signal, onProgress: options.onProgress },
    );
    if (!result.ok) return { ok: false, error: formatAppError(result.error) };
    outputs.push({ filename: result.value.filename, bytes: result.value.bytes });
    summary = t('workspace.pdfOpsWorkflow.extractSummary', {
      pages: result.value.extractedPages.join(', '),
    });
  } else if (kind === 'delete') {
    const result = await executeDeletePages(
      { file: payload, pageSpec: options.pageSpec },
      { signal: options.signal, onProgress: options.onProgress },
    );
    if (!result.ok) return { ok: false, error: formatAppError(result.error) };
    outputs.push({ filename: result.value.filename, bytes: result.value.bytes });
    summary = t('workspace.pdfOpsWorkflow.deleteSummary', {
      pages: result.value.deletedPages.join(', '),
    });
  } else if (kind === 'rotate') {
    const rotation = options.rotation ?? 90;
    const result = await executeRotatePages(
      {
        file: payload,
        rotation,
        pageSpec: options.pageSpec?.trim() ? options.pageSpec : undefined,
      },
      { signal: options.signal, onProgress: options.onProgress },
    );
    if (!result.ok) return { ok: false, error: formatAppError(result.error) };
    outputs.push({ filename: result.value.filename, bytes: result.value.bytes });
    summary = t('workspace.pdfOpsWorkflow.rotateSummary', {
      count: result.value.rotatedPages.length,
      degrees: rotation,
    });
  } else if (kind === 'reorder') {
    const order = parseOrderSpec(options.orderSpec ?? '');
    if (!order) {
      return {
        ok: false,
        error: formatAppError(
          validationError(
            t('workspace.pdfOpsWorkflow.reorderInvalid'),
            t('workspace.pdfOpsWorkflow.reorderInvalidRecovery'),
          ),
        ),
      };
    }
    const result = await executeReorderPages(
      { file: payload, order },
      { signal: options.signal, onProgress: options.onProgress },
    );
    if (!result.ok) return { ok: false, error: formatAppError(result.error) };
    outputs.push({ filename: result.value.filename, bytes: result.value.bytes });
    summary = t('workspace.pdfOpsWorkflow.reorderSummary', {
      order: result.value.order.join(', '),
    });
  } else if (kind === 'compress') {
    const quality = options.compressQuality ?? CompressQuality.MEDIUM;
    const mode = options.compressMode ?? CompressMode.BALANCED;
    const deps =
      mode === CompressMode.MAXIMUM
        ? {
            rasterize: (await import('./pdfPageRasterizer.js')).browserPdfRasterizer,
          }
        : undefined;

    const result = await executeCompressPdf(
      { file: payload, quality, mode },
      { signal: options.signal, onProgress: options.onProgress },
      deps,
    );
    if (!result.ok) return { ok: false, error: formatAppError(result.error) };

    outputs.push({ filename: result.value.filename, bytes: result.value.bytes });
    const sizeLine = `${formatBytes(result.value.originalBytes)} → ${formatBytes(result.value.compressedBytes)}`;
    if (result.value.strategy === 'unchanged' || result.value.savedBytes <= 0) {
      summary = t('workspace.pdfOpsWorkflow.compressUnchanged', {
        sizeLine,
        note: result.value.note,
      });
    } else {
      summary = t('workspace.pdfOpsWorkflow.compressSummary', {
        percent: result.value.reductionPercent,
        sizeLine,
        note: result.value.note,
      });
    }
  }

  let saved = 0;
  let usedDownload = false;
  for (const out of outputs) {
    const written = await adapter.writeBytes(out.bytes, {
      suggestedName: out.filename,
      signal: options.signal,
    });
    if (!written.ok) {
      const formatted = formatAppError(written.error);
      if (saved > 0) {
        return {
          ok: false,
          error: {
            ...formatted,
            message: t('workspace.pdfOpsWorkflow.savedPartialFail', {
              saved,
              total: outputs.length,
              message: formatted.message,
            }),
            recovery:
              formatted.recovery ?? t('workspace.pdfOpsWorkflow.savedPartialRecovery'),
          },
        };
      }
      return { ok: false, error: formatted };
    }
    if (written.value.method === 'download') usedDownload = true;
    saved += 1;
  }

  const saveLine = usedDownload
    ? t('workspace.pdfOpsWorkflow.downloadedFiles', { count: saved })
    : t('workspace.pdfOpsWorkflow.savedFilesLocally', { count: saved });

  return {
    ok: true,
    value: {
      message: `${summary} ${saveLine}`,
      savedCount: saved,
    },
  };
}
