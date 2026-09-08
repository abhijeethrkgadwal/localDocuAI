import { FAQ_ITEMS, HOW_IT_WORKS_STEPS, PRODUCT_SUMMARY } from '../lib/seoContent';
import type { RouteMeta } from '../lib/routeMeta';
import { LINKEDIN_URL, PORTFOLIO_URL, SITE, absoluteUrl } from '../lib/siteConfig';

/** JSON-LD for public/info pages — only schemas appropriate to the page. */
export function PublicJsonLd({ meta }: { meta: RouteMeta }) {
  const home = absoluteUrl('/');
  const pageUrl = absoluteUrl(meta.path === '/404' ? '/' : meta.path);
  const orgId = `${home}#organization`;
  const personId = `${home}#creator`;
  const creatorSameAs = [LINKEDIN_URL, PORTFOLIO_URL].filter(Boolean);
  const graph: Record<string, unknown>[] = [];

  if (meta.breadcrumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: home,
        },
        ...meta.breadcrumbs.map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: crumb.name,
          item: absoluteUrl(crumb.path),
        })),
      ],
    });
  }

  if (meta.faqJsonLd) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: FAQ_ITEMS.map((item) => ({
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
        inLanguage: SITE.language,
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
        name: 'How to process documents privately with LocalDocu',
        description: PRODUCT_SUMMARY,
        step: HOW_IT_WORKS_STEPS.map((step, index) => ({
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
