import type { ReactNode } from 'react';
import {
  GITHUB_URL,
  LINKEDIN_URL,
  PORTFOLIO_URL,
  SITE,
  SITE_PATHS,
  SUPPORT_URL,
} from '../lib/siteConfig';
import { useT } from '../i18n';
import { BrandMark } from './BrandMark';
import { LocalizedLink } from './LocalizedLink';

const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;

const footLinkClass =
  'text-[var(--text-secondary)] underline-offset-2 transition-colors hover:text-[var(--accent)] hover:underline active:text-[var(--accent)]';

function ExtLink({
  href,
  children,
  'aria-label': ariaLabel,
  className,
}: {
  href: string;
  children: ReactNode;
  'aria-label'?: string;
  className?: string;
}) {
  const t = useT();
  return (
    <a
      className={className ?? footLinkClass}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
    >
      {children}
      {!ariaLabel ? <span className="sr-only">{t('common.nav.opensInNewTab')}</span> : null}
    </a>
  );
}

function FootLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <LocalizedLink className={footLinkClass} to={to}>
      {children}
    </LocalizedLink>
  );
}

function LinkedInIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="shrink-0"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 010 18" />
      <path d="M12 3a15 15 0 000 18" />
    </svg>
  );
}

const iconLinkClass =
  'inline-flex items-center justify-center rounded-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)] active:text-[var(--accent)]';

export function SiteFooter() {
  const t = useT();
  const showApacheLicense = SITE.license === 'Apache-2.0';

  return (
    <footer className="border-t border-[var(--border)] pt-8 pb-4 text-sm text-[var(--text-tertiary)]">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <p className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            <BrandMark />
          </p>
          <p className="text-[var(--text-secondary)]">{t('common.footer.tagline')}</p>
          <p>{t('common.footer.controlLine')}</p>
          {showApacheLicense ? (
            <p className="text-xs leading-relaxed">
              {t('common.footer.licensedUnder')}{' '}
              <ExtLink href={LICENSE_URL}>{t('common.footer.apache20')}</ExtLink>.
              <br />
              {t('common.footer.developedInOpen')}
            </p>
          ) : (
            <p className="text-xs">{t('common.footer.developedInOpen')}</p>
          )}
        </div>

        <nav aria-label={t('common.footer.ariaProduct')} className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.12em] text-[var(--text-secondary)] uppercase">
            {t('common.footer.product')}
          </p>
          <ul className="space-y-1.5">
            <li>
              <FootLink to={SITE_PATHS.home}>{t('common.footer.openLocalDocu')}</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.pdfTools}>{t('common.footer.pdfTools')}</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.mergePdf}>{t('common.footer.mergePdf')}</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.compressPdf}>{t('common.footer.compressPdf')}</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.mergeDocx}>{t('common.footer.mergeDocx')}</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.docxToPdf}>{t('common.footer.docxToPdf')}</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.howItWorks}>{t('common.footer.howItWorks')}</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.browserSupport}>{t('common.footer.browserSupport')}</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.privacy}>{t('common.footer.privacy')}</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.faq}>{t('common.footer.faq')}</FootLink>
            </li>
          </ul>
        </nav>

        <nav aria-label={t('common.footer.ariaOpenSource')} className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.12em] text-[var(--text-secondary)] uppercase">
            {t('common.footer.openSource')}
          </p>
          <ul className="space-y-1.5">
            <li>
              <ExtLink href={GITHUB_URL}>{t('common.footer.github')}</ExtLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.contribute}>{t('common.footer.contribute')}</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.roadmap}>{t('common.footer.roadmap')}</FootLink>
            </li>
            <li>
              <ExtLink href={LICENSE_URL}>{t('common.footer.license')}</ExtLink>
            </li>
          </ul>
        </nav>

        <div className="space-y-6">
          <nav aria-label={t('common.footer.ariaFuture')} className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--text-secondary)] uppercase">
              {t('common.footer.future')}
            </p>
            <ul className="space-y-1.5">
              <li>
                <FootLink to={SITE_PATHS.desktop}>{t('common.footer.desktop')}</FootLink>
              </li>
              <li>
                <FootLink to={SITE_PATHS.localAi}>{t('common.footer.localAi')}</FootLink>
              </li>
            </ul>
          </nav>

          <nav aria-label={t('common.footer.ariaSupport')} className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--text-secondary)] uppercase">
              {t('common.footer.support')}
            </p>
            <ul className="space-y-1.5">
              {SUPPORT_URL ? (
                <>
                  <li>
                    <ExtLink href={SUPPORT_URL}>{t('common.footer.supportTheProject')}</ExtLink>
                  </li>
                  <li>
                    <ExtLink href={SUPPORT_URL}>{t('common.footer.sponsorLocalDocu')}</ExtLink>
                  </li>
                </>
              ) : (
                <li>
                  <span className="text-[var(--text-tertiary)]">
                    {t('common.footer.supportTheProject')}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--text-tertiary)] opacity-90">
                    {t('common.footer.sponsorshipComingSoon')}
                  </span>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>

      <div className="mt-8 space-y-1 border-t border-[var(--border)] pt-5 text-xs">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{t('common.footer.createdBy')}</span>
          {LINKEDIN_URL ? (
            <>
              <span aria-hidden="true">·</span>
              <ExtLink
                href={LINKEDIN_URL}
                aria-label={t('common.footer.ariaLinkedIn')}
                className={iconLinkClass}
              >
                <LinkedInIcon />
              </ExtLink>
            </>
          ) : null}
          {PORTFOLIO_URL ? (
            <>
              <span aria-hidden="true">·</span>
              <ExtLink
                href={PORTFOLIO_URL}
                aria-label={t('common.footer.ariaPortfolio')}
                className={iconLinkClass}
              >
                <PortfolioIcon />
              </ExtLink>
            </>
          ) : null}
        </p>
        <p>{t('common.footer.communityContributions')}</p>
        <p className="pt-2 text-[var(--text-tertiary)] opacity-90">
          {t('common.footer.processingStatusLine')}
        </p>
      </div>
    </footer>
  );
}
