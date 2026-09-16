import { useEffect, useId, useRef, useState } from 'react';
import { GITHUB_URL, SITE_PATHS } from '../lib/siteConfig';
import { useT } from '../i18n';
import { BrandMark } from './BrandMark';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LocalizedLink } from './LocalizedLink';
import { ThemeToggle } from './ThemeToggle';
import type { ThemePreference } from '../hooks/useTheme';

const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;

interface SiteHeaderProps {
  preference: ThemePreference;
  onThemeChange: (next: ThemePreference) => void;
  /** When true, brand focuses main content (workspace). Otherwise links home. */
  workspace?: boolean;
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const desktopLinkClass =
  'text-xs font-medium text-[var(--text-secondary)] underline-offset-2 hover:underline';

const mobileLinkClass =
  'block rounded-[var(--radius-control)] px-2 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]';

const sectionLabelClass =
  'text-xs font-semibold tracking-[0.12em] text-[var(--text-tertiary)] uppercase';

export function SiteHeader({ preference, onThemeChange, workspace = false }: SiteHeaderProps) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        closeMenu();
      }
    };

    const onResize = () => {
      if (window.matchMedia('(min-width: 768px)').matches) closeMenu();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  const brand = workspace ? (
    <a href="#main-content" className="brand-mark" translate="no" aria-label="LocalDocu">
      <BrandMark priority />
    </a>
  ) : (
    <LocalizedLink
      to={SITE_PATHS.home}
      className="brand-mark"
      translate="no"
      aria-label="LocalDocu"
      onClick={closeMenu}
    >
      <BrandMark priority />
    </LocalizedLink>
  );

  return (
    <div ref={rootRef} className="site-header relative">
      <div className="site-header-bar relative z-30 flex min-h-14 items-center justify-between gap-3 md:min-h-0 md:flex-wrap md:items-start">
        <div className="flex min-h-8 shrink-0 items-center">{brand}</div>

        <nav
          className="hidden flex-wrap items-center gap-3 md:flex"
          aria-label={t('common.nav.ariaPrimary')}
        >
          <LocalizedLink className={desktopLinkClass} to={SITE_PATHS.faq}>
            {t('common.nav.faq')}
          </LocalizedLink>
          <LocalizedLink className={desktopLinkClass} to={SITE_PATHS.privacy}>
            {t('common.nav.privacy')}
          </LocalizedLink>
          <a
            className={desktopLinkClass}
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

        <button
          type="button"
          className="site-header-menu-btn inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-subtle)] md:hidden"
          aria-label={menuOpen ? t('common.nav.closeMenu') : t('common.nav.openMenu')}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div
        id={menuId}
        className={`site-header-menu md:hidden ${menuOpen ? 'is-open' : ''}`}
        aria-hidden={!menuOpen}
        {...(!menuOpen ? { inert: true } : {})}
      >
        <nav className="site-header-menu-panel" aria-label={t('common.nav.menuHeading')}>
          <p className={`${sectionLabelClass} mb-3`}>{t('common.nav.menuHeading')}</p>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <p className={sectionLabelClass}>{t('common.footer.product')}</p>
              <ul className="space-y-0.5">
                <li>
                  <LocalizedLink
                    className={mobileLinkClass}
                    to={SITE_PATHS.howItWorks}
                    onClick={closeMenu}
                  >
                    {t('common.footer.howItWorks')}
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    className={mobileLinkClass}
                    to={SITE_PATHS.pdfTools}
                    onClick={closeMenu}
                  >
                    {t('common.footer.pdfTools')}
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink className={mobileLinkClass} to={SITE_PATHS.faq} onClick={closeMenu}>
                    {t('common.footer.faq')}
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    className={mobileLinkClass}
                    to={SITE_PATHS.privacy}
                    onClick={closeMenu}
                  >
                    {t('common.footer.privacy')}
                  </LocalizedLink>
                </li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <p className={sectionLabelClass}>{t('common.footer.openSource')}</p>
              <ul className="space-y-0.5">
                <li>
                  <a
                    className={mobileLinkClass}
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                  >
                    {t('common.footer.github')}
                    <span className="sr-only">{t('common.nav.opensInNewTab')}</span>
                  </a>
                </li>
                <li>
                  <LocalizedLink
                    className={mobileLinkClass}
                    to={SITE_PATHS.contribute}
                    onClick={closeMenu}
                  >
                    {t('common.footer.contribute')}
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    className={mobileLinkClass}
                    to={SITE_PATHS.roadmap}
                    onClick={closeMenu}
                  >
                    {t('common.footer.roadmap')}
                  </LocalizedLink>
                </li>
                <li>
                  <a
                    className={mobileLinkClass}
                    href={LICENSE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                  >
                    {t('common.footer.license')}
                    <span className="sr-only">{t('common.nav.opensInNewTab')}</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <p className={sectionLabelClass}>{t('common.footer.future')}</p>
              <ul className="space-y-0.5">
                <li>
                  <LocalizedLink
                    className={mobileLinkClass}
                    to={SITE_PATHS.desktop}
                    onClick={closeMenu}
                  >
                    {t('common.footer.desktop')}
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    className={mobileLinkClass}
                    to={SITE_PATHS.localAi}
                    onClick={closeMenu}
                  >
                    {t('common.footer.localAi')}
                  </LocalizedLink>
                </li>
              </ul>
            </div>

            <div className="space-y-2 border-t border-[var(--border)] pt-4">
              <p className={sectionLabelClass}>{t('common.language.label')}</p>
              <LanguageSwitcher />
            </div>

            <div className="space-y-2">
              <p className={sectionLabelClass}>{t('common.nav.appearance')}</p>
              <ThemeToggle preference={preference} onChange={onThemeChange} />
            </div>
          </div>
        </nav>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="site-header-backdrop md:hidden"
          aria-label={t('common.nav.closeMenu')}
          onClick={closeMenu}
        />
      ) : null}
    </div>
  );
}
