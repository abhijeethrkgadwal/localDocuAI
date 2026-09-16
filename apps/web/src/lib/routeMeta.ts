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
import { absoluteUrl, SITE_PATHS } from './siteConfig';

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  /** Page H1 for public/info pages (homepage uses brand + tagline). */
  h1?: string;
  ogType?: 'website' | 'article';
  /** Include FAQPage JSON-LD when FAQ content is the primary subject. */
  faqJsonLd?: boolean;
  /** Include SoftwareApplication JSON-LD only when the page describes the product. */
  softwareJsonLd?: boolean;
  /** Breadcrumb trail after Home (label + path). Paths are English (unprefixed). */
  breadcrumbs?: { name: string; path: string }[];
  changefreq?: 'weekly' | 'monthly';
  priority?: string;
}

/** Structural flags + SEO key mapping (strings live in seo.* catalogs). */
const ROUTE_DEFS: Record<
  string,
  {
    seoKey: string;
    faqJsonLd?: boolean;
    softwareJsonLd?: boolean;
    breadcrumb?: boolean;
    changefreq?: 'weekly' | 'monthly';
    priority?: string;
  }
> = {
  [SITE_PATHS.home]: {
    seoKey: 'home',
    softwareJsonLd: true,
    faqJsonLd: true,
    changefreq: 'weekly',
    priority: '1.0',
  },
  [SITE_PATHS.mergePdf]: {
    seoKey: 'mergePdf',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.9',
  },
  [SITE_PATHS.mergeDocx]: {
    seoKey: 'mergeDocx',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.85',
  },
  [SITE_PATHS.compressPdf]: {
    seoKey: 'compressPdf',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.9',
  },
  [SITE_PATHS.pdfTools]: {
    seoKey: 'pdfTools',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.9',
  },
  [SITE_PATHS.docxToPdf]: {
    seoKey: 'docxToPdf',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.85',
  },
  [SITE_PATHS.offline]: {
    seoKey: 'offline',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.8',
  },
  [SITE_PATHS.privacy]: {
    seoKey: 'privacy',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.9',
  },
  [SITE_PATHS.howItWorks]: {
    seoKey: 'howItWorks',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.85',
  },
  [SITE_PATHS.browserSupport]: {
    seoKey: 'browserSupport',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.85',
  },
  [SITE_PATHS.openSource]: {
    seoKey: 'openSource',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.8',
  },
  [SITE_PATHS.contribute]: {
    seoKey: 'contribute',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.8',
  },
  [SITE_PATHS.roadmap]: {
    seoKey: 'roadmap',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.8',
  },
  [SITE_PATHS.desktop]: {
    seoKey: 'desktop',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.7',
  },
  [SITE_PATHS.localAi]: {
    seoKey: 'localAi',
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.7',
  },
  [SITE_PATHS.faq]: {
    seoKey: 'faq',
    faqJsonLd: true,
    breadcrumb: true,
    changefreq: 'monthly',
    priority: '0.9',
  },
};

function buildMeta(path: string, def: (typeof ROUTE_DEFS)[string], t: TranslateFn): RouteMeta {
  const base = `seo.${def.seoKey}`;
  const h1 = t(`${base}.h1`);
  const breadcrumb = t(`${base}.breadcrumb`);
  return {
    path,
    title: t(`${base}.title`),
    description: t(`${base}.description`),
    ...(h1 !== `${base}.h1` ? { h1 } : {}),
    faqJsonLd: def.faqJsonLd,
    softwareJsonLd: def.softwareJsonLd,
    breadcrumbs: def.breadcrumb
      ? [{ name: breadcrumb !== `${base}.breadcrumb` ? breadcrumb : t(`${base}.title`), path }]
      : undefined,
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

  setMeta('meta[name="description"]', 'content', meta.description);
  setMeta('link[rel="canonical"]', 'href', canonical);
  setMeta('meta[property="og:url"]', 'content', canonical);
  setMeta('meta[property="og:title"]', 'content', meta.title);
  setMeta('meta[property="og:description"]', 'content', meta.description);
  setMeta('meta[property="og:type"]', 'content', meta.ogType ?? 'website');
  setMeta('meta[name="twitter:title"]', 'content', meta.title);
  setMeta('meta[name="twitter:description"]', 'content', meta.description);
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

export function hreflangAlternates(barePath: string): { hreflang: string; href: string }[] {
  const normalized = barePath === '/' ? '/' : stripLocale(barePath);
  return [
    ...LOCALE_CODES.map((code) => ({
      hreflang: LOCALES[code].bcp47,
      href: absoluteUrl(withLocale(normalized, code)),
    })),
    { hreflang: 'x-default', href: absoluteUrl(normalized) },
  ];
}

export function sitemapEntries(): {
  loc: string;
  priority: string;
  changefreq: string;
  alternates: { hreflang: string; href: string }[];
}[] {
  const entries: {
    loc: string;
    priority: string;
    changefreq: string;
    alternates: { hreflang: string; href: string }[];
  }[] = [];
  for (const m of Object.values(ROUTE_META)) {
    const alternates = hreflangAlternates(m.path);
    for (const code of LOCALE_CODES) {
      const path = withLocale(m.path, code);
      entries.push({
        loc: absoluteUrl(path),
        priority: m.priority ?? '0.7',
        changefreq: m.changefreq ?? 'monthly',
        alternates,
      });
    }
  }
  return entries;
}
