import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createTestDocx } from '../../../packages/docx/src/test-utils';
import { createTestPdf, createTestPdfWithJpeg } from '../../../packages/pdf/src/test-utils';
import { FIXTURE_DIR } from './fixtures';

export default async function globalSetup() {
  await mkdir(FIXTURE_DIR, { recursive: true });

  const files: Record<string, Uint8Array> = {
    'alpha.pdf': await createTestPdf('Alpha', { pageCount: 2 }),
    'bravo.pdf': await createTestPdf('Bravo', { pageCount: 1 }),
    'multi-4.pdf': await createTestPdf('Multi', { pageCount: 4 }),
    'scan.pdf': await createTestPdfWithJpeg('Scan', { width: 800, height: 600, jpegQuality: 98 }),
    'letter-a.docx': await createTestDocx('Letter A', { withTable: true }),
    'letter-b.docx': await createTestDocx('Letter B', { withPageBreak: true }),
    'broken.pdf': new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0, 1, 2, 3, 4]),
    'notes.txt': new TextEncoder().encode('not a document'),
  };

  for (const [name, bytes] of Object.entries(files)) {
    await writeFile(path.join(FIXTURE_DIR, name), bytes);
  }

  const folder = path.join(FIXTURE_DIR, 'folder');
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'one.pdf'), files['alpha.pdf']!);
  await writeFile(path.join(folder, 'two.pdf'), files['bravo.pdf']!);
  await writeFile(path.join(folder, 'skip.txt'), files['notes.txt']!);
}
