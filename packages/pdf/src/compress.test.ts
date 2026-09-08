import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  CompressMode,
  CompressQuality,
  WEB_COMPRESS_HARD_MAX_BYTES,
  buildPdfFromRasterPages,
  compressPdfCommand,
  executeCompressPdf,
  pdfCommandRegistry,
  validateCompressPdfInput,
} from '../src/index.js';
import { createTestPdf, createTestPdfWithJpeg } from '../src/test-utils.js';
import { encode as encodeJpeg } from 'jpeg-js';

describe('@localdoc/pdf COMPRESS_PDF', () => {
  it('registers COMPRESS_PDF in the PDF registry', () => {
    expect(pdfCommandRegistry.has('COMPRESS_PDF')).toBe(true);
    expect(pdfCommandRegistry.get('COMPRESS_PDF')).toBe(compressPdfCommand);
  });

  it('validates input', () => {
    const bad = validateCompressPdfInput({});
    expect(bad.ok).toBe(false);

    const good = validateCompressPdfInput({
      file: { name: 'a.pdf', bytes: new Uint8Array([1, 2, 3]) },
      quality: 'medium',
      mode: 'balanced',
    });
    expect(good.ok).toBe(true);
  });

  it('shrinks a PDF with a large embedded JPEG in balanced mode', async () => {
    const bytes = await createTestPdfWithJpeg('photo-scan', {
      width: 900,
      height: 700,
      jpegQuality: 98,
    });

    const result = await executeCompressPdf({
      file: { name: 'scan.pdf', bytes },
      quality: CompressQuality.LOW,
      mode: CompressMode.BALANCED,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.compressedBytes).toBeLessThan(result.value.originalBytes);
    expect(result.value.savedBytes).toBeGreaterThan(0);
    expect(result.value.imagesRecompressed).toBeGreaterThan(0);
    expect(['images', 'rewrite']).toContain(result.value.strategy);

    const loaded = await PDFDocument.load(result.value.bytes);
    expect(loaded.getPageCount()).toBe(1);
  });

  it('does not enlarge a tiny text PDF', async () => {
    const bytes = await createTestPdf('tiny');
    const result = await executeCompressPdf({
      file: { name: 'tiny.pdf', bytes },
      quality: 'medium',
      mode: 'balanced',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.compressedBytes).toBeLessThanOrEqual(result.value.originalBytes);
  });

  it('rejects empty PDF bytes', async () => {
    const result = await executeCompressPdf({
      file: { name: 'empty.pdf', bytes: new Uint8Array(0) },
      mode: 'balanced',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('validation');
  });

  it('rejects oversized PDFs for browser compress', async () => {
    const bytes = await createTestPdf('big-label');
    const huge = new Uint8Array(WEB_COMPRESS_HARD_MAX_BYTES + 1);
    huge.set(bytes.subarray(0, Math.min(bytes.length, 64)), 0);
    const result = await executeCompressPdf({
      file: { name: 'huge.pdf', bytes: huge },
      mode: 'balanced',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('unsupported');
  });

  it('rejects maximum mode without a rasterizer', async () => {
    const bytes = await createTestPdf('need-raster');
    const result = await executeCompressPdf({
      file: { name: 'a.pdf', bytes },
      mode: 'maximum',
      quality: 'medium',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('unsupported');
  });

  it('maximum mode rebuilds from raster pages via injected rasterizer', async () => {
    const source = await createTestPdf('raster-me', { pageCount: 2 });
    const rgba = new Uint8Array(40 * 30 * 4);
    rgba.fill(200);
    for (let i = 3; i < rgba.length; i += 4) rgba[i] = 255;
    const encoded = encodeJpeg({ data: rgba, width: 40, height: 30 }, 50);
    const jpeg = encoded.data instanceof Uint8Array ? encoded.data : new Uint8Array(encoded.data);

    // Make a deliberately large “page image” so compression has room to win.
    const bigRgba = new Uint8Array(320 * 240 * 4);
    for (let i = 0; i < bigRgba.length; i += 4) {
      bigRgba[i] = (i * 13) % 256;
      bigRgba[i + 1] = (i * 7) % 256;
      bigRgba[i + 2] = (i * 3) % 256;
      bigRgba[i + 3] = 255;
    }
    const bigEncoded = encodeJpeg({ data: bigRgba, width: 320, height: 240 }, 95);
    const bigJpeg =
      bigEncoded.data instanceof Uint8Array ? bigEncoded.data : new Uint8Array(bigEncoded.data);

    const bulkyDoc = await PDFDocument.create();
    for (let i = 0; i < 2; i++) {
      const image = await bulkyDoc.embedJpg(bigJpeg);
      const page = bulkyDoc.addPage([320, 240]);
      page.drawImage(image, { x: 0, y: 0, width: 320, height: 240 });
    }
    const bulkyBytes = await bulkyDoc.save();
    const inputBytes =
      bulkyBytes instanceof Uint8Array ? bulkyBytes : new Uint8Array(bulkyBytes);

    const result = await executeCompressPdf(
      {
        file: { name: 'bulky.pdf', bytes: inputBytes },
        mode: CompressMode.MAXIMUM,
        quality: CompressQuality.LOW,
      },
      undefined,
      {
        rasterize: async () => ({
          ok: true,
          value: [
            { jpeg, widthPt: 200, heightPt: 150 },
            { jpeg, widthPt: 200, heightPt: 150 },
          ],
        }),
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.strategy).toBe('raster');
    expect(result.value.compressedBytes).toBeLessThan(result.value.originalBytes);
    expect(result.value.pageCount).toBe(2);
    void source;
  });

  it('buildPdfFromRasterPages creates a valid multi-page PDF', async () => {
    const rgba = new Uint8Array(20 * 20 * 4);
    for (let i = 0; i < rgba.length; i += 4) {
      rgba[i] = 255;
      rgba[i + 1] = 0;
      rgba[i + 2] = 0;
      rgba[i + 3] = 255;
    }
    const encoded = encodeJpeg({ data: rgba, width: 20, height: 20 }, 80);
    const jpeg = encoded.data instanceof Uint8Array ? encoded.data : new Uint8Array(encoded.data);
    const built = await buildPdfFromRasterPages([
      { jpeg, widthPt: 100, heightPt: 100 },
      { jpeg, widthPt: 100, heightPt: 100 },
    ]);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const doc = await PDFDocument.load(built.value);
    expect(doc.getPageCount()).toBe(2);
  });

  it('reports progress and respects abort before work', async () => {
    const bytes = await createTestPdfWithJpeg('abort', { width: 200, height: 200 });
    const controller = new AbortController();
    controller.abort();
    const result = await executeCompressPdf(
      { file: { name: 'a.pdf', bytes }, quality: 'medium', mode: 'balanced' },
      { signal: controller.signal },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('cancelled');
  });
});
