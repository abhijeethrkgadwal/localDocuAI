import { encode as encodeJpeg } from 'jpeg-js';
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

/** PDF with a large embedded JPEG — used to prove balanced compression shrinks files. */
export async function createTestPdfWithJpeg(
  label: string,
  options: { width?: number; height?: number; jpegQuality?: number } = {},
): Promise<Uint8Array> {
  const width = options.width ?? 800;
  const height = options.height ?? 600;
  const jpegQuality = options.jpegQuality ?? 95;

  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rgba[i] = (x * 3 + y) % 256;
      rgba[i + 1] = (x * 7) % 256;
      rgba[i + 2] = (y * 11) % 256;
      rgba[i + 3] = 255;
    }
  }

  const encoded = encodeJpeg({ data: rgba, width, height }, jpegQuality);
  const jpeg = encoded.data instanceof Uint8Array ? encoded.data : new Uint8Array(encoded.data);

  const doc = await PDFDocument.create();
  const image = await doc.embedJpg(jpeg);
  const page = doc.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(label, {
    x: 24,
    y: height - 36,
    size: 18,
    font,
    color: rgb(1, 1, 1),
  });

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
