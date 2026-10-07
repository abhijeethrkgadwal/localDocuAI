import type { TranslateFn } from '../i18n';
import { SITE_PATHS } from './siteConfig';

/** Long-form guide pages (Article schema, listed on the /guides hub). */
export const GUIDE_PAGES = [
  {
    id: 'guide-merge-pdf-without-uploading',
    seoKey: 'guideMergePdfWithoutUploading',
    path: SITE_PATHS.guideMergeWithoutUploading,
  },
  {
    id: 'guide-compress-pdf-offline',
    seoKey: 'guideCompressPdfOffline',
    path: SITE_PATHS.guideCompressOffline,
  },
  {
    id: 'guide-is-it-safe-to-upload-pdfs-online',
    seoKey: 'guideIsItSafeToUploadPdfsOnline',
    path: SITE_PATHS.guideUploadSafety,
  },
  {
    id: 'guide-edit-pdf-on-phone-without-app',
    seoKey: 'guideEditPdfOnPhoneWithoutApp',
    path: SITE_PATHS.guidePdfOnPhone,
  },
] as const;

/** "X alternative" comparison pages. */
export const COMPARE_PAGES = [
  { id: 'ilovepdf-alternative', seoKey: 'ilovepdfAlternative', path: SITE_PATHS.ilovepdfAlternative },
  { id: 'smallpdf-alternative', seoKey: 'smallpdfAlternative', path: SITE_PATHS.smallpdfAlternative },
  {
    id: 'adobe-acrobat-alternative',
    seoKey: 'adobeAcrobatAlternative',
    path: SITE_PATHS.acrobatAlternative,
  },
] as const;

export type GuidePageId = (typeof GUIDE_PAGES)[number]['id'];
export type ComparePageId = (typeof COMPARE_PAGES)[number]['id'];
export type ContentPageId = GuidePageId | ComparePageId | 'guides';

export interface HubCard {
  title: string;
  desc: string;
  to: string;
}

export interface HubSection {
  heading: string;
  items: HubCard[];
}

/** Cards for the /guides hub, built from each page's SEO copy so titles never drift. */
export function getHubSections(t: TranslateFn): HubSection[] {
  const card = (seoKey: string, to: string): HubCard => ({
    title: t(`seo.${seoKey}.h1`),
    desc: t(`seo.${seoKey}.description`),
    to,
  });
  return [
    {
      heading: t('pages.guides.guidesHeading'),
      items: GUIDE_PAGES.map((p) => card(p.seoKey, p.path)),
    },
    {
      heading: t('pages.guides.comparisonsHeading'),
      items: COMPARE_PAGES.map((p) => card(p.seoKey, p.path)),
    },
  ];
}
