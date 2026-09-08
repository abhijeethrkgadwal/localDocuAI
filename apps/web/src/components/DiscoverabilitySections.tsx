import { Link } from 'react-router-dom';
import {
  FAQ_ITEMS,
  FAQ_SUBTITLE,
  HOW_IT_WORKS_STEPS,
  PRODUCT_SUMMARY,
  WHY_LOCAL_MATTERS,
} from '../lib/seoContent';
import { SITE_PATHS } from '../lib/siteConfig';

/** Visible below-the-fold sections on the homepage workspace. */
export function DiscoverabilitySections() {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <section id="how-it-works" className="panel" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="panel-title">
          How LocalDocu works
        </h2>
        <p className="panel-desc">{PRODUCT_SUMMARY}</p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-[var(--text-secondary)]">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <li key={step.name}>
              <span className="font-medium text-[var(--text-primary)]">{step.name}.</span>{' '}
              {step.text}
            </li>
          ))}
        </ol>
        <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
          <h3 className="font-medium text-[var(--text-primary)]">{WHY_LOCAL_MATTERS.title}</h3>
          <ul className="list-disc space-y-1 pl-5">
            {WHY_LOCAL_MATTERS.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-sm">
          <Link
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            to={SITE_PATHS.howItWorks}
          >
            Full how-it-works page
          </Link>
        </p>
      </section>

      <section id="privacy" className="panel" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="panel-title">
          Privacy by design
        </h2>
        <p className="panel-desc">
          Document contents are processed on this device. Document files are not uploaded to
          LocalDocu for processing. The current release has no authentication, no document-upload
          backend, and no LocalDocu AI pipeline. Status indicators show local processing, cloud
          processing off, and LocalDocu AI off.
        </p>
        <p className="mt-3 text-sm">
          <Link
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            to={SITE_PATHS.privacy}
          >
            Privacy details
          </Link>
        </p>
      </section>

      <section id="faq" className="panel" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="panel-title">
          Frequently asked questions
        </h2>
        <p className="panel-desc mb-4">{FAQ_SUBTITLE}</p>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.id}
              id={item.id}
              className="rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3"
            >
              <summary className="cursor-pointer font-medium text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
                {item.question}
              </summary>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-sm">
          <Link
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            to={SITE_PATHS.faq}
          >
            Open FAQ page
          </Link>
        </p>
      </section>
    </div>
  );
}
