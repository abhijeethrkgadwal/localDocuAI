/**
 * Build-time static HTML for every public route × locale. Crawlers and AI agents that do not
 * run JavaScript get the full page (head + readable body); the SPA replaces #root on boot.
 * Pure string functions — no DOM, safe to call from the Vite plugin and from tests.
 */
import { LOCALES, LOCALE_CODES, type LocaleCode } from '../i18n/locales';
import { withLocale } from '../i18n/path';
import { flattenCatalog, type Catalog } from '../i18n/catalog';
import { translate, type TranslateFn } from '../i18n/translate';
import { COMPARE_PAGES, GUIDE_PAGES, getHubSections } from './contentPages';
import { buildJsonLd } from './jsonLd';
import { getPublicPageBlocks, type Block } from './publicPages';
import { getRouteMeta, getNotFoundMeta, hreflangAlternates, type RouteMeta } from './routeMeta';
import { getFaqItems, getHowItWorksSteps } from './seoContent';
import { GITHUB_URL, SITE, SITE_PATHS } from './siteConfig';
import { TASK_TILES } from './taskTiles';

export const HEAD_START = '<!--seo:head-->';
export const HEAD_END = '<!--/seo:head-->';
const HEAD_RE = /<!--seo:head-->[\s\S]*?<!--\/seo:head-->/;
const ROOT_RE = /<div id="root"><\/div>/;
const HTML_TAG_RE = /<html[^>]*>/;
const NOSCRIPT_RE = /<noscript>[\s\S]*?<\/noscript>/;

export interface PrerenderOptions {
  siteUrl: string;
  locale: LocaleCode;
  catalog: Catalog;
  english: Catalog;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** JSON for inline <script>: blocks `</script>` and HTML comment breakouts. */
export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function makeTranslator(catalog: Catalog, english: Catalog): TranslateFn {
  const messages = flattenCatalog(catalog);
  const fallback = flattenCatalog(english);
  return (key, vars) => translate(messages, fallback, key, vars);
}

/** `/` → `index.html`, `/merge-pdf` → `merge-pdf.html`, `/es` → `es.html` (Vercel cleanUrls). */
export function outputFileFor(barePath: string, locale: LocaleCode): string {
  const localized = withLocale(barePath, locale);
  if (localized === '/') return 'index.html';
  return `${localized.slice(1)}.html`;
}

function toAbsoluteFactory(siteUrl: string) {
  const origin = siteUrl.replace(/\/$/, '');
  return (path: string) => {
    if (/^https?:\/\//.test(path)) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${normalized}`;
  };
}

const e = escapeHtml;

export function renderHead(meta: RouteMeta, opts: PrerenderOptions, t: TranslateFn): string {
  const { locale, siteUrl, catalog } = opts;
  const abs = toAbsoluteFactory(siteUrl);
  const bare = meta.noindex ? '/' : meta.path;
  const canonical = abs(withLocale(bare, locale));
  const ogImage = abs(meta.ogImage);
  const info = LOCALES[locale];
  const robots = meta.noindex
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const imageAlt = meta.h1 ?? meta.title;

  const lines = [
    `<title>${e(meta.title)}</title>`,
    `<meta name="description" content="${e(meta.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
  ];
  if (!meta.noindex) {
    lines.push(`<link rel="canonical" href="${e(canonical)}" />`);
    for (const alt of hreflangAlternates(bare, abs)) {
      lines.push(`<link rel="alternate" hreflang="${alt.hreflang}" href="${e(alt.href)}" />`);
    }
  }
  lines.push(
    `<meta property="og:type" content="${meta.ogType ?? 'website'}" />`,
    `<meta property="og:site_name" content="${e(SITE.name)}" />`,
    `<meta property="og:locale" content="${info.ogLocale}" />`,
    ...LOCALE_CODES.filter((c) => c !== locale).map(
      (c) => `<meta property="og:locale:alternate" content="${LOCALES[c].ogLocale}" />`,
    ),
    `<meta property="og:url" content="${e(canonical)}" />`,
    `<meta property="og:title" content="${e(meta.title)}" />`,
    `<meta property="og:description" content="${e(meta.description)}" />`,
    `<meta property="og:image" content="${e(ogImage)}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${e(imageAlt)}" />`,
  );
  if (meta.ogType === 'article') {
    lines.push(
      `<meta property="article:modified_time" content="${meta.updated}" />`,
      `<meta property="article:author" content="${e(SITE.creatorName)}" />`,
    );
  }
  lines.push(
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(meta.title)}" />`,
    `<meta name="twitter:description" content="${e(meta.description)}" />`,
    `<meta name="twitter:image" content="${e(ogImage)}" />`,
    `<meta name="twitter:image:alt" content="${e(imageAlt)}" />`,
  );
  const jsonLd = buildJsonLd({ meta, locale, t, pages: catalog.pages, toAbsolute: abs });
  if (jsonLd) {
    lines.push(
      `<script type="application/ld+json" id="ld-json">${safeJsonForScript(jsonLd)}</script>`,
    );
  }
  return lines.map((l) => `    ${l}`).join('\n');
}

const linkClass = 'font-medium text-[var(--accent)] underline-offset-2 hover:underline';
const footLinkClass = 'text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--accent)] hover:underline';

function href(path: string, locale: LocaleCode): string {
  return e(withLocale(path, locale));
}

function renderBlocks(blocks: Block[], locale: LocaleCode): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'p':
          return `<p class="leading-relaxed">${e(block.text)}</p>`;
        case 'h2':
          return `<h2 class="pt-2 text-base font-semibold text-[var(--text-primary)]">${e(block.text)}</h2>`;
        case 'ul':
        case 'ol': {
          const cls = block.type === 'ul' ? 'list-disc' : 'list-decimal';
          const items = block.items.map((i) => `<li>${e(i)}</li>`).join('');
          return `<${block.type} class="${cls} space-y-1.5 pl-5">${items}</${block.type}>`;
        }
        case 'note':
          return `<p class="rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-[var(--text-secondary)]">${e(block.text)}</p>`;
        case 'table': {
          const head = block.headers.map((h) => `<th scope="col" class="px-2 py-2">${e(h)}</th>`).join('');
          const rows = block.rows
            .map(
              (row) =>
                `<tr class="border-b border-[var(--border)] align-top">${row
                  .map((cell, i) =>
                    i === 0
                      ? `<th scope="row" class="px-2 py-2 font-medium">${e(cell)}</th>`
                      : `<td class="px-2 py-2">${e(cell)}</td>`,
                  )
                  .join('')}</tr>`,
            )
            .join('');
          const caption = block.caption ? `<caption class="sr-only">${e(block.caption)}</caption>` : '';
          return `<div class="overflow-x-auto pt-1"><table class="w-full min-w-[36rem] border-collapse text-left text-sm">${caption}<thead><tr class="border-b border-[var(--border)]">${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
        }
        case 'links':
          return `<ul class="flex flex-wrap gap-x-4 gap-y-2 pt-1">${block.items
            .map((item) =>
              item.href
                ? `<li><a class="${linkClass}" href="${e(item.href)}" rel="noopener">${e(item.label)}</a></li>`
                : `<li><a class="${linkClass}" href="${href(item.to!, locale)}">${e(item.label)}</a></li>`,
            )
            .join('')}</ul>`;
        case 'faq':
          return `<div class="space-y-3">${(block.items ?? [])
            .map(
              (item) =>
                `<details id="${e(item.id)}" class="rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3"><summary class="cursor-pointer font-medium text-[var(--text-primary)]">${e(item.question)}</summary><p class="mt-2 text-sm text-[var(--text-secondary)]">${e(item.answer)}</p></details>`,
            )
            .join('')}</div>`;
        default:
          return '';
      }
    })
    .join('\n');
}

function renderHeader(meta: RouteMeta, locale: LocaleCode, t: TranslateFn): string {
  const nav = (<[string, string][]>[
    [SITE_PATHS.pdfTools, t('common.footer.pdfTools')],
    [SITE_PATHS.guides, t('common.footer.guides')],
    [SITE_PATHS.privacy, t('common.nav.privacy')],
    [SITE_PATHS.faq, t('common.nav.faq')],
  ])
    .map(([to, label]) => `<li><a class="${footLinkClass}" href="${href(to, locale)}">${e(label)}</a></li>`)
    .join('');
  const crumbs = meta.breadcrumbs?.length
    ? `<nav aria-label="${e(t('common.breadcrumbs.aria'))}" class="text-sm text-[var(--text-tertiary)]"><ol class="flex flex-wrap gap-2"><li><a class="${footLinkClass}" href="${href('/', locale)}">${e(t('common.breadcrumbs.home'))}</a></li>${meta.breadcrumbs
        .map((c, i, all) =>
          i === all.length - 1
            ? `<li aria-current="page">/ ${e(c.name)}</li>`
            : `<li>/ <a class="${footLinkClass}" href="${href(c.path, locale)}">${e(c.name)}</a></li>`,
        )
        .join('')}</ol></nav>`
    : '';
  return `<header class="space-y-4"><div class="flex flex-wrap items-center justify-between gap-4"><a href="${href('/', locale)}" class="text-lg font-semibold tracking-tight text-[var(--text-primary)]">${e(SITE.name)}</a><nav aria-label="${e(t('common.nav.ariaPrimary'))}"><ul class="flex flex-wrap gap-4 text-sm">${nav}</ul></nav></div>${crumbs}</header>`;
}

function renderHome(locale: LocaleCode, t: TranslateFn, catalog: Catalog): string {
  const tiles = TASK_TILES.map((tile) => {
    const title = e(t(`common.tasks.items.${tile.id}.title`));
    const desc = e(t(`common.tasks.items.${tile.id}.desc`));
    if (tile.status === 'available') {
      return `<li class="flex"><a class="task-tile" href="${href(tile.path, locale)}"><span class="flex flex-col gap-1"><span class="font-semibold text-[var(--text-primary)]">${title}</span><span class="text-[0.8125rem] text-[var(--text-secondary)]">${desc}</span></span></a></li>`;
    }
    return `<li class="flex"><div class="task-tile" data-coming-soon><span class="flex flex-col gap-1"><span class="font-semibold text-[var(--text-primary)]">${title} · ${e(t('common.tasks.comingSoon'))}</span><span class="text-[0.8125rem] text-[var(--text-secondary)]">${desc}</span></span></div></li>`;
  }).join('');
  const steps = getHowItWorksSteps(catalog.pages)
    .map((s) => `<li><strong>${e(s.name)}.</strong> ${e(s.text)}</li>`)
    .join('');
  const faq = renderBlocks([{ type: 'faq', items: getFaqItems(t) }], locale);
  return `<section class="space-y-3 pt-2"><h1 class="text-[2rem] leading-[1.1] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2.75rem]">${e(t('common.site.tagline'))}</h1><p class="text-base text-[var(--text-secondary)]">${e(t('common.site.supportingMessage'))}</p><p class="text-sm text-[var(--text-secondary)]">${e(t('common.site.description'))}</p></section>
<section aria-labelledby="tasks-heading" class="space-y-4"><h2 id="tasks-heading" class="text-xl font-semibold text-[var(--text-primary)]">${e(t('common.tasks.heading'))}</h2><p class="text-sm text-[var(--text-secondary)]">${e(t('common.tasks.subheading'))}</p><ul class="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">${tiles}</ul></section>
<section class="panel prose-public space-y-3"><h2 class="text-base font-semibold text-[var(--text-primary)]">${e(t('pages.discoverability.howItWorksHeading'))}</h2><ol class="list-decimal space-y-1.5 pl-5 text-sm text-[var(--text-secondary)]">${steps}</ol></section>
<section class="panel prose-public space-y-3"><h2 class="text-base font-semibold text-[var(--text-primary)]">${e(t('pages.discoverability.faqHeading'))}</h2>${faq}</section>`;
}

function renderArticle(meta: RouteMeta, opts: PrerenderOptions, t: TranslateFn): string {
  const { locale, catalog } = opts;
  const parts: string[] = [];
  if (meta.h1) {
    parts.push(
      `<h1 class="text-[1.75rem] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2.25rem]">${e(meta.h1)}</h1>`,
    );
  }
  parts.push(`<p class="mt-3 text-base text-[var(--text-secondary)]">${e(meta.description)}</p>`);
  if (meta.kind === 'guide' || meta.kind === 'compare') {
    const date = new Intl.DateTimeFormat(LOCALES[locale].bcp47, { dateStyle: 'long' }).format(
      new Date(`${meta.updated}T00:00:00Z`),
    );
    parts.push(
      `<p class="text-xs text-[var(--text-tertiary)]">${e(t('pages.article.byline', { author: SITE.creatorName }))} · <time datetime="${meta.updated}">${e(t('pages.article.updated', { date }))}</time></p>`,
    );
  }
  if (meta.noindex) {
    parts.push(
      `<p><a class="${linkClass}" href="${href('/', locale)}">${e(t('common.cta.openLocalDocu'))}</a></p>`,
    );
  } else if (meta.pageId) {
    const body = [renderBlocks(getPublicPageBlocks(meta.pageId, catalog.pages), locale)];
    if (meta.kind === 'hub') {
      for (const section of getHubSections(t)) {
        body.push(
          `<section class="space-y-3 pt-2"><h2 class="text-base font-semibold text-[var(--text-primary)]">${e(section.heading)}</h2><ul class="grid gap-3 sm:grid-cols-2">${section.items
            .map(
              (item) =>
                `<li class="flex"><a class="task-tile" href="${href(item.to, locale)}"><span class="flex flex-col gap-1"><span class="font-semibold text-[var(--text-primary)]">${e(item.title)}</span><span class="text-[0.8125rem] text-[var(--text-secondary)]">${e(item.desc)}</span></span></a></li>`,
            )
            .join('')}</ul></section>`,
        );
      }
    }
    parts.push(`<div class="mt-6 space-y-4 text-sm text-[var(--text-secondary)]">${body.join('\n')}</div>`);
  }
  return `<article class="panel prose-public">${parts.join('\n')}</article>`;
}

function renderFooter(meta: RouteMeta, locale: LocaleCode, t: TranslateFn): string {
  const seoLabel = (key: string) => {
    const crumb = t(`seo.${key}.breadcrumb`);
    return crumb === `seo.${key}.breadcrumb` ? t(`seo.${key}.title`) : crumb;
  };
  const column = (heading: string, items: [string, string][]) =>
    `<nav aria-label="${e(heading)}" class="space-y-2"><p class="text-xs font-semibold tracking-[0.12em] text-[var(--text-secondary)] uppercase">${e(heading)}</p><ul class="space-y-1.5">${items
      .map(([to, label]) => `<li><a class="${footLinkClass}" href="${href(to, locale)}">${e(label)}</a></li>`)
      .join('')}</ul></nav>`;

  const tools: [string, string][] = [
    [SITE_PATHS.pdfTools, t('common.footer.pdfTools')],
    [SITE_PATHS.mergePdf, seoLabel('mergePdf')],
    [SITE_PATHS.compressPdf, seoLabel('compressPdf')],
    [SITE_PATHS.splitPdf, seoLabel('splitPdf')],
    [SITE_PATHS.extractPages, seoLabel('extractPages')],
    [SITE_PATHS.deletePages, seoLabel('deletePages')],
    [SITE_PATHS.rotatePdf, seoLabel('rotatePdf')],
    [SITE_PATHS.reorderPages, seoLabel('reorderPages')],
    [SITE_PATHS.mergeDocx, seoLabel('mergeDocx')],
    [SITE_PATHS.docxToPdf, seoLabel('docxToPdf')],
  ];
  const resources: [string, string][] = [
    [SITE_PATHS.guides, t('common.footer.guides')],
    ...GUIDE_PAGES.map((p): [string, string] => [p.path, seoLabel(p.seoKey)]),
    ...COMPARE_PAGES.map((p): [string, string] => [p.path, seoLabel(p.seoKey)]),
  ];
  const about: [string, string][] = [
    [SITE_PATHS.howItWorks, t('common.footer.howItWorks')],
    [SITE_PATHS.privacy, t('common.footer.privacy')],
    [SITE_PATHS.browserSupport, t('common.footer.browserSupport')],
    [SITE_PATHS.offline, seoLabel('offline')],
    [SITE_PATHS.faq, t('common.footer.faq')],
    [SITE_PATHS.openSource, t('common.footer.openSource')],
    [SITE_PATHS.contribute, t('common.footer.contribute')],
    [SITE_PATHS.roadmap, t('common.footer.roadmap')],
    [SITE_PATHS.desktop, t('common.footer.desktop')],
    [SITE_PATHS.localAi, t('common.footer.localAi')],
  ];
  const samePath = meta.noindex ? '/' : meta.path;
  const languages = LOCALE_CODES.map(
    (code) =>
      `<li><a class="${footLinkClass}" href="${href(samePath, code)}" hreflang="${LOCALES[code].bcp47}" lang="${LOCALES[code].bcp47}"${code === locale ? ' aria-current="page"' : ''}>${e(LOCALES[code].nativeName)}</a></li>`,
  ).join('');

  return `<footer class="border-t border-[var(--border)] pt-8 pb-4 text-sm text-[var(--text-tertiary)]"><div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-5"><div class="space-y-2"><p class="text-sm font-semibold text-[var(--text-primary)]">${e(SITE.name)}</p><p class="text-[var(--text-secondary)]">${e(t('common.footer.tagline'))}</p><p>${e(t('common.footer.controlLine'))}</p><p><a class="${footLinkClass}" href="${e(GITHUB_URL)}" rel="noopener">${e(t('common.footer.github'))}</a></p></div>${column(t('common.footer.product'), tools)}${column(t('common.footer.resources'), resources)}${column(t('common.footer.openSource'), about)}<nav aria-label="${e(t('common.footer.ariaLanguages'))}" class="space-y-2"><p class="text-xs font-semibold tracking-[0.12em] text-[var(--text-secondary)] uppercase">${e(t('common.footer.languages'))}</p><ul class="space-y-1.5">${languages}</ul></nav></div><div class="mt-8 space-y-1 border-t border-[var(--border)] pt-5 text-xs"><p>${e(t('common.footer.createdBy'))} ${e(t('common.footer.communityContributions'))}</p><p>${e(t('common.footer.processingStatusLine'))}</p></div></footer>`;
}

export function renderBody(meta: RouteMeta, opts: PrerenderOptions, t: TranslateFn): string {
  const { locale, catalog } = opts;
  const main =
    meta.kind === 'home' ? renderHome(locale, t, catalog) : renderArticle(meta, opts, t);
  return `<div class="app-shell" data-prerendered>${renderHeader(meta, locale, t)}<main id="main-content" class="flex flex-col gap-6 md:gap-8" tabindex="-1">${main}</main>${renderFooter(meta, locale, t)}</div>`;
}

/** Inject page head + body into the built index.html template. */
export function renderDocument(template: string, meta: RouteMeta, opts: PrerenderOptions): string {
  if (!HEAD_RE.test(template) || !ROOT_RE.test(template)) {
    throw new Error('prerender: index.html is missing <!--seo:head--> markers or an empty #root');
  }
  const t = makeTranslator(opts.catalog, opts.english);
  const info = LOCALES[opts.locale];
  const noscript = `<noscript><p style="max-width:42rem;margin:1rem auto;padding:0 1rem;font-family:system-ui,sans-serif">${e(t('common.noscript'))}</p></noscript>`;
  return template
    .replace(HTML_TAG_RE, `<html lang="${info.bcp47}" dir="${info.isRtl ? 'rtl' : 'ltr'}">`)
    .replace(HEAD_RE, `${HEAD_START}\n${renderHead(meta, opts, t)}\n    ${HEAD_END}`)
    .replace(NOSCRIPT_RE, noscript)
    .replace(ROOT_RE, () => `<div id="root">${renderBody(meta, opts, t)}</div>`)
    .replace(/>Skip to main content</, `>${e(t('common.skipToContent'))}<`);
}

export interface PrerenderedFile {
  fileName: string;
  html: string;
}

/** Every route × locale, plus 404.html (English, noindex). */
export function prerenderAll(
  template: string,
  paths: string[],
  catalogs: Record<LocaleCode, Catalog>,
  siteUrl: string,
): PrerenderedFile[] {
  const english = catalogs.en;
  const out: PrerenderedFile[] = [];
  for (const locale of LOCALE_CODES) {
    const opts: PrerenderOptions = { siteUrl, locale, catalog: catalogs[locale], english };
    const t = makeTranslator(opts.catalog, english);
    for (const path of paths) {
      const meta = getRouteMeta(path, locale, t);
      out.push({ fileName: outputFileFor(path, locale), html: renderDocument(template, meta, opts) });
    }
  }
  const t = makeTranslator(english, english);
  out.push({
    fileName: '404.html',
    html: renderDocument(template, getNotFoundMeta(t), { siteUrl, locale: 'en', catalog: english, english }),
  });
  return out;
}
