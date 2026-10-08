import { expect, test } from '@playwright/test';
import { trackPageErrors } from './fixtures';

const ROUTES = [
  '/',
  '/merge-pdf',
  '/merge-docx',
  '/compress-pdf',
  '/pdf-tools',
  '/docx-to-pdf',
  '/split-pdf',
  '/extract-pages',
  '/delete-pages',
  '/rotate-pdf',
  '/reorder-pages',
  '/offline',
  '/privacy',
  '/how-it-works',
  '/browser-support',
  '/open-source',
  '/contribute',
  '/roadmap',
  '/desktop',
  '/local-ai',
  '/faq',
  '/guides',
  '/guides/merge-pdf-without-uploading',
  '/guides/compress-pdf-offline',
  '/guides/is-it-safe-to-upload-pdfs-online',
  '/guides/edit-pdf-on-phone-without-app',
  '/ilovepdf-alternative',
  '/smallpdf-alternative',
  '/adobe-acrobat-alternative',
];

const LOCALES = ['hi', 'es', 'pt', 'de', 'fr', 'ja', 'zh'];

test.describe('every route renders', () => {
  for (const route of ROUTES) {
    test(`GET ${route}`, async ({ page }) => {
      const tracker = trackPageErrors(page);
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page).toHaveTitle(/LocalDocu/);
      await expect(page.locator('footer')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, 'page should not scroll horizontally').toBeLessThanOrEqual(0);
      tracker.expectNone();
    });
  }

  for (const locale of LOCALES) {
    test(`GET /${locale}/ and /${locale}/merge-pdf`, async ({ page }) => {
      const tracker = trackPageErrors(page);
      // Without a saved choice the app (by design) redirects to the browser language.
      await page.addInitScript((l) => localStorage.setItem('localdocu-locale-chosen', l), locale);
      await page.goto(`/${locale}/`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/?$`));
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${locale}`));
      await page.goto(`/${locale}/merge-pdf`);
      await expect(page.locator('h1').first()).toBeVisible();
      tracker.expectNone();
    });
  }

  test('unknown route shows not-found page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /home|LocalDocu/i }).first()).toBeVisible();
  });

  test('/en prefix redirects to unprefixed path', async ({ page }) => {
    await page.goto('/en/merge-pdf');
    await expect(page).toHaveURL(/\/merge-pdf$/);
  });

  test('prefixed URL redirects to the browser language when no choice is saved', async ({ page }) => {
    await page.goto('/de/merge-pdf');
    await expect(page).toHaveURL(/localhost:\d+\/merge-pdf$/);
    await expect(page.locator('html')).toHaveAttribute('lang', /^en/);
  });
});

test.describe('footer links all resolve', () => {
  test('every internal footer link navigates to a rendered page', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/');
    const hrefs = await page
      .locator('footer a[href^="/"]')
      .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('href')!))]);
    expect(hrefs.length).toBeGreaterThan(15);
    for (const href of hrefs) {
      const tracker = trackPageErrors(page);
      await page.goto(href);
      await expect(page.locator('h1').first(), href).toBeVisible();
      await expect(page.getByText(/page not found|404/i)).toHaveCount(0);
      tracker.expectNone();
    }
  });

  test('external footer links open in a new tab safely', async ({ page }) => {
    await page.goto('/');
    const external = page.locator('footer a[href^="http"]');
    const count = await external.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(external.nth(i)).toHaveAttribute('target', '_blank');
      await expect(external.nth(i)).toHaveAttribute('rel', /noopener/);
    }
  });
});

test.describe('home tiles', () => {
  test('every tool tile opens its tool page', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page
      .getByRole('region', { name: 'Every tool you need, running on your device' })
      .locator('a[href^="/"]')
      .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('href')!))]);
    expect(hrefs.length).toBeGreaterThanOrEqual(9);
    for (const href of hrefs) {
      await page.goto(href);
      await expect(page.locator('h1').first(), href).toBeVisible();
    }
  });

  test('category filter buttons toggle pressed state and filter tiles', async ({ page }) => {
    await page.goto('/');
    const region = page.getByRole('region', { name: 'Every tool you need, running on your device' });
    const all = region.getByRole('button', { name: 'All', exact: true });
    const allCount = await region.getByRole('listitem').count();
    for (const name of ['Organize', 'Optimize', 'Convert', 'AI']) {
      const btn = region.getByRole('button', { name, exact: true });
      await btn.click();
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
      await expect(all).toHaveAttribute('aria-pressed', 'false');
      const visible = await region.getByRole('listitem').count();
      expect(visible, `${name} filter`).toBeGreaterThan(0);
      expect(visible, `${name} filter`).toBeLessThan(allCount);
    }
    await all.click();
    await expect(all).toHaveAttribute('aria-pressed', 'true');
    await expect(region.getByRole('listitem')).toHaveCount(allCount);
  });
});

test.describe('FAQ accordions', () => {
  test('home FAQ items expand and collapse', async ({ page }) => {
    await page.goto('/');
    const faq = page.getByRole('region', { name: 'Frequently asked questions' });
    const items = faq.locator('details');
    const n = await items.count();
    expect(n).toBeGreaterThan(5);
    for (let i = 0; i < n; i++) {
      const item = items.nth(i);
      await item.locator('summary').click();
      await expect(item).toHaveAttribute('open', '');
      await item.locator('summary').click();
      await expect(item).not.toHaveAttribute('open', '');
    }
  });
});
