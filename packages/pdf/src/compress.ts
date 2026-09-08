import {
  CommandName,
  Permission,
  SupportedFileType,
  cancelledError,
  corruptError,
  err,
  internalError,
  ok,
  parseWithSchema,
  unsupportedError,
  validationError,
  type CommandContext,
  type CommandDefinition,
  type Result,
} from '@localdoc/core';
import { PDFDocument } from 'pdf-lib';
import { z } from 'zod';
import { recompressEmbeddedImages } from './compress-images.js';
import {
  COMPRESS_PRESETS,
  CompressMode,
  CompressQuality,
  type CompressMode as CompressModeType,
  type CompressQuality as CompressQualityType,
} from './compress-presets.js';
import {
  checkAbort,
  commandFileSchema,
  ensurePdfFilename,
  loadPdfDocument,
} from './shared.js';

export { CompressMode, CompressQuality, COMPRESS_PRESETS } from './compress-presets.js';

/** Hard ceiling for browser compress — larger jobs wait for desktop. */
export const WEB_COMPRESS_HARD_MAX_BYTES = 40 * 1024 * 1024;
/** Approximate canvas cost budget for maximum mode (pages × scale²). */
export const WEB_COMPRESS_MAX_RASTER_COST = 80;

export interface RasterPageImage {
  /** JPEG bytes for one page */
  jpeg: Uint8Array;
  /** Page width in PDF points */
  widthPt: number;
  /** Page height in PDF points */
  heightPt: number;
}

/**
 * Optional host-provided rasterizer for maximum-mode compression.
 * Web supplies pdf.js + canvas; desktop can supply a stronger engine later.
 */
export type CompressPdfRasterizer = (args: {
  bytes: Uint8Array;
  pageCount: number;
  scale: number;
  jpegQuality: number;
  signal?: AbortSignal;
  onPage?: (done: number, total: number) => void;
}) => Promise<Result<RasterPageImage[]>>;

export interface CompressPdfDeps {
  rasterize?: CompressPdfRasterizer;
}

export const compressPdfInputSchema = z.object({
  file: commandFileSchema,
  quality: z.enum(['low', 'medium', 'high']).optional(),
  mode: z.enum(['balanced', 'maximum']).optional(),
  outputFilename: z.string().min(1).optional(),
});

export type CompressPdfInput = z.infer<typeof compressPdfInputSchema>;

export const compressPdfOutputSchema = z.object({
  filename: z.string(),
  bytes: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
  pageCount: z.number().int().positive(),
  originalBytes: z.number().int().nonnegative(),
  compressedBytes: z.number().int().nonnegative(),
  savedBytes: z.number().int(),
  reductionPercent: z.number(),
  quality: z.enum(['low', 'medium', 'high']),
  mode: z.enum(['balanced', 'maximum']),
  strategy: z.enum(['images', 'raster', 'rewrite', 'unchanged']),
  imagesRecompressed: z.number().int().nonnegative(),
  note: z.string(),
});

export type CompressPdfOutput = z.infer<typeof compressPdfOutputSchema>;

export function validateCompressPdfInput(input: unknown): Result<CompressPdfInput> {
  return parseWithSchema(
    compressPdfInputSchema,
    input,
    'Choose a PDF and a compression quality.',
  );
}

async function saveWithObjectStreams(doc: PDFDocument): Promise<Uint8Array> {
  const saved = await doc.save({ useObjectStreams: true });
  return saved instanceof Uint8Array ? saved : new Uint8Array(saved);
}

export async function buildPdfFromRasterPages(
  pages: RasterPageImage[],
  signal?: AbortSignal,
): Promise<Result<Uint8Array>> {
  const aborted = checkAbort(signal);
  if (!aborted.ok) return aborted;

  try {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pages.length; i++) {
      const abortedPage = checkAbort(signal);
      if (!abortedPage.ok) return abortedPage;
      const page = pages[i]!;
      const image = await doc.embedJpg(page.jpeg);
      const pdfPage = doc.addPage([page.widthPt, page.heightPt]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: page.widthPt,
        height: page.heightPt,
      });
    }
    return ok(await saveWithObjectStreams(doc));
  } catch (error) {
    return err(
      internalError('Failed to build compressed PDF from page images.', {
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

function reductionStats(originalBytes: number, compressedBytes: number) {
  const savedBytes = originalBytes - compressedBytes;
  const reductionPercent =
    originalBytes === 0 ? 0 : Math.round((savedBytes / originalBytes) * 1000) / 10;
  return { savedBytes, reductionPercent };
}

/**
 * Compress a PDF locally.
 *
 * - balanced: recompress embedded images + object-stream rewrite (text stays selectable)
 * - maximum: requires a host rasterizer (web: pdf.js); pages become JPEGs
 *
 * Always returns the smallest candidate that is still a valid PDF; if nothing
 * shrinks the file, returns the original bytes with strategy `unchanged`.
 */
export async function executeCompressPdf(
  input: CompressPdfInput,
  ctx?: CommandContext,
  deps?: CompressPdfDeps,
): Promise<Result<CompressPdfOutput>> {
  const validated = validateCompressPdfInput(input);
  if (!validated.ok) return validated;

  const aborted = checkAbort(ctx?.signal);
  if (!aborted.ok) return aborted;

  const quality = (validated.value.quality ?? CompressQuality.MEDIUM) as CompressQualityType;
  const mode = (validated.value.mode ?? CompressMode.BALANCED) as CompressModeType;
  const preset = COMPRESS_PRESETS[quality];
  const { file, outputFilename } = validated.value;
  const originalBytes = file.bytes.byteLength;

  if (originalBytes === 0) {
    return err(
      validationError('PDF is empty — nothing to compress.', 'Choose a non-empty PDF file.'),
    );
  }

  if (originalBytes > WEB_COMPRESS_HARD_MAX_BYTES) {
    return err(
      unsupportedError(
        `This PDF is ${(originalBytes / (1024 * 1024)).toFixed(0)} MB, which exceeds the browser’s safe compress limit.`,
        'Try a smaller file, Balanced mode on a lighter PDF, or wait for the desktop app.',
        { affectedFiles: [file.name] },
      ),
    );
  }

  ctx?.onProgress?.({
    operation: 'COMPRESS_PDF',
    filesProcessed: 0,
    totalFiles: 1,
    fraction: 0.05,
    message: 'Loading PDF…',
  });

  const loaded = await loadPdfDocument(file.name, file.bytes);
  if (!loaded.ok) return loaded;
  const pageCount = loaded.value.getPageCount();
  if (pageCount < 1) {
    return err(
      corruptError(`${file.name} isn’t a usable PDF (no pages).`, {
        affectedFiles: [file.name],
      }),
    );
  }

  if (mode === CompressMode.MAXIMUM) {
    const rasterCost = pageCount * preset.rasterScale * preset.rasterScale;
    if (rasterCost > WEB_COMPRESS_MAX_RASTER_COST) {
      return err(
        unsupportedError(
          `This PDF (${pageCount} pages) is too large for Maximum compression in the browser.`,
          'Use Balanced mode, try a shorter PDF, or wait for the desktop app.',
          { affectedFiles: [file.name], pageCount, rasterCost },
        ),
      );
    }
  }

  let bestBytes = file.bytes;
  let strategy: CompressPdfOutput['strategy'] = 'unchanged';
  let imagesRecompressed = 0;
  let note =
    'Little compressible image data found. File left unchanged. Try Maximum for stronger (image-based) compression, or wait for the desktop app.';

  try {
    if (mode === CompressMode.MAXIMUM) {
      if (!deps?.rasterize) {
        return err(
          unsupportedError(
            'Maximum PDF compression needs a local page renderer.',
            'Use Balanced mode on web, or run Maximum compression in a browser session that supports canvas rendering.',
          ),
        );
      }

      ctx?.onProgress?.({
        operation: 'COMPRESS_PDF',
        filesProcessed: 0,
        totalFiles: 1,
        fraction: 0.15,
        message: 'Rendering pages for maximum compression…',
      });

      const rasterized = await deps.rasterize({
        bytes: file.bytes,
        pageCount,
        scale: preset.rasterScale,
        jpegQuality: preset.jpegQuality,
        signal: ctx?.signal,
        onPage: (done, total) => {
          ctx?.onProgress?.({
            operation: 'COMPRESS_PDF',
            filesProcessed: 0,
            totalFiles: 1,
            fraction: 0.15 + (0.7 * done) / Math.max(1, total),
            message: `Rendering page ${done} of ${total}…`,
          });
        },
      });
      if (!rasterized.ok) return rasterized;

      const built = await buildPdfFromRasterPages(rasterized.value, ctx?.signal);
      if (!built.ok) return built;

      if (built.value.byteLength < bestBytes.byteLength) {
        bestBytes = built.value;
        strategy = 'raster';
        note =
          'Pages were re-encoded as images for a smaller file. Text may no longer be selectable. Deeper engines land in the desktop app.';
      }
    } else {
      ctx?.onProgress?.({
        operation: 'COMPRESS_PDF',
        filesProcessed: 0,
        totalFiles: 1,
        fraction: 0.35,
        message: 'Recompressing embedded images…',
      });

      const imageStats = recompressEmbeddedImages(loaded.value, preset, ctx?.signal);
      if ('aborted' in imageStats) {
        return err(cancelledError());
      }
      imagesRecompressed = imageStats.imagesRecompressed;

      const abortedAfterImages = checkAbort(ctx?.signal);
      if (!abortedAfterImages.ok) return abortedAfterImages;

      const afterImages = await saveWithObjectStreams(loaded.value);
      if (afterImages.byteLength < bestBytes.byteLength) {
        bestBytes = afterImages;
        strategy = imageStats.imagesRecompressed > 0 ? 'images' : 'rewrite';
        note =
          imageStats.imagesRecompressed > 0
            ? `Recompressed ${imageStats.imagesRecompressed} image(s) locally. Text stays selectable. Stronger compression arrives in the desktop app.`
            : 'Rewrote PDF streams locally. Few or no large images were found to shrink further. Try Maximum for stronger compression.';
      } else {
        const abortedBeforeRewrite = checkAbort(ctx?.signal);
        if (!abortedBeforeRewrite.ok) return abortedBeforeRewrite;

        // Fresh copy can still help when in-place mutation did not shrink enough.
        const rewritten = await PDFDocument.load(file.bytes);
        const copied = await PDFDocument.create();
        const pages = await copied.copyPages(
          rewritten,
          rewritten.getPageIndices(),
        );
        for (const page of pages) copied.addPage(page);
        const rewriteBytes = await saveWithObjectStreams(copied);
        if (rewriteBytes.byteLength < bestBytes.byteLength) {
          bestBytes = rewriteBytes;
          strategy = 'rewrite';
          note =
            'Rewrote PDF streams locally. Few or no large images were found to shrink further. Try Maximum for stronger compression.';
        }
      }
    }

    // Safety: never grow the file.
    if (bestBytes.byteLength > originalBytes) {
      bestBytes = file.bytes;
      strategy = 'unchanged';
      note =
        mode === CompressMode.BALANCED
          ? 'Compression did not reduce file size. Original file kept. Try Maximum mode or the desktop app for harder cases.'
          : 'Compression did not reduce file size. Original file kept. Try a lower quality setting or the desktop app.';
    }

    const abortedBeforeDone = checkAbort(ctx?.signal);
    if (!abortedBeforeDone.ok) return abortedBeforeDone;

    const { savedBytes, reductionPercent } = reductionStats(originalBytes, bestBytes.byteLength);

    ctx?.onProgress?.({
      operation: 'COMPRESS_PDF',
      filesProcessed: 1,
      totalFiles: 1,
      fraction: 1,
      message: 'Compression complete',
    });

    return ok({
      filename: ensurePdfFilename(
        outputFilename ?? `${file.name.replace(/\.pdf$/i, '')}-compressed.pdf`,
      ),
      bytes: bestBytes,
      pageCount,
      originalBytes,
      compressedBytes: bestBytes.byteLength,
      savedBytes,
      reductionPercent,
      quality,
      mode,
      strategy,
      imagesRecompressed,
      note,
    });
  } catch (error) {
    return err(
      internalError('Failed to compress PDF.', {
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

export const compressPdfCommand: CommandDefinition<CompressPdfInput, CompressPdfOutput> = {
  name: CommandName.COMPRESS_PDF,
  description:
    'Compress a PDF locally by recompressing images (balanced) or rasterizing pages (maximum).',
  inputSchema: compressPdfInputSchema,
  outputSchema: compressPdfOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.PDF],
  validate: validateCompressPdfInput,
  execute: (input, ctx) => executeCompressPdf(input, ctx),
};

export { compressPdfCommand as COMPRESS_PDF };
