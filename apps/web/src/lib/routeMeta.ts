import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_CODES,
  getEnglishCatalog,
  getT,
  stripLocale,
  withLocale,
  type LocaleCode,
  type TranslateFn,
} from '../i18n';
import { COMPARE_PAGES, GUIDE_PAGES } from './contentPages';
import type { PublicPageId } from './publicPages';
import { absoluteUrl, SITE_PATHS } from './siteConfig';

/** Drives JSON-LD, breadcrumbs, OG image and prerendered layout. */
export type PageKind = 'home' | 'tool' | 'info' | 'faq' | 'hub' | 'guide' | 'compare';

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  /** Page H1 for public/info pages (homepage uses brand + tagline). */
  h1?: string;
  kind: PageKind;
  pageId?: PublicPageId;
  ogType?: 'website' | 'article';
  /** Site-relative OG image path (PNG, 1200×630). */
  ogImage: string;
  /** ISO date the page content was last meaningfully updated. */
  updated: string;
  noindex?: boolean;
  /** Include FAQPage JSON-LD when FAQ content is the primary subject. */
  faqJsonLd?: boolean;
  /** Include SoftwareApplication JSON-LD only when the page describes the product. */
  softwareJsonLd?: boolean;
  /** Breadcrumb trail after Home (label + path). Paths are English (unprefixed). */
  breadcrumbs?: { name: string; path: string }[];
  changefreq?: 'weekly' | 'monthly';
  priority?: string;
}

interface RouteDef {
  seoKey: string;
  kind: PageKind;
  pageId?: PublicPageId;
  faqJsonLd?: boolean;
  softwareJsonLd?: boolean;
  changefreq?: 'weekly' | 'monthly';
  priority?: string;
  updated?: string;
}

/** Bump when site-wide copy changes; per-route `updated` overrides. */
export const SITE_CONTENT_UPDATED = '2026-10-07';

export const DEFAULT_OG_IMAGE = '/og/default.png';

function tool(seoKey: string, pageId: PublicPageId, priority: string): RouteDef {
  return { seoKey, kind: 'tool', pageId, changefreq: 'monthly', priority };
}

function info(seoKey: string, pageId: PublicPageId, priority: string): RouteDef {
  return { seoKey, kind: 'info', pageId, changefreq: 'monthly', priority };
}

/** Structural flags + SEO key mapping (strings live in seo.* catalogs). */
const ROUTE_DEFS: Record<string, RouteDef> = {
  [SITE_PATHS.home]: {
    seoKey: 'home',
    kind: 'home',
    softwareJsonLd: true,
    faqJsonLd: true,
    changefreq: 'weekly',
    priority: '1.0',
  },
  [SITE_PATHS.mergePdf]: tool('mergePdf', 'merge-pdf', '0.9'),
  [SITE_PATHS.compressPdf]: tool('compressPdf', 'compress-pdf', '0.9'),
  [SITE_PATHS.splitPdf]: tool('splitPdf', 'split-pdf', '0.9'),
  [SITE_PATHS.docxToPdf]: tool('docxToPdf', 'docx-to-pdf', '0.85'),
  [SITE_PATHS.mergeDocx]: tool('mergeDocx', 'merge-docx', '0.85'),
  [SITE_PATHS.extractPages]: tool('extractPages', 'extract-pages', '0.85'),
  [SITE_PATHS.deletePages]: tool('deletePages', 'delete-pages', '0.85'),
  [SITE_PATHS.rotatePdf]: tool('rotatePdf', 'rotate-pdf', '0.85'),
  [SITE_PATHS.reorderPages]: tool('reorderPages', 'reorder-pages', '0.85'),
  [SITE_PATHS.pdfTools]: tool('pdfTools', 'pdf-tools', '0.9'),
  [SITE_PATHS.privacy]: info('privacy', 'privacy', '0.9'),
  [SITE_PATHS.howItWorks]: info('howItWorks', 'how-it-works', '0.85'),
  [SITE_PATHS.browserSupport]: info('browserSupport', 'browser-support', '0.85'),
  [SITE_PATHS.offline]: info('offline', 'offline', '0.8'),
  [SITE_PATHS.openSource]: info('openSource', 'open-source', '0.8'),
  [SITE_PATHS.contribute]: info('contribute', 'contribute', '0.7'),
  [SITE_PATHS.roadmap]: info('roadmap', 'roadmap', '0.7'),
  [SITE_PATHS.desktop]: info('desktop', 'desktop', '0.6'),
  [SITE_PATHS.localAi]: info('localAi', 'local-ai', '0.6'),
  [SITE_PATHS.faq]: {
    seoKey: 'faq',
    kind: 'faq',
    pageId: 'faq',
    faqJsonLd: true,
    changefreq: 'monthly',
    priority: '0.9',
  },
  [SITE_PATHS.guides]: {
    seoKey: 'guides',
    kind: 'hub',
    pageId: 'guides',
    changefreq: 'weekly',
    priority: '0.8',
  },
  ...Object.fromEntries(
    GUIDE_PAGES.map((p) => [
      p.path,
      { seoKey: p.seoKey, kind: 'guide', pageId: p.id, changefreq: 'monthly', priority: '0.8' },
    ]),
  ),
  ...Object.fromEntries(
    COMPARE_PAGES.map((p) => [
      p.path,
      { seoKey: p.seoKey, kind: 'compare', pageId: p.id, changefreq: 'monthly', priority: '0.85' },
    ]),
  ),
};

/** Every prerenderable public path (English, unprefixed). */
export const ROUTE_PATHS = Object.keys(ROUTE_DEFS);

function ogImageFor(path: string, kind: PageKind): string {
  if (kind === 'tool' || kind === 'guide' || kind === 'compare' || kind === 'hub') {
    return `/og/${path.replace(/^\//, '').replace(/\//g, '-')}.png`;
  }
  return DEFAULT_OG_IMAGE;
}

function buildMeta(path: string, def: RouteDef, t: TranslateFn): RouteMeta {
  const base = `seo.${def.seoKey}`;
  const h1 = t(`${base}.h1`);
  const breadcrumb = t(`${base}.breadcrumb`);
  const crumb = { name: breadcrumb !== `${base}.breadcrumb` ? breadcrumb : t(`${base}.title`), path };
  const isArticle = def.kind === 'guide' || def.kind === 'compare';
  const breadcrumbs =
    def.kind === 'home'
      ? undefined
      : isArticle
        ? [{ name: t('seo.guides.breadcrumb'), path: SITE_PATHS.guides }, crumb]
        : [crumb];
  return {
    path,
    title: t(`${base}.title`),
    description: t(`${base}.description`),
    ...(h1 !== `${base}.h1` ? { h1 } : {}),
    kind: def.kind,
    pageId: def.pageId,
    ogType: isArticle ? 'article' : 'website',
    ogImage: ogImageFor(path, def.kind),
    updated: def.updated ?? SITE_CONTENT_UPDATED,
    faqJsonLd: def.faqJsonLd,
    softwareJsonLd: def.softwareJsonLd,
    breadcrumbs,
    changefreq: def.changefreq,
    priority: def.priority,
  };
}

/** English route meta snapshot (build-time SEO plugin + tests). */
export const ROUTE_META: Record<string, RouteMeta> = (() => {
  const en = getEnglishCatalog();
  const t: TranslateFn = (key) => {
    const parts = key.split('.');
    let node: unknown = { seo: en.seo };
    for (const part of parts) {
      if (node == null || typeof node !== 'object') return key;
      node = (node as Record<string, unknown>)[part];
    }
    return typeof node === 'string' ? node : key;
  };
  const out: Record<string, RouteMeta> = {};
  for (const [path, def] of Object.entries(ROUTE_DEFS)) {
    out[path] = buildMeta(path, def, t);
  }
  return out;
})();

export function getNotFoundMeta(t: TranslateFn = getT()): RouteMeta {
  return {
    path: '/404',
    title: t('seo.notFound.title'),
    description: t('seo.notFound.description'),
    h1: t('seo.notFound.h1'),
    kind: 'info',
    ogImage: DEFAULT_OG_IMAGE,
    updated: SITE_CONTENT_UPDATED,
    noindex: true,
  };
}

/** @deprecated Prefer getNotFoundMeta(t) — kept for tests importing the constant shape. */
export const NOT_FOUND_META: RouteMeta = getNotFoundMeta((key) => {
  const en = getEnglishCatalog();
  const parts = key.split('.');
  let node: unknown = { seo: en.seo };
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return key;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : key;
});

export function getRouteMeta(pathname: string, locale: LocaleCode = DEFAULT_LOCALE, t: TranslateFn = getT()): RouteMeta {
  const bare = stripLocale(pathname);
  const normalized = bare.endsWith('/') && bare !== '/' ? bare.slice(0, -1) : bare;
  if (normalized === '/404') return getNotFoundMeta(t);
  const def = ROUTE_DEFS[normalized];
  if (!def) return getNotFoundMeta(t);
  const meta = buildMeta(normalized, def, t);
  // Ensure home has no h1 from missing key
  if (normalized === SITE_PATHS.home) {
    const { h1: _h1, ...rest } = meta;
    void _h1;
    return rest;
  }
  void locale;
  return meta;
}

function setOrCreateLinkAlternate(hreflang: string, href: string): void {
  const selector = `link[rel="alternate"][hreflang="${hreflang}"]`;
  let el = document.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setMeta(selector: string, attr: string, value: string): void {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function setOrCreateMetaProperty(property: string, content: string): void {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applyDocumentMeta(meta: RouteMeta, locale: LocaleCode = DEFAULT_LOCALE): void {
  const barePath = meta.path === '/404' ? '/' : stripLocale(meta.path);
  const localizedPath = withLocale(barePath, locale);
  const canonical = absoluteUrl(localizedPath === '/' ? '/' : localizedPath);
  document.title = meta.title;

  const info = LOCALES[locale];
  document.documentElement.lang = info.bcp47;
  document.documentElement.dir = info.isRtl ? 'rtl' : 'ltr';

  const ogImage = absoluteUrl(meta.ogImage);
  setMeta('meta[name="description"]', 'content', meta.description);
  setMeta('link[rel="canonical"]', 'href', canonical);
  setMeta(
    'meta[name="robots"]',
    'content',
    meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  );
  setMeta('meta[property="og:url"]', 'content', canonical);
  setMeta('meta[property="og:title"]', 'content', meta.title);
  setMeta('meta[property="og:description"]', 'content', meta.description);
  setMeta('meta[property="og:type"]', 'content', meta.ogType ?? 'website');
  setMeta('meta[property="og:image"]', 'content', ogImage);
  setMeta('meta[name="twitter:title"]', 'content', meta.title);
  setMeta('meta[name="twitter:description"]', 'content', meta.description);
  setMeta('meta[name="twitter:image"]', 'content', ogImage);
  setOrCreateMetaProperty('og:locale', info.ogLocale);

  // Remove previous alternate og:locale tags we may have added
  document.querySelectorAll('meta[property="og:locale:alternate"]').forEach((n) => n.remove());
  for (const code of LOCALE_CODES) {
    if (code === locale) continue;
    const alt = document.createElement('meta');
    alt.setAttribute('property', 'og:locale:alternate');
    alt.setAttribute('content', LOCALES[code].ogLocale);
    document.head.appendChild(alt);
  }

  for (const code of LOCALE_CODES) {
    const href = absoluteUrl(withLocale(barePath, code));
    setOrCreateLinkAlternate(LOCALES[code].bcp47, href);
  }
  setOrCreateLinkAlternate('x-default', absoluteUrl(barePath === '/' ? '/' : barePath));
}

export interface SitemapEntry {
  loc: string;
  lastmod: string;
  priority: string;
  changefreq: string;
  /** hreflang → absolute URL, including x-default. */
  alternates: { hreflang: string; href: string }[];
}

export function hreflangAlternates(
  barePath: string,
  toAbsolute: (path: string) => string = absoluteUrl,
): { hreflang: string; href: string }[] {
  return [
    ...LOCALE_CODES.map((code) => ({
      hreflang: LOCALES[code].bcp47,
      href: toAbsolute(withLocale(barePath, code)),
    })),
    { hreflang: 'x-default', href: toAbsolute(barePath) },
  ];
}

export function sitemapEntries(toAbsolute: (path: string) => string = absoluteUrl): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const m of Object.values(ROUTE_META)) {
    const alternates = hreflangAlternates(m.path, toAbsolute);
    for (const code of LOCALE_CODES) {
      entries.push({
        loc: toAbsolute(withLocale(m.path, code)),
        lastmod: m.updated,
        priority: m.priority ?? '0.7',
        changefreq: m.changefreq ?? 'monthly',
        alternates,
      });
    }
  }
  return entries;
}
