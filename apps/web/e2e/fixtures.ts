import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import { expect, type Download, type Page } from '@playwright/test';

export const FIXTURE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.fixtures');

export const fixture = (name: string) => path.join(FIXTURE_DIR, name);

/**
 * Force the portable code paths (hidden `<input type=file>` + `<a download>`)
 * so Playwright can drive file choosers and capture downloads deterministically.
 */
export async function useFallbackFilePickers(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    delete w.showOpenFilePicker;
    delete w.showSaveFilePicker;
    delete w.showDirectoryPicker;
  });
}

export async function addFiles(page: Page, names: string[]) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Select files', exact: true }).click();
  await (await chooser).setFiles(names.map(fixture));
}

export async function pdfPageCount(download: Download): Promise<number> {
  const filePath = await download.path();
  const bytes = await readFile(filePath);
  const doc = await PDFDocument.load(bytes);
  return doc.getPageCount();
}

export async function pdfRotations(download: Download): Promise<number[]> {
  const bytes = await readFile(await download.path());
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((p) => p.getRotation().angle);
}

/**
 * Headless Chromium has no PDF viewer, so the preview `<iframe src=blob:…>`
 * surfaces as a download named after the blob UUID. Only count downloads the
 * app triggered via `<a download="name">`.
 */
const isPreviewDownload = (d: Download) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.\w+)?$/i.test(d.suggestedFilename());

export async function collectDownloads(page: Page, count: number, trigger: () => Promise<void>) {
  const downloads: Download[] = [];
  const done = new Promise<void>((resolve) => {
    const onDownload = (d: Download) => {
      if (isPreviewDownload(d)) return;
      downloads.push(d);
      if (downloads.length >= count) {
        page.off('download', onDownload);
        resolve();
      }
    };
    page.on('download', onDownload);
  });
  await trigger();
  await done;
  return downloads;
}

export function fileRows(page: Page) {
  return page.locator('li').filter({
    has: page.getByRole('button', { name: /^Select .+ for preview$/ }),
  });
}

export function successStatus(page: Page) {
  return page.getByRole('status').filter({ hasText: '✓' });
}

export function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  return {
    errors,
    expectNone() {
      expect(errors, errors.join('\n')).toEqual([]);
    },
  };
}
