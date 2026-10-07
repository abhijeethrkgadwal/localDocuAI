/**
 * Official LocalDocu lockup.
 *
 * File names describe the *surface* they sit on:
 * - on-light / tagline-on-light → navy + teal (light theme)
 * - on-dark / tagline-on-dark → cream + teal (dark theme)
 *
 * Both theme files stay in the DOM; `html.dark` (and a system-preference
 * fallback) shows the matching mark so the in-app theme toggle stays in sync.
 */
import { BRAND_ASSETS, SITE } from '../lib/siteConfig';

type BrandMarkVariant = 'mark' | 'tagline';

const VARIANT = {
  mark: {
    onLight: BRAND_ASSETS.logoOnLight,
    onDark: BRAND_ASSETS.logoOnDark,
    width: 530,
    height: 101,
  },
  tagline: {
    onLight: BRAND_ASSETS.logoTaglineOnLight,
    onDark: BRAND_ASSETS.logoTaglineOnDark,
    width: 549,
    height: 120,
  },
} as const;

interface BrandMarkProps {
  variant?: BrandMarkVariant;
  className?: string;
  /** Eager-load the header lockup; footer stays lazy. */
  priority?: boolean;
}

export function BrandMark({
  variant = 'mark',
  className = '',
  priority = false,
}: BrandMarkProps) {
  const asset = VARIANT[variant];
  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'low';

  return (
    <span className={`brand-logo brand-logo-${variant} ${className}`.trim()} translate="no">
      <img
        className="brand-logo-img brand-logo-on-light"
        src={asset.onLight}
        alt={SITE.name}
        width={asset.width}
        height={asset.height}
        decoding="async"
        loading={loading}
        fetchPriority={fetchPriority}
      />
      <img
        className="brand-logo-img brand-logo-on-dark"
        src={asset.onDark}
        alt={SITE.name}
        width={asset.width}
        height={asset.height}
        decoding="async"
        loading={loading}
        fetchPriority={fetchPriority}
      />
    </span>
  );
}
