/**
 * Public site identity and external links for SEO / AEO / GEO.
 * Set VITE_SITE_URL at build time to your production origin (no trailing slash).
 * Default / production origin: https://www.localdocu.org
 * Leave optional social/support URLs empty until real values exist — do not invent them.
 */
const viteEnv =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as ImportMetaEnv);

const rawSiteUrl = (viteEnv.VITE_SITE_URL as string | undefined)?.trim() ?? '';

/** Production origin used for canonicals, sitemap, OG, robots. */
export const PRODUCTION_URL = rawSiteUrl.replace(/\/$/, '') || 'https://www.localdocu.org';

/** @deprecated Prefer PRODUCTION_URL — kept for existing imports. */
export const SITE_URL = PRODUCTION_URL;

/** Official GitHub repository (from project remote). */
export const GITHUB_URL = 'https://github.com/abhijeethrkgadwal/localDocuAI';

/**
 * Creator LinkedIn profile. Override with VITE_LINKEDIN_URL at build time if needed.
 */
export const LINKEDIN_URL =
  (viteEnv.VITE_LINKEDIN_URL as string | undefined)?.trim() ||
  'https://www.linkedin.com/in/abhijeethrkgadwal/';

/**
 * Creator personal portfolio. Override with VITE_PORTFOLIO_URL at build time if needed.
 */
export const PORTFOLIO_URL =
  (viteEnv.VITE_PORTFOLIO_URL as string | undefined)?.trim() ||
  'https://www.davnix.com/abhijeeth-gadwal';

/**
 * Support / sponsorship destination. Empty until funding is active.
 * Do not invent a funding URL; avoid dead links in the UI.
 */
export const SUPPORT_URL = (viteEnv.VITE_SUPPORT_URL as string | undefined)?.trim() || '';

export const SITE = {
  name: 'LocalDocu',
  legalName: 'LocalDocu',
  brandMark: 'LocalDocu',
  tagline: 'Tell it what to do. Your files stay on your device.',
  supportingMessage: 'Local-first document automation for PDF and Word files.',
  secondaryMessage:
    'Process, organize, merge, convert and manage documents locally in your browser.',
  description:
    'LocalDocu is a privacy-first, local-first document tool. Merge, split, compress, rotate, and convert PDF and Word files in your browser — document contents stay on your device.',
  shortDescription: 'Privacy-first local PDF and Word automation. Files stay on your device.',
  locale: 'en_US',
  language: 'en',
  themeColor: '#0F766E',
  twitterHandle: '',
  license: 'Apache-2.0',
  creatorName: 'Abhijeeth Gadwal',
  sameAs: [
    GITHUB_URL,
    ...(LINKEDIN_URL ? [LINKEDIN_URL] : []),
    ...(PORTFOLIO_URL ? [PORTFOLIO_URL] : []),
  ] as string[],
} as const;

export const SITE_PATHS = {
  home: '/',
  mergePdf: '/merge-pdf',
  mergeDocx: '/merge-docx',
  compressPdf: '/compress-pdf',
  pdfTools: '/pdf-tools',
  docxToPdf: '/docx-to-pdf',
  offline: '/offline',
  privacy: '/privacy',
  howItWorks: '/how-it-works',
  browserSupport: '/browser-support',
  openSource: '/open-source',
  contribute: '/contribute',
  roadmap: '/roadmap',
  desktop: '/desktop',
  localAi: '/local-ai',
  faq: '/faq',
} as const;

export type SitePathKey = keyof typeof SITE_PATHS;

/** Public discovery + tool routes (excludes homepage workspace). */
export const PUBLIC_ROUTE_PATHS = Object.values(SITE_PATHS).filter((p) => p !== '/') as string[];

export function absoluteUrl(path = '/'): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${PRODUCTION_URL}${normalized === '/' ? '/' : normalized}`;
}
