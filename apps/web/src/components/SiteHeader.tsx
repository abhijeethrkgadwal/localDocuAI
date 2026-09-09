import { GITHUB_URL, SITE, SITE_PATHS } from '../lib/siteConfig';
import { useT } from '../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LocalizedLink } from './LocalizedLink';
import { ThemeToggle } from './ThemeToggle';
import type { ThemePreference } from '../hooks/useTheme';

interface SiteHeaderProps {
  preference: ThemePreference;
  onThemeChange: (next: ThemePreference) => void;
  /** When true, brand focuses main content (workspace). Otherwise links home. */
  workspace?: boolean;
}

export function SiteHeader({ preference, onThemeChange, workspace = false }: SiteHeaderProps) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text-tertiary)] uppercase">
        {workspace ? (
          <a href="#main-content" className="brand-mark" translate="no">
            {SITE.brandMark}
          </a>
        ) : (
          <LocalizedLink to={SITE_PATHS.home} className="brand-mark" translate="no">
            {SITE.brandMark}
          </LocalizedLink>
        )}
      </p>
      <nav className="flex flex-wrap items-center gap-3" aria-label={t('common.nav.ariaPrimary')}>
        <LocalizedLink
          className="text-xs font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline"
          to={SITE_PATHS.faq}
        >
          {t('common.nav.faq')}
        </LocalizedLink>
        <LocalizedLink
          className="text-xs font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline"
          to={SITE_PATHS.privacy}
        >
          {t('common.nav.privacy')}
        </LocalizedLink>
        <a
          className="text-xs font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('common.nav.github')}
          <span className="sr-only">{t('common.nav.opensInNewTab')}</span>
        </a>
        <LanguageSwitcher />
        <ThemeToggle preference={preference} onChange={onThemeChange} />
      </nav>
    </div>
  );
}
