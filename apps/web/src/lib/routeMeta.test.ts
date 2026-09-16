import { describe, expect, it } from 'vitest';
import { ROUTE_META, getRouteMeta, sitemapEntries } from './routeMeta';
import { PUBLIC_PAGE_BLOCKS } from './publicPages';
import { FAQ_ITEMS } from './seoContent';
import { SITE_PATHS } from './siteConfig';
import { getEnglishCatalog, translate, flattenCatalog } from '../i18n';

describe('route metadata', () => {
  it('has unique titles and descriptions per route', () => {
    const metas = Object.values(ROUTE_META);
    const titles = metas.map((m) => m.title);
    const descriptions = metas.map((m) => m.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('covers every public site path', () => {
    for (const path of Object.values(SITE_PATHS)) {
      expect(ROUTE_META[path]?.path).toBe(path);
      expect(getRouteMeta(path).title.length).toBeGreaterThan(8);
    }
  });

  it('defines content blocks for every info page', () => {
    expect(Object.keys(PUBLIC_PAGE_BLOCKS).sort()).toEqual(
      [
        'browser-support',
        'compress-pdf',
        'contribute',
        'desktop',
        'docx-to-pdf',
        'faq',
        'how-it-works',
        'local-ai',
        'merge-docx',
        'merge-pdf',
        'offline',
        'open-source',
        'pdf-tools',
        'privacy',
        'roadmap',
      ].sort(),
    );
  });

  it('ships thirteen FAQ items', () => {
    expect(FAQ_ITEMS).toHaveLength(13);
  });

  it('resolves localized titles via translator with English fallback', () => {
    const en = flattenCatalog(getEnglishCatalog());
    const partial = {
      seo: {
        mergePdf: {
          title: 'Combinar PDF localmente | LocalDocu',
          h1: 'Combinar PDF',
          breadcrumb: 'Combinar PDF',
        },
      },
    };
    const t = (key: string) => translate(partial as never, en, key);
    const meta = getRouteMeta('/merge-pdf', 'es', t);
    expect(meta.title).toBe('Combinar PDF localmente | LocalDocu');
    expect(meta.h1).toBe('Combinar PDF');
    // description missing in partial → English fallback
    expect(meta.description).toBe(getRouteMeta('/merge-pdf').description);
  });

  it('strips locale prefix when looking up meta', () => {
    expect(getRouteMeta('/es/privacy').path).toBe('/privacy');
  });

  it('includes every locale in sitemap entries', () => {
    const entries = sitemapEntries();
    const locs = entries.map((e) => e.loc);
    expect(locs.some((l) => l.endsWith('/merge-pdf'))).toBe(true);
    expect(locs.some((l) => l.includes('/es/merge-pdf'))).toBe(true);
    expect(locs.some((l) => l.includes('/hi/faq'))).toBe(true);
    expect(locs.some((l) => l.includes('/zh/privacy'))).toBe(true);
    // 16 routes × 8 locales
    expect(entries.length).toBe(Object.keys(ROUTE_META).length * 8);
  });

  it('clusters locales with hreflang including English x-default', () => {
    const home = sitemapEntries().find((e) => /localdocu\.org\/$/.test(e.loc));
    expect(home?.alternates.some((a) => a.hreflang === 'en' && /localdocu\.org\/$/.test(a.href))).toBe(
      true,
    );
    expect(home?.alternates.some((a) => a.hreflang === 'de' && a.href.includes('/de'))).toBe(true);
    expect(
      home?.alternates.some((a) => a.hreflang === 'x-default' && /localdocu\.org\/$/.test(a.href)),
    ).toBe(true);
  });
});
