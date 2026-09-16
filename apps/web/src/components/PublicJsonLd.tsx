import { useLocale, useT, withLocale, LOCALES, LOCALE_CODES, type LocaleCode } from '../i18n';
import {
  getFaqItems,
  getHowItWorksSteps,
} from '../lib/seoContent';
import type { RouteMeta } from '../lib/routeMeta';
import { BRAND_ASSETS, LINKEDIN_URL, PORTFOLIO_URL, SITE, absoluteUrl } from '../lib/siteConfig';

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

  const canonicalHome = absoluteUrl('/');
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
        url: canonicalHome,
        description: SITE.description,
        logo: {
          '@type': 'ImageObject',
          url: absoluteUrl(BRAND_ASSETS.logoOnLight),
          width: 530,
          height: 101,
        },
        image: absoluteUrl(BRAND_ASSETS.ogImage),
        founder: { '@id': personId },
        ...(SITE.sameAs.length ? { sameAs: [...SITE.sameAs] } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${canonicalHome}#website`,
        url: canonicalHome,
        name: SITE.name,
        description: SITE.shortDescription,
        inLanguage: LOCALE_CODES.map((code) => LOCALES[code].bcp47),
        publisher: { '@id': orgId },
        image: absoluteUrl(BRAND_ASSETS.ogImage),
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: meta.title,
        description: meta.description,
        inLanguage: LOCALES[activeLocale].bcp47,
        isPartOf: { '@id': `${canonicalHome}#website` },
      },
      {
        '@type': ['WebApplication', 'SoftwareApplication'],
        '@id': `${canonicalHome}#webapp`,
        name: SITE.name,
        url: canonicalHome,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        isAccessibleForFree: true,
        description: SITE.description,
        publisher: { '@id': orgId },
        image: absoluteUrl(BRAND_ASSETS.ogImage),
      },
      {
        '@type': 'HowTo',
        '@id': `${canonicalHome}#how-it-works`,
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
