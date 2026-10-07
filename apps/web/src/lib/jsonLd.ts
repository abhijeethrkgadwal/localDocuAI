import { LOCALES, withLocale, type LocaleCode, type TranslateFn } from '../i18n';
import type { MessageTree } from '../i18n/translate';
import { getHubSections } from './contentPages';
import { getPageFaqItems, getPageHowTo } from './publicPages';
import type { RouteMeta } from './routeMeta';
import { getFaqItems, getHowItWorksSteps, type FaqItem } from './seoContent';
import { BRAND_ASSETS, LINKEDIN_URL, PORTFOLIO_URL, SITE, absoluteUrl } from './siteConfig';
import { TASK_TILES } from './taskTiles';

export interface JsonLdInput {
  meta: RouteMeta;
  locale: LocaleCode;
  t: TranslateFn;
  pages: MessageTree | Record<string, unknown>;
  toAbsolute?: (path: string) => string;
}

export const LOGO_PATH = BRAND_ASSETS.logoOnLight;

function faqPage(id: string, items: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    '@id': id,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** schema.org @graph for a page, or null for pages that should carry none (404). */
export function buildJsonLd({
  meta,
  locale,
  t,
  pages,
  toAbsolute = absoluteUrl,
}: JsonLdInput): Record<string, unknown> | null {
  if (meta.noindex) return null;

  const lang = LOCALES[locale].bcp47;
  const root = toAbsolute('/');
  const home = toAbsolute(withLocale('/', locale));
  const pageUrl = toAbsolute(withLocale(meta.path, locale));
  const orgId = `${root}#organization`;
  const personId = `${root}#creator`;
  const websiteId = `${root}#website`;
  const appId = `${root}#webapp`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const image = toAbsolute(meta.ogImage);
  const creatorSameAs = [LINKEDIN_URL, PORTFOLIO_URL].filter(Boolean);
  const isArticle = meta.kind === 'guide' || meta.kind === 'compare';

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': orgId,
      name: SITE.name,
      url: root,
      logo: { '@type': 'ImageObject', url: toAbsolute(LOGO_PATH), width: 530, height: 101 },
      description: SITE.description,
      founder: { '@id': personId },
      ...(SITE.sameAs.length ? { sameAs: [...SITE.sameAs] } : {}),
    },
    {
      '@type': 'Person',
      '@id': personId,
      name: SITE.creatorName,
      ...(PORTFOLIO_URL ? { url: PORTFOLIO_URL } : {}),
      ...(creatorSameAs.length ? { sameAs: creatorSameAs } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: root,
      name: SITE.name,
      description: SITE.shortDescription,
      inLanguage: Object.values(LOCALES).map((l) => l.bcp47),
      publisher: { '@id': orgId },
    },
  ];

  if (meta.breadcrumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('common.breadcrumbs.home'), item: home },
        ...meta.breadcrumbs.map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: crumb.name,
          item: toAbsolute(withLocale(crumb.path, locale)),
        })),
      ],
    });
  }

  const webPage: Record<string, unknown> = {
    '@type': isArticle ? 'WebPage' : meta.kind === 'hub' ? 'CollectionPage' : 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: meta.title,
    description: meta.description,
    inLanguage: lang,
    isPartOf: { '@id': websiteId },
    primaryImageOfPage: { '@type': 'ImageObject', url: image, width: 1200, height: 630 },
    dateModified: meta.updated,
    ...(meta.breadcrumbs?.length ? { breadcrumb: { '@id': breadcrumbId } } : {}),
  };
  graph.push(webPage);

  if (meta.kind === 'home') {
    graph.push({
      '@type': ['WebApplication', 'SoftwareApplication'],
      '@id': appId,
      name: SITE.name,
      url: root,
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'PDF editor',
      operatingSystem: 'Any (runs in a modern web browser)',
      browserRequirements: 'Requires JavaScript. Works in current Chrome, Edge, Firefox and Safari.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isAccessibleForFree: true,
      license: 'https://www.apache.org/licenses/LICENSE-2.0',
      description: SITE.description,
      image,
      featureList: TASK_TILES.filter((tile) => tile.status === 'available').map((tile) =>
        t(`common.tasks.items.${tile.id}.title`),
      ),
      inLanguage: Object.values(LOCALES).map((l) => l.bcp47),
      publisher: { '@id': orgId },
      author: { '@id': personId },
    });
    const steps = getHowItWorksSteps(pages);
    if (steps.length) {
      graph.push({
        '@type': 'HowTo',
        '@id': `${home}#how-it-works`,
        name: t('pages.discoverability.howItWorksHeading'),
        description: t('pages.productSummary'),
        tool: { '@id': appId },
        step: steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
        })),
      });
    }
  }

  if (meta.faqJsonLd) {
    graph.push(faqPage(`${pageUrl}#faq`, getFaqItems(t)));
  }

  if (meta.kind === 'tool' && meta.pageId) {
    const toolName = meta.breadcrumbs?.at(-1)?.name ?? meta.title;
    const toolAppId = `${pageUrl}#app`;
    graph.push({
      '@type': ['WebApplication', 'SoftwareApplication'],
      '@id': toolAppId,
      name: `${toolName} — ${SITE.name}`,
      url: pageUrl,
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'PDF editor',
      operatingSystem: 'Any (runs in a modern web browser)',
      browserRequirements: 'Requires JavaScript.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isAccessibleForFree: true,
      description: meta.description,
      image,
      inLanguage: lang,
      isPartOf: { '@id': appId },
      publisher: { '@id': orgId },
    });
    const howTo = getPageHowTo(meta.pageId, pages);
    if (howTo) {
      graph.push({
        '@type': 'HowTo',
        '@id': `${pageUrl}#howto`,
        name: howTo.name,
        description: meta.description,
        inLanguage: lang,
        totalTime: 'PT1M',
        estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
        tool: { '@id': toolAppId },
        step: howTo.steps.map((text, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: text,
          text,
          url: `${pageUrl}#main-content`,
        })),
      });
    }
  }

  if (isArticle) {
    graph.push({
      '@type': 'Article',
      '@id': `${pageUrl}#article`,
      headline: meta.h1 ?? meta.title,
      description: meta.description,
      image,
      inLanguage: lang,
      datePublished: meta.updated,
      dateModified: meta.updated,
      author: { '@id': personId },
      publisher: { '@id': orgId },
      mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
      about: { '@id': appId },
    });
  }

  if (meta.kind === 'hub') {
    const items = getHubSections(t).flatMap((section) => section.items);
    webPage.mainEntity = {
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: toAbsolute(withLocale(item.to, locale)),
      })),
    };
  }

  if (meta.pageId && meta.kind !== 'faq') {
    const pageFaq = getPageFaqItems(meta.pageId, pages);
    if (pageFaq.length) graph.push(faqPage(`${pageUrl}#faq`, pageFaq));
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
