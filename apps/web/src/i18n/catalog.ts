import type { LocaleCode } from './locales';
import type { MessageTree } from './translate';
import enCommon from './locales/en/common.json';
import enWorkspace from './locales/en/workspace.json';
import enPages from './locales/en/pages.json';
import enSeo from './locales/en/seo.json';

export type Namespace = 'common' | 'workspace' | 'pages' | 'seo';

export type Catalog = Record<Namespace, MessageTree>;

const enCatalog: Catalog = {
  common: enCommon as unknown as MessageTree,
  workspace: enWorkspace as unknown as MessageTree,
  pages: enPages as unknown as MessageTree,
  seo: enSeo as unknown as MessageTree,
};

const loaders: Record<Exclude<LocaleCode, 'en'>, () => Promise<Catalog>> = {
  hi: () => loadLocale('hi'),
  es: () => loadLocale('es'),
  pt: () => loadLocale('pt'),
  de: () => loadLocale('de'),
  fr: () => loadLocale('fr'),
  ja: () => loadLocale('ja'),
  zh: () => loadLocale('zh'),
};

async function loadLocale(code: Exclude<LocaleCode, 'en'>): Promise<Catalog> {
  const [common, workspace, pages, seo] = await Promise.all([
    import(`./locales/${code}/common.json`),
    import(`./locales/${code}/workspace.json`),
    import(`./locales/${code}/pages.json`),
    import(`./locales/${code}/seo.json`),
  ]);
  return {
    common: (common.default ?? common) as unknown as MessageTree,
    workspace: (workspace.default ?? workspace) as unknown as MessageTree,
    pages: (pages.default ?? pages) as unknown as MessageTree,
    seo: (seo.default ?? seo) as unknown as MessageTree,
  };
}

const cache = new Map<LocaleCode, Catalog>();
cache.set('en', enCatalog);

export function getEnglishCatalog(): Catalog {
  return enCatalog;
}

export async function loadCatalog(locale: LocaleCode): Promise<Catalog> {
  const hit = cache.get(locale);
  if (hit) return hit;
  if (locale === 'en') return enCatalog;
  const catalog = await loaders[locale]();
  cache.set(locale, catalog);
  return catalog;
}

/** Merge namespace trees into one lookup root: common.*, workspace.*, … */
export function flattenCatalog(catalog: Catalog): MessageTree {
  return {
    common: catalog.common,
    workspace: catalog.workspace,
    pages: catalog.pages,
    seo: catalog.seo,
  };
}
