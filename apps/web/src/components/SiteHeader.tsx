import { Link } from 'react-router-dom';
import { GITHUB_URL, SITE, SITE_PATHS } from '../lib/siteConfig';
import { ThemeToggle } from './ThemeToggle';
import type { ThemePreference } from '../hooks/useTheme';

interface SiteHeaderProps {
  preference: ThemePreference;
  onThemeChange: (next: ThemePreference) => void;
  /** When true, brand focuses main content (workspace). Otherwise links home. */
  workspace?: boolean;
}

export function SiteHeader({ preference, onThemeChange, workspace = false }: SiteHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text-tertiary)] uppercase">
        {workspace ? (
          <a href="#main-content" className="brand-mark">
            {SITE.brandMark}
          </a>
        ) : (
          <Link to={SITE_PATHS.home} className="brand-mark">
            {SITE.brandMark}
          </Link>
        )}
      </p>
      <nav className="flex flex-wrap items-center gap-3" aria-label="Primary">
        <Link
          className="text-xs font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline"
          to={SITE_PATHS.faq}
        >
          FAQ
        </Link>
        <Link
          className="text-xs font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline"
          to={SITE_PATHS.privacy}
        >
          Privacy
        </Link>
        <a
          className="text-xs font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <ThemeToggle preference={preference} onChange={onThemeChange} />
      </nav>
    </div>
  );
}
