import { expect, test, type Page } from '@playwright/test';

const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 375, height: 812 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

interface LogoBox {
  where: 'header' | 'footer';
  width: number;
  height: number;
  aspect: number;
  naturalAspect: number;
  overflowRight: number;
  overlapsSibling: boolean;
  src: string;
}

async function measureLogos(page: Page): Promise<LogoBox[]> {
  // Footer lockup is loading="lazy"; bring it into view so it actually loads.
  await page.locator('footer .brand-logo').scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [...document.querySelectorAll<HTMLImageElement>('.brand-logo img')]
      .filter((img) => getComputedStyle(img).display !== 'none')
      .every((img) => img.complete && img.naturalWidth > 0),
  );
  return page.evaluate(() => {
    const intersects = (a: DOMRect, b: DOMRect) =>
      a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;

    return [...document.querySelectorAll<HTMLElement>('.brand-logo')].map((logo) => {
      const img = [...logo.querySelectorAll('img')].find(
        (x) => getComputedStyle(x).display !== 'none',
      )!;
      const r = img.getBoundingClientRect();
      const inFooter = Boolean(logo.closest('footer'));
      const cell = logo.closest<HTMLElement>(inFooter ? 'footer .grid > div' : '.site-header-bar > div')!;
      const c = cell.getBoundingClientRect();
      const siblings = inFooter
        ? [...cell.parentElement!.children].filter((el) => el !== cell)
        : [...cell.parentElement!.children].filter(
            (el) => el !== cell && getComputedStyle(el).display !== 'none',
          );
      return {
        where: inFooter ? 'footer' : 'header',
        width: r.width,
        height: r.height,
        aspect: r.width / r.height,
        naturalAspect: img.naturalWidth / img.naturalHeight,
        overflowRight: r.right - c.right,
        overlapsSibling: siblings.some((s) => intersects(r, s.getBoundingClientRect())),
        src: img.currentSrc.split('/').pop() ?? '',
      } satisfies LogoBox;
    });
  });
}

test.describe('brand logo layout', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const vp of VIEWPORTS) {
      test(`${theme} @ ${vp.width}x${vp.height}: logos keep aspect ratio and never overlap`, async ({
        page,
      }) => {
        await page.addInitScript((t) => localStorage.setItem('localdocu-theme', t), theme);
        await page.setViewportSize(vp);
        await page.goto('/');

        const logos = await measureLogos(page);
        expect(logos).toHaveLength(2);
        for (const logo of logos) {
          expect(logo.src, `${logo.where} uses ${theme} asset`).toContain(
            theme === 'dark' ? 'on-dark' : 'on-light',
          );
          expect(Math.abs(logo.aspect - logo.naturalAspect), `${logo.where} aspect`).toBeLessThan(0.05);
          expect(logo.overflowRight, `${logo.where} overflows its column`).toBeLessThanOrEqual(0.5);
          expect(logo.overlapsSibling, `${logo.where} overlaps neighbour`).toBe(false);
          expect(logo.width, `${logo.where} too small`).toBeGreaterThanOrEqual(120);
        }

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  }

  test('header logo links home from a tool page', async ({ page }) => {
    await page.goto('/merge-pdf');
    await page.locator('.site-header-bar').getByRole('link', { name: 'LocalDocu', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('footer logo links home', async ({ page }) => {
    await page.goto('/faq');
    await page.locator('footer').getByRole('link', { name: 'LocalDocu', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('theme toggle', () => {
  test('light / dark / system switch html class, persist, and swap logos', async ({ page }, info) => {
    await page.goto('/');
    const scope = await openNavScope(page, info.project.name);
    const html = page.locator('html');

    await scope.getByRole('radio', { name: 'Use dark appearance' }).click();
    await expect(html).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem('localdocu-theme'))).toBe('dark');
    await expect(page.locator('.site-header .brand-logo-on-dark')).toBeVisible();

    await page.reload();
    await expect(html).toHaveClass(/dark/);

    const scope2 = await openNavScope(page, info.project.name);
    await scope2.getByRole('radio', { name: 'Use light appearance' }).click();
    await expect(html).not.toHaveClass(/dark/);
    await expect(page.locator('.site-header .brand-logo-on-light')).toBeVisible();

    await scope2.getByRole('radio', { name: 'Match system appearance' }).click();
    await expect(scope2.getByRole('radio', { name: 'Match system appearance' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(await page.evaluate(() => localStorage.getItem('localdocu-theme'))).toBe('system');
  });
});

test.describe('language switcher', () => {
  test('switching language changes URL, html lang and persists choice', async ({ page }, info) => {
    await page.goto('/merge-pdf');
    const scope = await openNavScope(page, info.project.name);
    await scope.locator('select').first().selectOption('es');
    await expect(page).toHaveURL(/\/es\/merge-pdf$/);
    await expect(page.locator('html')).toHaveAttribute('lang', /^es/);
    expect(await page.evaluate(() => localStorage.getItem('localdocu-locale-chosen'))).toBe('es');

    const scope2 = await openNavScope(page, info.project.name);
    await scope2.locator('select').first().selectOption('en');
    await expect(page).toHaveURL(/\/merge-pdf$/);
    await expect(page).not.toHaveURL(/\/es\//);
    await expect(page.locator('html')).toHaveAttribute('lang', /^en/);
  });
});

test.describe('header navigation', () => {
  test('desktop links / mobile menu links navigate', async ({ page }, info) => {
    await page.goto('/');
    const scope = await openNavScope(page, info.project.name);
    await scope.getByRole('link', { name: 'FAQ', exact: true }).click();
    await expect(page).toHaveURL(/\/faq$/);
    await expect(page.locator('h1').first()).toBeVisible();

    const scope2 = await openNavScope(page, info.project.name);
    await scope2.getByRole('link', { name: 'Privacy', exact: true }).click();
    await expect(page).toHaveURL(/\/privacy$/);

    const scope3 = await openNavScope(page, info.project.name);
    await expect(scope3.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
      'href',
      /github\.com/,
    );
  });

  test('skip link moves focus to main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });
});

test.describe('mobile menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('opens, closes via button, Escape, backdrop and link click', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Open menu' });
    await expect(toggle).toBeVisible();
    const menu = page.getByRole('navigation', { name: 'Menu' });

    await toggle.click();
    await expect(page.getByRole('button', { name: 'Close menu' }).first()).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(menu).toBeVisible();

    await page.getByRole('button', { name: 'Close menu' }).first().click();
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.mouse.click(10, 800);
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');

    await page.getByRole('button', { name: 'Open menu' }).click();
    await menu.getByRole('link', { name: 'How it works' }).click();
    await expect(page).toHaveURL(/\/how-it-works$/);
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('every internal mobile-menu link resolves', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const hrefs = await page
      .getByRole('navigation', { name: 'Menu' })
      .locator('a[href^="/"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href')!));
    expect(hrefs.length).toBeGreaterThanOrEqual(8);
    for (const href of hrefs) {
      await page.goto(href);
      await expect(page.locator('h1').first(), href).toBeVisible();
    }
  });
});

/** Structural selectors so this keeps working after the UI language changes. */
async function openNavScope(page: Page, project: string) {
  if (project.startsWith('mobile')) {
    const toggle = page.locator('.site-header-menu-btn');
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
    return page.locator('.site-header-menu-panel');
  }
  return page.locator('.site-header-bar nav');
}
