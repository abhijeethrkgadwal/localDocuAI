import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  GITHUB_URL,
  LINKEDIN_URL,
  PORTFOLIO_URL,
  SITE,
  SITE_PATHS,
  SUPPORT_URL,
} from '../lib/siteConfig';

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      className="underline-offset-2 hover:underline"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function FootLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="underline-offset-2 hover:underline" to={to}>
      {children}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] pt-8 pb-4 text-sm text-[var(--text-tertiary)]">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text-secondary)] uppercase">
            {SITE.brandMark}
          </p>
          <p className="text-[var(--text-secondary)]">{SITE.supportingMessage}</p>
          <p>Your files. Your device. Your control.</p>
          <p className="text-xs">
            Licensed under {SITE.license}. Developed in the open.
          </p>
        </div>

        <nav aria-label="Product links" className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
            Product
          </p>
          <ul className="space-y-1.5">
            <li>
              <FootLink to={SITE_PATHS.home}>Open LocalDocu</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.howItWorks}>How it works</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.pdfTools}>PDF tools</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.mergePdf}>Merge PDF</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.mergeDocx}>Merge DOCX</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.docxToPdf}>DOCX to PDF</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.offline}>Offline</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.privacy}>Privacy</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.faq}>FAQ</FootLink>
            </li>
          </ul>
        </nav>

        <nav aria-label="Open source links" className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
            Open source
          </p>
          <ul className="space-y-1.5">
            <li>
              <ExtLink href={GITHUB_URL}>GitHub</ExtLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.contribute}>Contribute</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.roadmap}>Roadmap</FootLink>
            </li>
            <li>
              <FootLink to={SITE_PATHS.openSource}>Open source</FootLink>
            </li>
          </ul>
        </nav>

        <div className="space-y-6">
          <nav aria-label="Future links" className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
              Future
            </p>
            <ul className="space-y-1.5">
              <li>
                <FootLink to={SITE_PATHS.desktop}>Desktop</FootLink>
              </li>
              <li>
                <FootLink to={SITE_PATHS.localAi}>LocalDocu AI</FootLink>
              </li>
            </ul>
          </nav>

          <nav aria-label="Support links" className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
              Support
            </p>
            <ul className="space-y-1.5">
              <li>
                {SUPPORT_URL ? (
                  <ExtLink href={SUPPORT_URL}>Support the project</ExtLink>
                ) : (
                  <span title="Support link will appear when funding is configured">
                    Support the project
                    <span className="block text-xs opacity-80">
                      Coming when sponsorship is set up.
                    </span>
                  </span>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="mt-8 space-y-1 border-t border-[var(--border)] pt-5 text-xs">
        <p>
          Created and maintained by {SITE.creatorName}
          {LINKEDIN_URL ? (
            <>
              {' · '}
              <ExtLink href={LINKEDIN_URL}>LinkedIn</ExtLink>
            </>
          ) : null}
          {PORTFOLIO_URL ? (
            <>
              {' · '}
              <ExtLink href={PORTFOLIO_URL}>Portfolio</ExtLink>
            </>
          ) : null}
        </p>
        <p>with contributions from the community.</p>
        <p className="pt-2 text-[var(--text-tertiary)]">
          Cloud processing: Off · LocalDocu AI: Off
        </p>
      </div>
    </footer>
  );
}
