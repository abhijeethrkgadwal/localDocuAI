import { useEffect, type ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import { applyDocumentMeta, type RouteMeta } from '../lib/routeMeta';
import { Breadcrumbs } from './Breadcrumbs';
import { OpenLocalDocuCta } from './OpenLocalDocuCta';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { PublicJsonLd } from './PublicJsonLd';

interface PublicPageShellProps {
  meta: RouteMeta;
  children: ReactNode;
  showCta?: boolean;
}

export function PublicPageShell({ meta, children, showCta = true }: PublicPageShellProps) {
  const { preference, setPreference } = useTheme();

  useEffect(() => {
    applyDocumentMeta(meta);
  }, [meta]);

  return (
    <div className="app-shell">
      <PublicJsonLd meta={meta} />
      <header className="space-y-4">
        <SiteHeader preference={preference} onThemeChange={setPreference} />
        {meta.breadcrumbs ? <Breadcrumbs items={meta.breadcrumbs} /> : null}
      </header>

      <main id="main-content" className="flex flex-col gap-6 md:gap-8" tabIndex={-1}>
        <article className="panel prose-public">
          {meta.h1 ? (
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2.25rem]">
              {meta.h1}
            </h1>
          ) : null}
          <p className="mt-3 text-base text-[var(--text-secondary)]">{meta.description}</p>
          {showCta ? <OpenLocalDocuCta className="mt-5" /> : null}
          <div className="mt-6 space-y-4 text-sm text-[var(--text-secondary)]">{children}</div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
