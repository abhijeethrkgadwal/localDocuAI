import { PublicPageShell } from '../components/PublicPageShell';
import { getRouteMeta } from '../lib/routeMeta';
import { PUBLIC_PAGE_BLOCKS, renderPublicBlocks, type PublicPageId } from '../lib/publicPages';
import { SITE_PATHS } from '../lib/siteConfig';

const PATH_BY_ID: Record<PublicPageId, string> = {
  'merge-pdf': SITE_PATHS.mergePdf,
  'merge-docx': SITE_PATHS.mergeDocx,
  'pdf-tools': SITE_PATHS.pdfTools,
  'docx-to-pdf': SITE_PATHS.docxToPdf,
  offline: SITE_PATHS.offline,
  privacy: SITE_PATHS.privacy,
  'how-it-works': SITE_PATHS.howItWorks,
  'open-source': SITE_PATHS.openSource,
  contribute: SITE_PATHS.contribute,
  roadmap: SITE_PATHS.roadmap,
  desktop: SITE_PATHS.desktop,
  'local-ai': SITE_PATHS.localAi,
  faq: SITE_PATHS.faq,
};

export function InfoPage({ pageId }: { pageId: PublicPageId }) {
  const path = PATH_BY_ID[pageId];
  const meta = getRouteMeta(path);
  const blocks = PUBLIC_PAGE_BLOCKS[pageId];

  return (
    <PublicPageShell meta={meta} showCta={pageId !== 'faq'}>
      {renderPublicBlocks(blocks)}
    </PublicPageShell>
  );
}
