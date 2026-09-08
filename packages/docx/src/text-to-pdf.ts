import {
  cancelledError,
  err,
  ok,
  unsupportedError,
  type Result,
} from '@localdoc/core';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const FONT_SIZE = 11;
const LINE_HEIGHT = FONT_SIZE * 1.4;

/** Soft ceiling so a huge extract cannot freeze / OOM the tab. */
export const WEB_MAX_PDF_PAGES = 200;
export const WEB_MAX_SOURCE_CHARS = 500_000;

export interface BuildSimpleTextPdfOptions {
  signal?: AbortSignal;
  maxPages?: number;
  maxSourceChars?: number;
  emptyPlaceholder?: string;
}

/** pdf-lib WinAnsi fonts cannot encode arbitrary Unicode — replace unsupported chars. */
export function toPdfSafeText(text: string): string {
  return [...text]
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code === 9) return '  ';
      if (code === 10 || code === 13) return ch;
      // Basic Latin + Latin-1 supplement commonly in WinAnsi
      if (code >= 32 && code <= 126) return ch;
      if (code >= 160 && code <= 255) return ch;
      return '?';
    })
    .join('');
}

function wrapLine(
  line: string,
  font: { widthOfTextAtSize: (t: string, size: number) => number },
  maxWidth: number,
): string[] {
  const safe = toPdfSafeText(line);
  if (!safe.trim()) return [''];
  const words = safe.split(/\s+/);
  const rows: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, FONT_SIZE) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) rows.push(current);
    if (font.widthOfTextAtSize(word, FONT_SIZE) <= maxWidth) {
      current = word;
      continue;
    }
    // Hard-break oversized tokens
    let chunk = '';
    for (const ch of word) {
      const next = chunk + ch;
      if (font.widthOfTextAtSize(next, FONT_SIZE) <= maxWidth) {
        chunk = next;
      } else {
        if (chunk) rows.push(chunk);
        chunk = ch;
      }
    }
    current = chunk;
  }
  if (current) rows.push(current);
  return rows.length ? rows : [''];
}

/** Build a simple multi-page PDF from plain text (not Word-layout faithful). */
export async function buildSimpleTextPdf(
  text: string,
  options: BuildSimpleTextPdfOptions = {},
): Promise<Result<{ bytes: Uint8Array; pageCount: number; truncated: boolean; emptySource: boolean }>> {
  if (options.signal?.aborted) return err(cancelledError());

  const maxPages = options.maxPages ?? WEB_MAX_PDF_PAGES;
  const maxChars = options.maxSourceChars ?? WEB_MAX_SOURCE_CHARS;
  const emptySource = !text.trim();
  let truncated = false;
  let source = text;
  if (source.length > maxChars) {
    source = source.slice(0, maxChars);
    truncated = true;
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;
  const lines = emptySource
    ? [options.emptyPlaceholder ?? '(No extractable text found.)']
    : source.split(/\r?\n/);
  if (truncated) {
    lines.push('', '[Truncated — document text exceeded the web conversion limit.]');
  }
  const wrapped = lines.flatMap((line) => wrapLine(line, font, maxWidth));

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  let pageCount = 1;

  for (let i = 0; i < wrapped.length; i++) {
    if (i > 0 && i % 250 === 0 && options.signal?.aborted) {
      return err(cancelledError());
    }

    const row = wrapped[i]!;
    if (y < MARGIN + LINE_HEIGHT) {
      if (pageCount >= maxPages) {
        return err(
          unsupportedError(
            `Document text would produce more than ${maxPages} PDF pages in the browser.`,
            'Try a shorter file, or wait for the desktop app (coming soon) for larger conversions.',
          ),
        );
      }
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageCount += 1;
      y = PAGE_HEIGHT - MARGIN;
    }
    if (row) {
      page.drawText(row, {
        x: MARGIN,
        y: y - FONT_SIZE,
        size: FONT_SIZE,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }
    y -= LINE_HEIGHT;
  }

  if (options.signal?.aborted) return err(cancelledError());

  const saved = await doc.save();
  const bytes = saved instanceof Uint8Array ? saved : new Uint8Array(saved);
  return ok({ bytes, pageCount: doc.getPageCount(), truncated, emptySource });
}
