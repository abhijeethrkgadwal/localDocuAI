import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { executeConvertToPdf, executeDocxToPdf } from './to-pdf.js';
import { createTestDocx } from './test-utils.js';

describe('CONVERT_TO_PDF', () => {
  it('converts a simple DOCX to a readable PDF when capacity allows', async () => {
    const bytes = await createTestDocx('Invoice Alpha');
    const result = await executeConvertToPdf(
      {
        file: { name: 'invoice.docx', bytes },
        declaredSizeBytes: bytes.byteLength,
      },
      {
        // Force a roomy capacity profile in Node (no navigator.deviceMemory).
      },
    );

    // Inject capacity via declared size only — Node has no deviceMemory; default
    // unknown-hardware cap should still accept fixture sizes.
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.filename).toBe('invoice.pdf');
    expect(result.value.sourceFormat).toBe('docx');
    expect(result.value.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.value.fidelityNote.toLowerCase()).toContain('simple');

    const pdf = await PDFDocument.load(result.value.bytes);
    expect(pdf.getPageCount()).toBe(result.value.pageCount);
  });

  it('refuses work when declared size exceeds web capacity', async () => {
    const bytes = await createTestDocx('TooBig');
    const result = await executeConvertToPdf({
      file: { name: 'too-big.docx', bytes },
      declaredSizeBytes: 80 * 1024 * 1024,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('unsupported');
    expect(result.error.recovery?.toLowerCase()).toContain('desktop');
  });

  it('rejects executeDocxToPdf called without a payload', async () => {
    const result = await executeDocxToPdf();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('validation');
  });

  it('rejects non-Word filenames', async () => {
    const result = await executeConvertToPdf({
      file: { name: 'notes.txt', bytes: new TextEncoder().encode('hi') },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('validation');
  });

  it('notes empty extractable text in fidelity copy', async () => {
    const { buildSimpleTextPdf } = await import('./text-to-pdf.js');
    const built = await buildSimpleTextPdf('   ');
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.value.emptySource).toBe(true);
    expect(built.value.pageCount).toBe(1);
  });

  it('honours abort during conversion', async () => {
    const bytes = await createTestDocx('Cancel me');
    const controller = new AbortController();
    controller.abort();
    const result = await executeConvertToPdf(
      { file: { name: 'cancel.docx', bytes } },
      { signal: controller.signal },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('cancelled');
  });
});
