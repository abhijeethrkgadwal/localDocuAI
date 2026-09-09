import { useEffect, useMemo } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DocumentWorkspace } from '../components/DocumentWorkspace';
import { PublicJsonLd } from '../components/PublicJsonLd';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { TrustStatusStrip } from '../components/TrustStatusStrip';
import { useTheme } from '../hooks/useTheme';
import { useLocale, useT } from '../i18n';
import { applyDocumentMeta, getRouteMeta } from '../lib/routeMeta';
import { getPublicPageBlocks, renderPublicBlocks, type PublicPageId } from '../lib/publicPages';
import {
  resolveToolWorkspaceCopy,
  TOOL_WORKSPACE_CONFIG,
  type ToolPageId,
} from '../lib/toolPageConfig';
import { useWorkspaceStore } from '../store';

export function ToolPage({ pageId }: { pageId: ToolPageId }) {
  const t = useT();
  const { locale, catalog } = useLocale();
  const config = TOOL_WORKSPACE_CONFIG[pageId];
  const meta = getRouteMeta(config.path, locale, t);
  const blocks = getPublicPageBlocks(pageId as PublicPageId, catalog.pages);
  const { preference, setPreference } = useTheme();
  const filesOnDevice = useWorkspaceStore((s) => s.sessionFiles.length);
  const workspaceProps = useMemo(() => {
    const resolved = resolveToolWorkspaceCopy(pageId, t);
    return {
      allowedActions: config.allowedActions,
      lockAction: config.lockAction,
      acceptKind: config.acceptKind,
      showFileManage: config.showFileManage,
      showAiPlaceholder: config.showAiPlaceholder,
      folderExtensions: config.folderExtensions,
      workspaceHeading: resolved.workspaceHeading,
      opsTitle: resolved.opsTitle,
      opsDesc: resolved.opsDesc,
      initialAction: config.allowedActions[0],
    };
  }, [config, pageId, t]);

  useEffect(() => {
    applyDocumentMeta(meta, locale);
  }, [meta, locale]);

  return (
    <div className="app-shell">
      <PublicJsonLd meta={meta} locale={locale} />

      <header className="space-y-4">
        <SiteHeader preference={preference} onThemeChange={setPreference} workspace />
        {meta.breadcrumbs ? <Breadcrumbs items={meta.breadcrumbs} /> : null}
        <div className="max-w-3xl space-y-3">
          {meta.h1 ? (
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2.25rem]">
              {meta.h1}
            </h1>
          ) : null}
          <p className="text-base text-[var(--text-secondary)]">{meta.description}</p>
        </div>
        <TrustStatusStrip filesOnDevice={filesOnDevice} />
      </header>

      <main id="main-content" className="flex flex-col gap-6 md:gap-8" tabIndex={-1}>
        <DocumentWorkspace {...workspaceProps} />

        <article className="panel prose-public" aria-labelledby="tool-info-heading">
          <h2
            id="tool-info-heading"
            className="text-base font-semibold tracking-tight text-[var(--text-primary)]"
          >
            {t('pages.tool.aboutHeading')}
          </h2>
          <div className="mt-4 space-y-4 text-sm text-[var(--text-secondary)]">
            {renderPublicBlocks(blocks)}
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
