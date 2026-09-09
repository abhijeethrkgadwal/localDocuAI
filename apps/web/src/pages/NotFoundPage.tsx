import { useEffect } from 'react';
import { PublicPageShell } from '../components/PublicPageShell';
import { LocalizedLink } from '../components/LocalizedLink';
import { applyDocumentMeta, getRouteMeta } from '../lib/routeMeta';
import { SITE_PATHS } from '../lib/siteConfig';
import { useLocale, useT } from '../i18n';

export function NotFoundPage() {
  const t = useT();
  const { locale } = useLocale();
  const meta = getRouteMeta('/404', locale, t);

  useEffect(() => {
    applyDocumentMeta(meta, locale);
  }, [meta, locale]);

  return (
    <PublicPageShell meta={meta} showCta>
      <p>{t('common.notFound.bodyFull')}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
        <li>
          <LocalizedLink
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            to={SITE_PATHS.home}
          >
            {t('common.notFound.workspace')}
          </LocalizedLink>
        </li>
        <li>
          <LocalizedLink
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            to={SITE_PATHS.faq}
          >
            {t('common.notFound.faq')}
          </LocalizedLink>
        </li>
        <li>
          <LocalizedLink
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            to={SITE_PATHS.howItWorks}
          >
            {t('common.notFound.howItWorks')}
          </LocalizedLink>
        </li>
        <li>
          <LocalizedLink
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            to={SITE_PATHS.browserSupport}
          >
            {t('common.notFound.browserSupport')}
          </LocalizedLink>
        </li>
        <li>
          <LocalizedLink
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            to={SITE_PATHS.privacy}
          >
            {t('common.notFound.privacy')}
          </LocalizedLink>
        </li>
      </ul>
    </PublicPageShell>
  );
}
