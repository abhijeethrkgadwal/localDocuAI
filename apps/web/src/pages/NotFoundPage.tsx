import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { PublicPageShell } from '../components/PublicPageShell';
import { NOT_FOUND_META, applyDocumentMeta } from '../lib/routeMeta';
import { SITE_PATHS } from '../lib/siteConfig';

export function NotFoundPage() {
  useEffect(() => {
    applyDocumentMeta(NOT_FOUND_META);
  }, []);

  return (
    <PublicPageShell meta={NOT_FOUND_META} showCta>
      <p>That address is not a LocalDocu page.</p>
      <p>
        Return to the{' '}
        <Link className="font-medium text-[var(--accent)] underline-offset-2 hover:underline" to={SITE_PATHS.home}>
          workspace
        </Link>{' '}
        or browse{' '}
        <Link className="font-medium text-[var(--accent)] underline-offset-2 hover:underline" to={SITE_PATHS.faq}>
          FAQ
        </Link>
        ,{' '}
        <Link
          className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          to={SITE_PATHS.howItWorks}
        >
          how it works
        </Link>
        , or{' '}
        <Link
          className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          to={SITE_PATHS.privacy}
        >
          privacy
        </Link>
        .
      </p>
    </PublicPageShell>
  );
}
