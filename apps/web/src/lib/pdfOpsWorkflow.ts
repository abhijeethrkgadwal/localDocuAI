import {
  formatAppError,
  validationError,
  type LocalFileRef,
  type ProgressUpdate,
} from '@localdoc/core';
import type { FilesystemAdapter } from '@localdoc/filesystem';
import {
  executeDeletePages,
  executeExtractPages,
  executeReorderPages,
  executeRotatePages,
  executeSplitFile,
} from '@localdoc/pdf';

export type PdfOpKind = 'split' | 'extract' | 'delete' | 'rotate' | 'reorder';

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

export async function runSinglePdfOp(
  adapter: FilesystemAdapter,
  file: LocalFileRef,
  kind: PdfOpKind,
  options: PdfOpOptions = {},
): Promise<PdfOpResult> {
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
    summary = `Split into ${result.value.files.length} PDF(s).`;
  } else if (kind === 'extract') {
    const result = await executeExtractPages(
      { file: payload, pageSpec: options.pageSpec },
      { signal: options.signal, onProgress: options.onProgress },
    );
    if (!result.ok) return { ok: false, error: formatAppError(result.error) };
    outputs.push({ filename: result.value.filename, bytes: result.value.bytes });
    summary = `Extracted pages ${result.value.extractedPages.join(', ')}.`;
  } else if (kind === 'delete') {
    const result = await executeDeletePages(
      { file: payload, pageSpec: options.pageSpec },
      { signal: options.signal, onProgress: options.onProgress },
    );
    if (!result.ok) return { ok: false, error: formatAppError(result.error) };
    outputs.push({ filename: result.value.filename, bytes: result.value.bytes });
    summary = `Deleted pages ${result.value.deletedPages.join(', ')}.`;
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
    summary = `Rotated ${result.value.rotatedPages.length} page(s) by ${rotation}°.`;
  } else if (kind === 'reorder') {
    const order = parseOrderSpec(options.orderSpec ?? '');
    if (!order) {
      return {
        ok: false,
        error: formatAppError(
          validationError(
            'Enter a full page order like 3,1,2.',
            'List every page number exactly once, separated by commas.',
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
    summary = `Reordered pages to ${result.value.order.join(', ')}.`;
  }

  let saved = 0;
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
            message: `Saved ${saved} of ${outputs.length} file(s), then failed: ${formatted.message}`,
            recovery:
              formatted.recovery ??
              'Keep the files already saved, then retry the remaining output.',
          },
        };
      }
      return { ok: false, error: formatted };
    }
    saved += 1;
  }

  return {
    ok: true,
    value: {
      message: `${summary} Saved ${saved} file(s) locally.`,
      savedCount: saved,
    },
  };
}
