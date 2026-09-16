import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { WorkspacePage } from './WorkspacePage';
import { SITE_PATHS } from './lib/siteConfig';
import type { PublicPageId } from './lib/publicPages';
import type { ToolPageId } from './lib/toolPageConfig';
import {
  detectLocaleFromPath,
  isPrefixedLocale,
  LocaleProvider,
  resolvePreferredLocale,
  stripLocale,
  useT,
  withLocale,
} from './i18n';

const InfoPage = lazy(() =>
  import('./pages/InfoPage').then((m) => ({ default: m.InfoPage })),
);
const ToolPage = lazy(() =>
  import('./pages/ToolPage').then((m) => ({ default: m.ToolPage })),
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

function RouteFallback() {
  const t = useT();
  return (
    <div className="app-shell">
      <p className="text-sm text-[var(--text-secondary)]" role="status">
        {t('common.loading')}
      </p>
    </div>
  );
}

function InfoRoute({ pageId }: { pageId: PublicPageId }) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <InfoPage pageId={pageId} />
    </Suspense>
  );
}

function ToolRoute({ pageId }: { pageId: ToolPageId }) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <ToolPage pageId={pageId} />
    </Suspense>
  );
}

function LocaleShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathLocale = detectLocaleFromPath(location.pathname);
  const preferred = resolvePreferredLocale(pathLocale);
  if (preferred !== pathLocale) {
    const target = withLocale(stripLocale(location.pathname), preferred);
    const dest = `${target}${location.search}${location.hash}`;
    const current = `${location.pathname}${location.search}${location.hash}`;
    if (dest !== current) {
      return <Navigate to={dest} replace />;
    }
  }
  return <LocaleProvider locale={pathLocale}>{children}</LocaleProvider>;
}

function PrefixedLocaleGate() {
  const { locale } = useParams<{ locale: string }>();
  if (!locale || !isPrefixedLocale(locale)) {
    return (
      <Suspense fallback={null}>
        <NotFoundPage />
      </Suspense>
    );
  }
  return <Outlet />;
}

function NotFoundRoute() {
  return (
    <Suspense fallback={null}>
      <NotFoundPage />
    </Suspense>
  );
}

function EnRedirect() {
  const location = useLocation();
  const rest = location.pathname.replace(/^\/en/, '') || '/';
  return <Navigate to={`${rest}${location.search}${location.hash}`} replace />;
}

const toolAndInfoRoutes = (
  <>
    <Route path="merge-pdf" element={<ToolRoute pageId="merge-pdf" />} />
    <Route path="merge-docx" element={<ToolRoute pageId="merge-docx" />} />
    <Route path="compress-pdf" element={<ToolRoute pageId="compress-pdf" />} />
    <Route path="pdf-tools" element={<ToolRoute pageId="pdf-tools" />} />
    <Route path="docx-to-pdf" element={<ToolRoute pageId="docx-to-pdf" />} />
    <Route path="offline" element={<InfoRoute pageId="offline" />} />
    <Route path="privacy" element={<InfoRoute pageId="privacy" />} />
    <Route path="how-it-works" element={<InfoRoute pageId="how-it-works" />} />
    <Route path="browser-support" element={<InfoRoute pageId="browser-support" />} />
    <Route path="open-source" element={<InfoRoute pageId="open-source" />} />
    <Route path="contribute" element={<InfoRoute pageId="contribute" />} />
    <Route path="roadmap" element={<InfoRoute pageId="roadmap" />} />
    <Route path="desktop" element={<InfoRoute pageId="desktop" />} />
    <Route path="local-ai" element={<InfoRoute pageId="local-ai" />} />
    <Route path="faq" element={<InfoRoute pageId="faq" />} />
  </>
);

/** App shell: English unprefixed paths + `/:locale/...` for other languages. */
export function App() {
  return (
    <BrowserRouter>
      <LocaleShell>
        <ScrollToTop />
        <Routes>
          <Route path={SITE_PATHS.home} element={<WorkspacePage />} />
          <Route path={SITE_PATHS.mergePdf} element={<ToolRoute pageId="merge-pdf" />} />
          <Route path={SITE_PATHS.mergeDocx} element={<ToolRoute pageId="merge-docx" />} />
          <Route path={SITE_PATHS.compressPdf} element={<ToolRoute pageId="compress-pdf" />} />
          <Route path={SITE_PATHS.pdfTools} element={<ToolRoute pageId="pdf-tools" />} />
          <Route path={SITE_PATHS.docxToPdf} element={<ToolRoute pageId="docx-to-pdf" />} />
          <Route path={SITE_PATHS.offline} element={<InfoRoute pageId="offline" />} />
          <Route path={SITE_PATHS.privacy} element={<InfoRoute pageId="privacy" />} />
          <Route path={SITE_PATHS.howItWorks} element={<InfoRoute pageId="how-it-works" />} />
          <Route path={SITE_PATHS.browserSupport} element={<InfoRoute pageId="browser-support" />} />
          <Route path={SITE_PATHS.openSource} element={<InfoRoute pageId="open-source" />} />
          <Route path={SITE_PATHS.contribute} element={<InfoRoute pageId="contribute" />} />
          <Route path={SITE_PATHS.roadmap} element={<InfoRoute pageId="roadmap" />} />
          <Route path={SITE_PATHS.desktop} element={<InfoRoute pageId="desktop" />} />
          <Route path={SITE_PATHS.localAi} element={<InfoRoute pageId="local-ai" />} />
          <Route path={SITE_PATHS.faq} element={<InfoRoute pageId="faq" />} />
          <Route path="/index.html" element={<Navigate to={SITE_PATHS.home} replace />} />
          <Route path="/en" element={<Navigate to="/" replace />} />
          <Route path="/en/*" element={<EnRedirect />} />
          <Route path="/:locale" element={<PrefixedLocaleGate />}>
            <Route index element={<WorkspacePage />} />
            {toolAndInfoRoutes}
            <Route path="*" element={<NotFoundRoute />} />
          </Route>
          <Route path="*" element={<NotFoundRoute />} />
        </Routes>
      </LocaleShell>
    </BrowserRouter>
  );
}
