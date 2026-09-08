import { SITE, SITE_PATHS, absoluteUrl } from './siteConfig';

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
  /** Breadcrumb trail after Home (label + path). */
  breadcrumbs?: { name: string; path: string }[];
  changefreq?: 'weekly' | 'monthly';
  priority?: string;
}

export const ROUTE_META: Record<string, RouteMeta> = {
  [SITE_PATHS.home]: {
    path: SITE_PATHS.home,
    title: 'LocalDocu — Local-First Document Automation',
    description:
      'Tell it what to do. Your files stay on your device. Merge, split, compress, and convert PDF and Word files locally in your browser.',
    softwareJsonLd: true,
    faqJsonLd: true,
    changefreq: 'weekly',
    priority: '1.0',
  },
  [SITE_PATHS.mergePdf]: {
    path: SITE_PATHS.mergePdf,
    title: 'Merge PDF Files Locally & Privately | LocalDocu',
    description:
      'Merge PDF files without uploading them. Select, reorder, and combine PDFs locally in your browser with LocalDocu.',
    h1: 'Merge PDF files without uploading them',
    breadcrumbs: [{ name: 'Merge PDF', path: SITE_PATHS.mergePdf }],
    changefreq: 'monthly',
    priority: '0.9',
  },
  [SITE_PATHS.mergeDocx]: {
    path: SITE_PATHS.mergeDocx,
    title: 'Merge Word Documents Locally | LocalDocu',
    description:
      'Merge DOCX Word documents locally on your device. Practical merge with clear limits — no document upload to LocalDocu.',
    h1: 'Merge Word documents locally',
    breadcrumbs: [{ name: 'Merge DOCX', path: SITE_PATHS.mergeDocx }],
    changefreq: 'monthly',
    priority: '0.85',
  },
  [SITE_PATHS.pdfTools]: {
    path: SITE_PATHS.pdfTools,
    title: 'Local PDF Tools — Merge, Split, Extract & More | LocalDocu',
    description:
      'Local PDF tools for merge, split, extract, delete, rotate, reorder, and compress — without unnecessary uploads.',
    h1: 'Local PDF tools without unnecessary uploads',
    breadcrumbs: [{ name: 'PDF tools', path: SITE_PATHS.pdfTools }],
    changefreq: 'monthly',
    priority: '0.9',
  },
  [SITE_PATHS.docxToPdf]: {
    path: SITE_PATHS.docxToPdf,
    title: 'Convert DOCX to PDF Locally | LocalDocu',
    description:
      'Convert DOC and DOCX to a readable PDF on your device. Complex Word layouts may not be preserved exactly.',
    h1: 'Convert Word documents to PDF locally',
    breadcrumbs: [{ name: 'DOCX to PDF', path: SITE_PATHS.docxToPdf }],
    changefreq: 'monthly',
    priority: '0.85',
  },
  [SITE_PATHS.offline]: {
    path: SITE_PATHS.offline,
    title: 'Offline Document Processing | LocalDocu',
    description:
      'Work with documents offline after LocalDocu’s app shell is cached. Local processing does not require a network for supported workflows.',
    h1: 'Work with documents offline',
    breadcrumbs: [{ name: 'Offline', path: SITE_PATHS.offline }],
    changefreq: 'monthly',
    priority: '0.8',
  },
  [SITE_PATHS.privacy]: {
    path: SITE_PATHS.privacy,
    title: 'LocalDocu Privacy — Local-First Document Processing',
    description:
      'Privacy by design: document contents are processed on your device. No document-upload backend and no account required in the current release.',
    h1: 'Privacy by design',
    breadcrumbs: [{ name: 'Privacy', path: SITE_PATHS.privacy }],
    changefreq: 'monthly',
    priority: '0.9',
  },
  [SITE_PATHS.howItWorks]: {
    path: SITE_PATHS.howItWorks,
    title: 'How LocalDocu Works | Local-First Document Automation',
    description:
      'Select files, choose an operation, and run locally. Learn how LocalDocu keeps document processing on your device.',
    h1: 'How LocalDocu works',
    breadcrumbs: [{ name: 'How it works', path: SITE_PATHS.howItWorks }],
    changefreq: 'monthly',
    priority: '0.85',
  },
  [SITE_PATHS.openSource]: {
    path: SITE_PATHS.openSource,
    title: 'LocalDocu Open Source | Build in the Open',
    description:
      'LocalDocu is open source under Apache-2.0. View the code, roadmap, and how the project is developed in the open.',
    h1: 'Open source by design',
    breadcrumbs: [{ name: 'Open source', path: SITE_PATHS.openSource }],
    changefreq: 'monthly',
    priority: '0.8',
  },
  [SITE_PATHS.contribute]: {
    path: SITE_PATHS.contribute,
    title: 'Contribute to LocalDocu | Open-Source Document Automation',
    description:
      'Help build LocalDocu with code, tests, docs, accessibility, and design. Start with issues and the contributor guide.',
    h1: 'Help build LocalDocu',
    breadcrumbs: [{ name: 'Contribute', path: SITE_PATHS.contribute }],
    changefreq: 'monthly',
    priority: '0.8',
  },
  [SITE_PATHS.roadmap]: {
    path: SITE_PATHS.roadmap,
    title: 'LocalDocu Roadmap | Web, Desktop & LocalDocu AI',
    description:
      'See what LocalDocu ships today and what is planned: stronger desktop capacity and LocalDocu AI for intent-driven local document workflows.',
    h1: 'Roadmap',
    breadcrumbs: [{ name: 'Roadmap', path: SITE_PATHS.roadmap }],
    changefreq: 'monthly',
    priority: '0.8',
  },
  [SITE_PATHS.desktop]: {
    path: SITE_PATHS.desktop,
    title: 'LocalDocu Desktop | Advanced Local Document Automation',
    description:
      'A future desktop app for heavier local workloads and LocalDocu AI. Positioning only — not available yet. The web workspace remains the product today.',
    h1: 'Desktop: stronger local capacity ahead',
    breadcrumbs: [{ name: 'Desktop', path: SITE_PATHS.desktop }],
    changefreq: 'monthly',
    priority: '0.7',
  },
  [SITE_PATHS.localAi]: {
    path: SITE_PATHS.localAi,
    title: 'LocalDocu AI | Intent-Driven Local Document Automation',
    description:
      'LocalDocu AI runs in the desktop app: an open-weight, on-device model that reads document metadata and user intent, then drives LocalDocu document management — without sending document contents to the cloud. Not active in the current web release.',
    h1: 'LocalDocu AI: planned for the desktop app',
    breadcrumbs: [{ name: 'LocalDocu AI', path: SITE_PATHS.localAi }],
    changefreq: 'monthly',
    priority: '0.7',
  },
  [SITE_PATHS.faq]: {
    path: SITE_PATHS.faq,
    title: 'LocalDocu FAQ — Privacy, Offline & Formats',
    description:
      'Common questions about LocalDocu, privacy, supported files, offline use, open source, and contributions.',
    h1: 'Frequently asked questions',
    faqJsonLd: true,
    breadcrumbs: [{ name: 'FAQ', path: SITE_PATHS.faq }],
    changefreq: 'monthly',
    priority: '0.9',
  },
};

export const NOT_FOUND_META: RouteMeta = {
  path: '/404',
  title: `Page not found | ${SITE.name}`,
  description: 'This page does not exist. Return to the LocalDocu workspace.',
  h1: 'Page not found',
};

export function getRouteMeta(pathname: string): RouteMeta {
  const normalized = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  return ROUTE_META[normalized] ?? NOT_FOUND_META;
}

export function applyDocumentMeta(meta: RouteMeta): void {
  const canonical = absoluteUrl(meta.path === '/404' ? '/' : meta.path);
  document.title = meta.title;

  const setMeta = (selector: string, attr: string, value: string) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };

  setMeta('meta[name="description"]', 'content', meta.description);
  setMeta('link[rel="canonical"]', 'href', canonical);
  setMeta('meta[property="og:url"]', 'content', canonical);
  setMeta('meta[property="og:title"]', 'content', meta.title);
  setMeta('meta[property="og:description"]', 'content', meta.description);
  setMeta('meta[property="og:type"]', 'content', meta.ogType ?? 'website');
  setMeta('meta[name="twitter:title"]', 'content', meta.title);
  setMeta('meta[name="twitter:description"]', 'content', meta.description);
}

export function sitemapEntries(): { loc: string; priority: string; changefreq: string }[] {
  return Object.values(ROUTE_META).map((m) => ({
    loc: absoluteUrl(m.path),
    priority: m.priority ?? '0.7',
    changefreq: m.changefreq ?? 'monthly',
  }));
}
