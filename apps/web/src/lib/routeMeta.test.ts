import { describe, expect, it } from 'vitest';
import { ROUTE_META, getRouteMeta } from './routeMeta';
import { PUBLIC_PAGE_BLOCKS } from './publicPages';
import { FAQ_ITEMS } from './seoContent';
import { SITE_PATHS } from './siteConfig';

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

  it('ships twelve FAQ items', () => {
    expect(FAQ_ITEMS).toHaveLength(12);
  });
});
