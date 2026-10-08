import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import {
  addFiles,
  collectDownloads,
  fileRows,
  fixture,
  pdfPageCount,
  pdfRotations,
  successStatus,
  trackPageErrors,
  useFallbackFilePickers,
} from './fixtures';

test.beforeEach(async ({ page }) => {
  await useFallbackFilePickers(page);
});

const fileRow = (page: Page, name: string) =>
  page.getByRole('button', { name: `Select ${name} for preview` });

const runButton = (page: Page, name: string | RegExp) =>
  page
    .getByRole('region', { name: /What would you like to do|Merge|Compress|Convert|Split|Extract|Delete|Rotate|Reorder/ })
    .getByRole('button', { name, exact: typeof name === 'string' });

async function fileOrder(page: Page): Promise<string[]> {
  return fileRows(page)
    .locator('button[aria-pressed]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')!.replace(/^Select (.+) for preview$/, '$1')));
}

test.describe('home workspace: file list controls', () => {
  test('select, reorder, preview, remove and clear', async ({ page }) => {
    const tracker = trackPageErrors(page);
    await page.goto('/');
    await addFiles(page, ['alpha.pdf', 'bravo.pdf', 'letter-a.docx']);

    await expect(page.getByRole('status').filter({ hasText: '3 document(s) selected.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '3 documents' })).toBeVisible();
    await expect.poll(() => fileOrder(page)).toEqual(['alpha.pdf', 'bravo.pdf', 'letter-a.docx']);

    const rows = fileRows(page);
    await expect(rows.nth(0).getByRole('button', { name: 'Move document up' })).toBeDisabled();
    await expect(rows.nth(2).getByRole('button', { name: 'Move document down' })).toBeDisabled();

    await rows.nth(0).getByRole('button', { name: 'Move document down' }).click();
    await expect.poll(() => fileOrder(page)).toEqual(['bravo.pdf', 'alpha.pdf', 'letter-a.docx']);
    await rows.nth(2).getByRole('button', { name: 'Move document up' }).click();
    await expect.poll(() => fileOrder(page)).toEqual(['bravo.pdf', 'letter-a.docx', 'alpha.pdf']);

    await fileRow(page, 'alpha.pdf').click();
    await expect(fileRow(page, 'alpha.pdf')).toHaveAttribute('aria-pressed', 'true');
    const preview = page.getByRole('region', { name: 'Preview' });
    await expect(preview.locator('iframe')).toHaveAttribute('src', /^blob:/);
    await expect(preview.getByRole('link', { name: 'Open preview in new tab' })).toHaveAttribute(
      'href',
      /^blob:/,
    );

    await fileRow(page, 'letter-a.docx').click();
    await expect(preview.getByText('Letter A').first()).toBeVisible();

    await rows.nth(0).getByRole('button', { name: 'Remove document' }).click();
    await expect(page.getByRole('heading', { name: '2 documents' })).toBeVisible();
    await expect.poll(() => fileOrder(page)).toEqual(['letter-a.docx', 'alpha.pdf']);

    await page.getByRole('button', { name: 'Clear all documents from this session' }).click();
    await expect(page.getByText('No documents yet')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear all documents from this session' })).toBeDisabled();
    tracker.expectNone();
  });

  test('unsupported file is ignored on select', async ({ page }) => {
    await page.goto('/');
    await addFiles(page, ['alpha.pdf', 'notes.txt']);
    await expect(page.getByRole('heading', { name: '1 document' })).toBeVisible();
  });

  test('drag-and-drop adds supported files and rejects others', async ({ page }) => {
    await page.goto('/');
    const dropzone = page.getByRole('region', { name: /Document drop zone/ });

    const drop = async (files: { name: string; type: string; b64: string }[]) => {
      const dt = await page.evaluateHandle((list) => {
        const transfer = new DataTransfer();
        for (const f of list) {
          const bytes = Uint8Array.from(atob(f.b64), (c) => c.charCodeAt(0));
          transfer.items.add(new File([bytes], f.name, { type: f.type }));
        }
        return transfer;
      }, files);
      await dropzone.dispatchEvent('dragover', { dataTransfer: dt });
      await dropzone.dispatchEvent('drop', { dataTransfer: dt });
    };
    const b64 = async (name: string) => (await readFile(fixture(name))).toString('base64');

    await drop([{ name: 'notes.txt', type: 'text/plain', b64: await b64('notes.txt') }]);
    await expect(page.getByRole('alert').filter({ hasText: /Drop .* files only/ })).toBeVisible();

    await drop([
      { name: 'alpha.pdf', type: 'application/pdf', b64: await b64('alpha.pdf') },
      { name: 'notes.txt', type: 'text/plain', b64: await b64('notes.txt') },
    ]);
    await expect(page.getByRole('status').filter({ hasText: /1 document\(s\) loaded from drop/ })).toBeVisible();

    await drop([{ name: 'bravo.pdf', type: 'application/pdf', b64: await b64('bravo.pdf') }]);
    await expect(page.getByRole('status').filter({ hasText: /appended from drop/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: '2 documents' })).toBeVisible();
  });

  test('select folder (webkitdirectory fallback) loads only documents', async ({ page }) => {
    await page.goto('/');
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Select folder' }).click();
    await (await chooser).setFiles(fixture('folder'));
    await expect(page.getByRole('heading', { name: '2 documents' })).toBeVisible();
    await expect(page.getByText(/From folder · local only/)).toBeVisible();
  });
});

test.describe('home workspace: organize panel', () => {
  test('sort, filter, rename, duplicate, move, export', async ({ page }) => {
    const tracker = trackPageErrors(page);
    await page.goto('/');
    await addFiles(page, ['bravo.pdf', 'alpha.pdf', 'multi-4.pdf']);
    const panel = page.getByRole('region', { name: 'Organize files' });

    await panel.locator('select').first().selectOption('alphabetical');
    await panel.getByRole('button', { name: 'Apply' }).nth(0).click();
    await expect(panel.getByText('Sorted files in this session.')).toBeVisible();
    await expect.poll(() => fileOrder(page)).toEqual(['alpha.pdf', 'bravo.pdf', 'multi-4.pdf']);

    await panel.getByPlaceholder('Name contains…').fill('bra');
    await panel.getByRole('button', { name: 'Apply' }).nth(1).click();
    await expect(panel.getByText(/Showing matches for “bra” \(1 of 3\)/)).toBeVisible();
    await expect.poll(() => fileOrder(page)).toEqual(['bravo.pdf']);
    await panel.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(panel.getByText(/Filter cleared/)).toBeVisible();
    await expect.poll(() => fileOrder(page)).toHaveLength(3);

    await panel.getByRole('textbox', { name: /Rename pattern/ }).fill('doc_{nn}');
    await panel.getByRole('button', { name: 'Rename', exact: true }).click();
    await expect(panel.getByText('Renamed 3 file(s) in this session.')).toBeVisible();
    await expect.poll(() => fileOrder(page)).toEqual(['doc_01.pdf', 'doc_02.pdf', 'doc_03.pdf']);

    await panel.getByRole('button', { name: 'Duplicate' }).click();
    await expect(panel.getByText('Duplicated 3 file(s) in this session.')).toBeVisible();
    await expect(page.getByRole('heading', { name: '6 documents' })).toBeVisible();

    await panel.getByRole('textbox', { name: /Move \(session path/ }).fill('archive');
    await panel.getByRole('button', { name: 'Move', exact: true }).click();
    await expect(panel.getByText(/Updated session paths for 6 file\(s\) → archive\//)).toBeVisible();

    await expect(panel.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();

    const downloads = await collectDownloads(page, 6, () =>
      panel.getByRole('button', { name: 'Export' }).click(),
    );
    await expect(panel.getByText(/Exported 6 file\(s\)/)).toBeVisible();
    expect(downloads.map((d) => d.suggestedFilename()).sort()).toEqual(
      expect.arrayContaining(['doc_01.pdf', 'doc_02.pdf', 'doc_03.pdf']),
    );
    tracker.expectNone();
  });
});

test.describe('home workspace: operation picker', () => {
  test('switching operation shows the right inputs and disabled reasons', async ({ page }) => {
    await page.goto('/');
    const ops = page.getByRole('region', { name: 'What would you like to do?' });
    const select = ops.locator('select').first();
    const run = ops.getByRole('button', { name: 'Run', exact: true });

    await expect(run).toBeDisabled();
    await expect(ops.getByText('Add at least two PDF or DOCX files of the same type to merge.')).toBeVisible();
    await expect(ops.getByRole('textbox', { name: 'Tell LocalDocu what you want' })).toBeDisabled();

    await select.selectOption('compress');
    await expect(ops.getByText('Compression mode')).toBeVisible();
    await expect(ops.getByText('Quality target')).toBeVisible();

    await select.selectOption('extract');
    await expect(ops.getByText('Pages (required)')).toBeVisible();

    await select.selectOption('rotate');
    await expect(ops.getByText('Pages (optional — leave blank for all)')).toBeVisible();
    await expect(ops.getByText('Rotation', { exact: true })).toBeVisible();

    await select.selectOption('reorder');
    await expect(ops.getByText('New page order')).toBeVisible();

    await select.selectOption('convertToPdf');
    await expect(ops.getByText(/Creates a locally generated PDF/)).toBeVisible();

    await addFiles(page, ['alpha.pdf']);
    await expect(ops.getByText(/Convert to PDF works on DOC\/DOCX only|Select a DOC or DOCX/)).toBeVisible();
    await select.selectOption('split');
    await expect(run).toBeEnabled();
  });

  test('merge on home: PDFs merge, button reports Completed', async ({ page }) => {
    await page.goto('/');
    await addFiles(page, ['alpha.pdf', 'bravo.pdf']);
    const ops = page.getByRole('region', { name: 'What would you like to do?' });
    const [download] = await collectDownloads(page, 1, () =>
      ops.getByRole('button', { name: 'Run', exact: true }).click(),
    );
    expect(download!.suggestedFilename()).toMatch(/\.pdf$/);
    expect(await pdfPageCount(download!)).toBe(3);
    await expect(successStatus(page)).toContainText(/Merged 2 PDFs/);
    await expect(ops.getByRole('button', { name: 'Completed' })).toBeVisible();
  });

  test('merge rejects mixed PDF + DOCX with a clear error', async ({ page }) => {
    await page.goto('/');
    await addFiles(page, ['alpha.pdf', 'letter-a.docx']);
    const ops = page.getByRole('region', { name: 'What would you like to do?' });
    const run = ops.getByRole('button', { name: 'Run', exact: true });
    if (await run.isEnabled()) {
      await run.click();
      await expect(ops.getByRole('alert')).toContainText(/same type/i);
      await expect(ops.getByRole('button', { name: 'Try again' })).toBeVisible();
    } else {
      await expect(ops.getByText(/same type/i)).toBeVisible();
    }
  });
});

test.describe('dedicated tool pages', () => {
  test('/merge-pdf merges PDFs in list order', async ({ page }) => {
    await page.goto('/merge-pdf');
    await addFiles(page, ['bravo.pdf', 'alpha.pdf']);
    // New selections are natural-sorted by name.
    await expect.poll(() => fileOrder(page)).toEqual(['alpha.pdf', 'bravo.pdf']);
    await fileRows(page).nth(0).getByRole('button', { name: 'Move document down' }).click();
    await expect.poll(() => fileOrder(page)).toEqual(['bravo.pdf', 'alpha.pdf']);
    const [download] = await collectDownloads(page, 1, () =>
      runButton(page, 'Merge').click(),
    );
    expect(await pdfPageCount(download!)).toBe(3);
    await expect(successStatus(page)).toBeVisible();
  });

  test('/merge-pdf needs two files before Merge enables', async ({ page }) => {
    await page.goto('/merge-pdf');
    await expect(runButton(page, 'Merge')).toBeDisabled();
    await addFiles(page, ['alpha.pdf']);
    await expect(runButton(page, 'Merge')).toBeDisabled();
    await expect(page.locator('#run-disabled-reason')).toContainText('Add at least two PDF files');
  });

  test('/merge-docx merges Word files into a DOCX', async ({ page }) => {
    await page.goto('/merge-docx');
    await addFiles(page, ['letter-a.docx', 'letter-b.docx']);
    const [download] = await collectDownloads(page, 1, () => runButton(page, 'Merge').click());
    expect(download!.suggestedFilename()).toMatch(/\.docx$/);
    const bytes = await readFile(await download!.path());
    expect(bytes.subarray(0, 2).toString()).toBe('PK');
    await expect(successStatus(page)).toBeVisible();
  });

  test('/docx-to-pdf converts a Word file to PDF', async ({ page }) => {
    await page.goto('/docx-to-pdf');
    await addFiles(page, ['letter-a.docx']);
    const [download] = await collectDownloads(page, 1, () => runButton(page, 'Convert').click());
    expect(download!.suggestedFilename()).toBe('letter-a.pdf');
    expect(await pdfPageCount(download!)).toBeGreaterThanOrEqual(1);
    await expect(successStatus(page)).toBeVisible();
  });

  test('/split-pdf writes one file per page', async ({ page }) => {
    await page.goto('/split-pdf');
    await addFiles(page, ['multi-4.pdf']);
    const downloads = await collectDownloads(page, 4, () => runButton(page, 'Split').click());
    expect(downloads).toHaveLength(4);
    for (const d of downloads) expect(await pdfPageCount(d)).toBe(1);
    await expect(successStatus(page)).toContainText(/Split into 4/);
  });

  test('/extract-pages keeps only requested pages', async ({ page }) => {
    await page.goto('/extract-pages');
    await addFiles(page, ['multi-4.pdf']);
    await page.getByPlaceholder('e.g. 1-3,5').fill('1,3');
    const [download] = await collectDownloads(page, 1, () => runButton(page, 'Extract').click());
    expect(await pdfPageCount(download!)).toBe(2);
    await expect(successStatus(page)).toBeVisible();
  });

  test('/extract-pages rejects an out-of-range page spec', async ({ page }) => {
    await page.goto('/extract-pages');
    await addFiles(page, ['multi-4.pdf']);
    await page.getByPlaceholder('e.g. 1-3,5').fill('9');
    await runButton(page, 'Extract').click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(runButton(page, 'Try again')).toBeVisible();
  });

  test('/delete-pages removes requested pages', async ({ page }) => {
    await page.goto('/delete-pages');
    await addFiles(page, ['multi-4.pdf']);
    await page.getByPlaceholder('e.g. 1-3,5').fill('2');
    const [download] = await collectDownloads(page, 1, () =>
      runButton(page, 'Delete pages').click(),
    );
    expect(await pdfPageCount(download!)).toBe(3);
    await expect(successStatus(page)).toContainText(/Deleted pages 2/);
  });

  test('/rotate-pdf rotates selected pages by the chosen angle', async ({ page }) => {
    await page.goto('/rotate-pdf');
    await addFiles(page, ['multi-4.pdf']);
    await page.getByPlaceholder('blank = all pages').fill('1');
    await page.locator('select').filter({ has: page.locator('option', { hasText: '180°' }) }).selectOption('180');
    const [download] = await collectDownloads(page, 1, () => runButton(page, 'Rotate').click());
    expect(await pdfRotations(download!)).toEqual([180, 0, 0, 0]);
    await expect(successStatus(page)).toBeVisible();
  });

  test('/rotate-pdf with blank pages rotates every page', async ({ page }) => {
    await page.goto('/rotate-pdf');
    await addFiles(page, ['multi-4.pdf']);
    const [download] = await collectDownloads(page, 1, () => runButton(page, 'Rotate').click());
    expect(await pdfRotations(download!)).toEqual([90, 90, 90, 90]);
  });

  test('/reorder-pages applies a new page order', async ({ page }) => {
    await page.goto('/reorder-pages');
    await addFiles(page, ['multi-4.pdf']);
    await page.getByPlaceholder('e.g. 3,1,2').fill('4,3,2,1');
    const [download] = await collectDownloads(page, 1, () => runButton(page, 'Reorder').click());
    expect(await pdfPageCount(download!)).toBe(4);
    await expect(successStatus(page)).toContainText(/4, 3, 2, 1/);
  });

  for (const mode of ['balanced', 'maximum'] as const) {
    test(`/compress-pdf ${mode} mode produces a valid PDF`, async ({ page }) => {
      const tracker = trackPageErrors(page);
      await page.goto('/compress-pdf');
      await addFiles(page, ['scan.pdf']);
      await page.locator('select').filter({ has: page.locator('option[value="maximum"]') }).selectOption(mode);
      await page.locator('select').filter({ has: page.locator('option[value="low"]') }).selectOption('low');
      const [download] = await collectDownloads(page, 1, () => runButton(page, 'Compress').click());
      expect(await pdfPageCount(download!)).toBe(1);
      const original = (await readFile(fixture('scan.pdf'))).byteLength;
      const output = (await readFile(await download!.path())).byteLength;
      expect(output).toBeLessThanOrEqual(original);
      await expect(successStatus(page)).toBeVisible();
      tracker.expectNone();
    });
  }

  test('/pdf-tools offers only PDF operations', async ({ page }) => {
    await page.goto('/pdf-tools');
    const select = page.locator('select').filter({ has: page.locator('option[value="split"]') });
    await expect(select).toBeVisible();
    const values = await select
      .locator('option')
      .evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value));
    expect(values).not.toContain('convertToPdf');
    expect(values).toEqual(expect.arrayContaining(['merge', 'compress', 'split', 'extract', 'delete', 'rotate', 'reorder']));
  });

  test('corrupt PDF surfaces an error with details', async ({ page }) => {
    await page.goto('/split-pdf');
    await addFiles(page, ['broken.pdf']);
    await runButton(page, 'Split').click();
    const alert = page.getByRole('alert').first();
    await expect(alert).toBeVisible();
    await alert.getByText('View details').click();
    await expect(alert.getByText(/Category:/)).toBeVisible();
    await expect(runButton(page, 'Try again')).toBeVisible();
  });
});

test.describe('native File System Access path', () => {
  test('merge saves through showSaveFilePicker when available', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      const saved: { name: string; size: number }[] = [];
      w.__saved = saved;
      w.showSaveFilePicker = async (opts: { suggestedName: string }) => ({
        name: opts.suggestedName,
        async createWritable() {
          let size = 0;
          return {
            async write(data: ArrayBuffer) {
              size += data.byteLength;
            },
            async close() {
              saved.push({ name: opts.suggestedName, size });
            },
            async abort() {},
          };
        },
      });
    });
    await page.goto('/merge-pdf');
    await addFiles(page, ['alpha.pdf', 'bravo.pdf']);
    await runButton(page, 'Merge').click();
    await expect(successStatus(page)).toBeVisible();
    const saved = await page.evaluate(() => (window as unknown as { __saved: { name: string; size: number }[] }).__saved);
    expect(saved).toHaveLength(1);
    expect(saved[0]!.name).toMatch(/\.pdf$/);
    expect(saved[0]!.size).toBeGreaterThan(500);
  });

  test('cancelling the native save dialog is reported as cancelled, not an error', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).showSaveFilePicker = async () => {
        throw new DOMException('User cancelled', 'AbortError');
      };
    });
    await page.goto('/merge-pdf');
    await addFiles(page, ['alpha.pdf', 'bravo.pdf']);
    await runButton(page, 'Merge').click();
    await expect(page.getByRole('status').filter({ hasText: /cancel/i }).first()).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(runButton(page, 'Run again')).toBeVisible();
  });
});
