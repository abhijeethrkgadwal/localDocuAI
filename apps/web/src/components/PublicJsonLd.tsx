import { useLocale, useT, withLocale, LOCALES, type LocaleCode } from '../i18n';
import {
  getFaqItems,
  getHowItWorksSteps,
} from '../lib/seoContent';
import type { RouteMeta } from '../lib/routeMeta';
import { LINKEDIN_URL, PORTFOLIO_URL, SITE, absoluteUrl } from '../lib/siteConfig';

/** JSON-LD for public/info pages — only schemas appropriate to the page. */
export function PublicJsonLd({
  meta,
  locale: localeProp,
}: {
  meta: RouteMeta;
  locale?: LocaleCode;
}) {
  const t = useT();
  const { locale, catalog } = useLocale();
  const activeLocale = localeProp ?? locale;
  const faqItems = getFaqItems(t);
  const howItWorksSteps = getHowItWorksSteps(catalog.pages);
  const productSummary = t('pages.productSummary');

  const home = absoluteUrl(withLocale('/', activeLocale));
  const barePath = meta.path === '/404' ? '/' : meta.path;
  const pageUrl = absoluteUrl(withLocale(barePath, activeLocale));
  const orgId = `${absoluteUrl('/')}#organization`;
  const personId = `${absoluteUrl('/')}#creator`;
  const creatorSameAs = [LINKEDIN_URL, PORTFOLIO_URL].filter(Boolean);
  const graph: Record<string, unknown>[] = [];

  if (meta.breadcrumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: t('common.breadcrumbs.home'),
          item: home,
        },
        ...meta.breadcrumbs.map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: crumb.name,
          item: absoluteUrl(withLocale(crumb.path, activeLocale)),
        })),
      ],
    });
  }

  if (meta.faqJsonLd) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  if (meta.softwareJsonLd) {
    graph.push(
      {
        '@type': 'Person',
        '@id': personId,
        name: SITE.creatorName,
        ...(PORTFOLIO_URL ? { url: PORTFOLIO_URL } : {}),
        ...(creatorSameAs.length ? { sameAs: creatorSameAs } : {}),
      },
      {
        '@type': 'Organization',
        '@id': orgId,
        name: SITE.name,
        url: home,
        description: SITE.description,
        founder: { '@id': personId },
        ...(SITE.sameAs.length ? { sameAs: [...SITE.sameAs] } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${home}#website`,
        url: home,
        name: SITE.name,
        description: SITE.shortDescription,
        inLanguage: LOCALES[activeLocale].bcp47,
        publisher: { '@id': orgId },
      },
      {
        '@type': ['WebApplication', 'SoftwareApplication'],
        '@id': `${home}#webapp`,
        name: SITE.name,
        url: home,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        isAccessibleForFree: true,
        description: SITE.description,
        publisher: { '@id': orgId },
      },
      {
        '@type': 'HowTo',
        '@id': `${home}#how-it-works`,
        name: t('pages.discoverability.howItWorksHeading'),
        description: productSummary,
        step: howItWorksSteps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
        })),
      },
    );
  }

  if (!graph.length) return null;

  const payload = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
