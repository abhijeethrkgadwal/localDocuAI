import { useEffect } from 'react';
import { DocumentWorkspace } from './components/DocumentWorkspace';
import { DiscoverabilitySections } from './components/DiscoverabilitySections';
import { PublicJsonLd } from './components/PublicJsonLd';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { TrustStatusStrip } from './components/TrustStatusStrip';
import { useTheme } from './hooks/useTheme';
import { useLocale, useT } from './i18n';
import { FULL_WORKSPACE_CONFIG, resolveFullWorkspaceCopy } from './lib/toolPageConfig';
import { getRouteMeta, applyDocumentMeta } from './lib/routeMeta';
import { SITE_PATHS } from './lib/siteConfig';
import { useWorkspaceStore } from './store';

export function WorkspacePage() {
  const t = useT();
  const { locale } = useLocale();
  const { preference, setPreference } = useTheme();
  const homeMeta = getRouteMeta(SITE_PATHS.home, locale, t);
  const filesOnDevice = useWorkspaceStore((s) => s.sessionFiles.length);
  const copy = resolveFullWorkspaceCopy(t);
  const tagline = t('common.site.tagline');
  const taglineParts = tagline.split(/(?<=\.)\s+/);

  useEffect(() => {
    applyDocumentMeta(homeMeta, locale);
  }, [homeMeta, locale]);

  return (
    <div className="app-shell">
      <PublicJsonLd meta={homeMeta} locale={locale} />

      <header className="space-y-4 md:space-y-5">
        <SiteHeader preference={preference} onThemeChange={setPreference} workspace />

        <div className="max-w-3xl space-y-2.5 sm:space-y-3">
          <h1 className="text-[2rem] leading-[1.1] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2.75rem] sm:leading-[1.08]">
            {taglineParts.length >= 2 ? (
              <>
                {taglineParts[0]}
                <br className="hidden sm:block" /> {taglineParts.slice(1).join(' ')}
              </>
            ) : (
              tagline
            )}
          </h1>
          <p className="max-w-2xl text-base text-[var(--text-secondary)] sm:text-lg">
            {t('common.site.supportingMessage')}
          </p>
          <p className="max-w-2xl text-sm text-[var(--text-tertiary)] sm:text-base">
            {t('common.site.secondaryMessage')}
          </p>
        </div>

        <TrustStatusStrip filesOnDevice={filesOnDevice} />
      </header>

      <main id="main-content" className="flex flex-col gap-6 md:gap-8" tabIndex={-1}>
        <DocumentWorkspace
          allowedActions={FULL_WORKSPACE_CONFIG.allowedActions}
          lockAction={FULL_WORKSPACE_CONFIG.lockAction}
          acceptKind={FULL_WORKSPACE_CONFIG.acceptKind}
          showFileManage={FULL_WORKSPACE_CONFIG.showFileManage}
          showAiPlaceholder={FULL_WORKSPACE_CONFIG.showAiPlaceholder}
          folderExtensions={FULL_WORKSPACE_CONFIG.folderExtensions}
          workspaceHeading={copy.workspaceHeading}
          opsTitle={copy.opsTitle}
          opsDesc={copy.opsDesc}
        />

        <DiscoverabilitySections />
      </main>

      <SiteFooter />
    </div>
  );
}
