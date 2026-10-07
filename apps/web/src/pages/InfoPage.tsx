import { LocalizedLink } from '../components/LocalizedLink';
import { PublicPageShell } from '../components/PublicPageShell';
import { LOCALES, useLocale, useT } from '../i18n';
import { COMPARE_PAGES, GUIDE_PAGES, getHubSections } from '../lib/contentPages';
import { getRouteMeta } from '../lib/routeMeta';
import { getPublicPageBlocks, renderPublicBlocks, type PublicPageId } from '../lib/publicPages';
import { SITE, SITE_PATHS } from '../lib/siteConfig';

const PATH_BY_ID: Record<PublicPageId, string> = {
  'merge-pdf': SITE_PATHS.mergePdf,
  'merge-docx': SITE_PATHS.mergeDocx,
  'compress-pdf': SITE_PATHS.compressPdf,
  'pdf-tools': SITE_PATHS.pdfTools,
  'docx-to-pdf': SITE_PATHS.docxToPdf,
  'split-pdf': SITE_PATHS.splitPdf,
  'extract-pages': SITE_PATHS.extractPages,
  'delete-pages': SITE_PATHS.deletePages,
  'rotate-pdf': SITE_PATHS.rotatePdf,
  'reorder-pages': SITE_PATHS.reorderPages,
  offline: SITE_PATHS.offline,
  privacy: SITE_PATHS.privacy,
  'how-it-works': SITE_PATHS.howItWorks,
  'browser-support': SITE_PATHS.browserSupport,
  'open-source': SITE_PATHS.openSource,
  contribute: SITE_PATHS.contribute,
  roadmap: SITE_PATHS.roadmap,
  desktop: SITE_PATHS.desktop,
  'local-ai': SITE_PATHS.localAi,
  faq: SITE_PATHS.faq,
  guides: SITE_PATHS.guides,
  ...(Object.fromEntries(GUIDE_PAGES.map((p) => [p.id, p.path])) as Record<
    (typeof GUIDE_PAGES)[number]['id'],
    string
  >),
  ...(Object.fromEntries(COMPARE_PAGES.map((p) => [p.id, p.path])) as Record<
    (typeof COMPARE_PAGES)[number]['id'],
    string
  >),
};

function HubCards() {
  const t = useT();
  return (
    <>
      {getHubSections(t).map((section) => (
        <section key={section.heading} className="space-y-3 pt-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{section.heading}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {section.items.map((item) => (
              <li key={item.to} className="flex">
                <LocalizedLink to={item.to} className="task-tile">
                  <span className="flex flex-col gap-1">
                    <span className="text-[0.9375rem] leading-snug font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </span>
                    <span className="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
                      {item.desc}
                    </span>
                  </span>
                </LocalizedLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export function InfoPage({ pageId }: { pageId: PublicPageId }) {
  const t = useT();
  const { locale, catalog } = useLocale();
  const path = PATH_BY_ID[pageId];
  const meta = getRouteMeta(path, locale, t);
  const blocks = getPublicPageBlocks(pageId, catalog.pages);
  const isArticle = meta.kind === 'guide' || meta.kind === 'compare';
  const updated = new Intl.DateTimeFormat(LOCALES[locale].bcp47, { dateStyle: 'long' }).format(
    new Date(`${meta.updated}T00:00:00Z`),
  );

  return (
    <PublicPageShell meta={meta} showCta={pageId !== 'faq'}>
      {isArticle ? (
        <p className="text-xs text-[var(--text-tertiary)]">
          {t('pages.article.byline', { author: SITE.creatorName })} ·{' '}
          <time dateTime={meta.updated}>{t('pages.article.updated', { date: updated })}</time>
        </p>
      ) : null}
      {renderPublicBlocks(blocks)}
      {pageId === 'guides' ? <HubCards /> : null}
    </PublicPageShell>
  );
}
