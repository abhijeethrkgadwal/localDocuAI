import { PDFDocument, degrees, type PDFPage } from 'pdf-lib';
import {
  cancelledError,
  corruptError,
  encryptedError,
  err,
  ok,
  validationError,
  type CommandFilePayload,
  type Result,
} from '@localdoc/core';
import { z } from 'zod';

export const pdfBytesSchema = z.custom<Uint8Array>(
  (val) => val instanceof Uint8Array,
  'Expected binary PDF data.',
);

export const commandFileSchema: z.ZodType<CommandFilePayload> = z.object({
  name: z.string().min(1),
  bytes: pdfBytesSchema,
});

export function ensurePdfFilename(name: string, fallback = 'output.pdf'): string {
  const base = name.trim() || fallback;
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

export function classifyPdfLoadError(
  name: string,
  error: unknown,
): { category: 'encrypted' | 'corrupt'; message: string } {
  const text = error instanceof Error ? error.message : String(error);
  const lower = text.toLowerCase();

  if (lower.includes('encrypted') || lower.includes('password') || lower.includes('isencrypted')) {
    return { category: 'encrypted', message: `${name} is password protected.` };
  }

  return { category: 'corrupt', message: `${name} could not be read as a PDF.` };
}

export async function loadPdfDocument(
  name: string,
  bytes: Uint8Array,
): Promise<Result<PDFDocument>> {
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    return ok(doc);
  } catch (error) {
    const classified = classifyPdfLoadError(name, error);
    if (classified.category === 'encrypted') {
      return err(encryptedError(classified.message, { affectedFiles: [name] }));
    }
    return err(corruptError(classified.message, { affectedFiles: [name] }));
  }
}

export function checkAbort(signal?: AbortSignal): Result<void> {
  if (signal?.aborted) return err(cancelledError());
  return ok(undefined);
}

export async function savePdf(doc: PDFDocument): Promise<Uint8Array> {
  const saved = await doc.save();
  return saved instanceof Uint8Array ? saved : new Uint8Array(saved);
}

/** Parse "1-3,5" style specs into 1-based page numbers. */
export function parsePageSpec(spec: string, pageCount: number): Result<number[]> {
  const trimmed = spec.trim();
  if (!trimmed) {
    return err(validationError('Enter at least one page number.', 'Example: 1-3,5'));
  }

  const pages = new Set<number>();
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
        return err(
          validationError(`Invalid page range “${part}”.`, 'Use ascending ranges like 2-5.'),
        );
      }
      if (end > pageCount) {
        return err(
          validationError(`Page range “${part}” is outside this PDF (${pageCount} pages).`, 'Check the page count and try again.'),
        );
      }
      for (let i = start; i <= end; i++) pages.add(i);
      continue;
    }

    if (!/^\d+$/.test(part)) {
      return err(validationError(`Invalid page “${part}”.`, 'Use numbers or ranges like 1-3,5.'));
    }

    const page = Number(part);
    if (page < 1 || page > pageCount) {
      return err(
        validationError(`Page ${page} is outside this PDF (${pageCount} pages).`, 'Check the page count and try again.'),
      );
    }
    pages.add(page);
  }

  return ok([...pages].sort((a, b) => a - b));
}

export function toZeroBased(pages1Based: number[]): number[] {
  return pages1Based.map((p) => p - 1);
}

export function assertPermutation(order: number[], pageCount: number): Result<number[]> {
  if (order.length !== pageCount) {
    return err(
      validationError(
        `Reorder list must include all ${pageCount} pages exactly once.`,
        'Provide a full permutation of page numbers.',
      ),
    );
  }
  const sorted = [...order].sort((a, b) => a - b);
  for (let i = 0; i < pageCount; i++) {
    if (sorted[i] !== i + 1) {
      return err(
        validationError('Reorder list must be a permutation of all page numbers.', 'Example for 3 pages: 3,1,2'),
      );
    }
  }
  return ok(order);
}

export type RotationDegrees = 90 | 180 | 270;

export function applyRotation(page: PDFPage, rotation: RotationDegrees): void {
  const current = page.getRotation().angle;
  page.setRotation(degrees((current + rotation) % 360));
}

export { degrees };
