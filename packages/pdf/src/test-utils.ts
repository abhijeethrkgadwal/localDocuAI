import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/** Create a minimal single-page PDF for tests (no fixture files on disk required). */
export async function createTestPdf(
  label: string,
  options: { pageCount?: number } = {},
): Promise<Uint8Array> {
  const pageCount = options.pageCount ?? 1;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([400, 200]);
    page.drawText(`${label} — page ${i + 1}`, {
      x: 40,
      y: 100,
      size: 14,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  const saved = await doc.save();
  return saved instanceof Uint8Array ? saved : new Uint8Array(saved);
}

export async function createTestPdfs(
  count: number,
  namePrefix = 'doc',
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const files: { name: string; bytes: Uint8Array }[] = [];
  for (let i = 1; i <= count; i++) {
    const name = `${namePrefix}${i}.pdf`;
    files.push({ name, bytes: await createTestPdf(name) });
  }
  return files;
}
