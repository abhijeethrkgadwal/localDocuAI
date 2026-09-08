import {
  cancelledError,
  encryptedError,
  err,
  internalError,
  ok,
  type Result,
} from '@localdoc/core';
import type { CompressPdfRasterizer, RasterPageImage } from '@localdoc/pdf';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';

let workerConfigured = false;

function ensurePdfJsWorker(): void {
  if (workerConfigured) return;
  // Vite resolves the worker URL at build time for offline-capable bundling.
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  workerConfigured = true;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas failed to encode JPEG.'));
          return;
        }
        void blob.arrayBuffer().then((buffer) => resolve(new Uint8Array(buffer)), reject);
      },
      'image/jpeg',
      Math.min(1, Math.max(0.05, quality / 100)),
    );
  });
}

function classifyPdfJsError(error: unknown): Result<never> {
  const text = error instanceof Error ? error.message : String(error);
  const lower = text.toLowerCase();
  const name = error instanceof Error ? error.name : '';
  if (
    lower.includes('password') ||
    lower.includes('encrypted') ||
    name === 'PasswordException'
  ) {
    return err(
      encryptedError('This PDF is password protected.', undefined, 'Unlock a copy locally, then compress again.'),
    );
  }
  return err(
    internalError('Failed to render PDF pages for compression.', {
      reason: text,
    }),
  );
}

/**
 * Browser rasterizer for maximum PDF compression (pdf.js + canvas).
 * Runs entirely on-device; no network calls.
 */
export const browserPdfRasterizer: CompressPdfRasterizer = async ({
  bytes,
  pageCount,
  scale,
  jpegQuality,
  signal,
  onPage,
}): Promise<Result<RasterPageImage[]>> => {
  if (typeof document === 'undefined') {
    return err(
      internalError('Maximum compression requires a browser canvas environment.'),
    );
  }

  ensurePdfJsWorker();

  let pdf: PDFDocumentProxy | null = null;
  let loadingTask: ReturnType<typeof getDocument> | null = null;
  try {
    if (signal?.aborted) return err(cancelledError());

    // pdf.js requires a transferable/detached-safe copy.
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);

    loadingTask = getDocument({ data: copy });
    pdf = await loadingTask.promise;

    const pages: RasterPageImage[] = [];
    const total = Math.min(pageCount, pdf.numPages);

    for (let pageIndex = 0; pageIndex < total; pageIndex++) {
      if (signal?.aborted) return err(cancelledError());

      const page = await pdf.getPage(pageIndex + 1);
      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) {
        return err(internalError('Could not create a canvas for PDF compression.'));
      }

      await page.render({
        canvasContext: context,
        viewport,
        canvas,
      }).promise;

      const jpeg = await canvasToJpeg(canvas, jpegQuality);
      pages.push({
        jpeg,
        widthPt: baseViewport.width,
        heightPt: baseViewport.height,
      });

      // Release canvas memory promptly on long docs.
      canvas.width = 0;
      canvas.height = 0;
      onPage?.(pageIndex + 1, total);
    }

    return ok(pages);
  } catch (error) {
    if (signal?.aborted) return err(cancelledError());
    return classifyPdfJsError(error);
  } finally {
    if (pdf) {
      try {
        await pdf.cleanup();
      } catch {
        // ignore cleanup failures
      }
    }
    if (loadingTask) {
      try {
        await loadingTask.destroy();
      } catch {
        // ignore destroy failures (including early abort)
      }
    }
  }
};
