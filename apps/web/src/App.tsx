import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { WorkspacePage } from './WorkspacePage';
import { SITE_PATHS } from './lib/siteConfig';
import type { PublicPageId } from './lib/publicPages';

const InfoPage = lazy(() =>
  import('./pages/InfoPage').then((m) => ({ default: m.InfoPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function InfoRoute({ pageId }: { pageId: PublicPageId }) {
  return (
    <Suspense
      fallback={
        <div className="app-shell">
          <p className="text-sm text-[var(--text-secondary)]" role="status">
            Loading…
          </p>
        </div>
      }
    >
      <InfoPage pageId={pageId} />
    </Suspense>
  );
}

/** App shell: homepage workspace + public discovery routes. */
export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path={SITE_PATHS.home} element={<WorkspacePage />} />
        <Route path={SITE_PATHS.mergePdf} element={<InfoRoute pageId="merge-pdf" />} />
        <Route path={SITE_PATHS.mergeDocx} element={<InfoRoute pageId="merge-docx" />} />
        <Route path={SITE_PATHS.pdfTools} element={<InfoRoute pageId="pdf-tools" />} />
        <Route path={SITE_PATHS.docxToPdf} element={<InfoRoute pageId="docx-to-pdf" />} />
        <Route path={SITE_PATHS.offline} element={<InfoRoute pageId="offline" />} />
        <Route path={SITE_PATHS.privacy} element={<InfoRoute pageId="privacy" />} />
        <Route path={SITE_PATHS.howItWorks} element={<InfoRoute pageId="how-it-works" />} />
        <Route path={SITE_PATHS.openSource} element={<InfoRoute pageId="open-source" />} />
        <Route path={SITE_PATHS.contribute} element={<InfoRoute pageId="contribute" />} />
        <Route path={SITE_PATHS.roadmap} element={<InfoRoute pageId="roadmap" />} />
        <Route path={SITE_PATHS.desktop} element={<InfoRoute pageId="desktop" />} />
        <Route path={SITE_PATHS.localAi} element={<InfoRoute pageId="local-ai" />} />
        <Route path={SITE_PATHS.faq} element={<InfoRoute pageId="faq" />} />
        <Route path="/index.html" element={<Navigate to={SITE_PATHS.home} replace />} />
        <Route
          path="*"
          element={
            <Suspense fallback={null}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
