import { DEFAULT_LOCALE, isPrefixedLocale, type LocaleCode } from './locales';

/** Normalize trailing slash (except root). */
export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname || '/';
}

/**
 * Detect locale from the first path segment.
 * English has no prefix — `/merge-pdf` → en; `/es/merge-pdf` → es.
 */
export function detectLocaleFromPath(pathname: string): LocaleCode {
  const normalized = normalizePathname(pathname);
  const segment = normalized.split('/').filter(Boolean)[0];
  if (segment && isPrefixedLocale(segment)) return segment;
  return DEFAULT_LOCALE;
}

/** Strip a leading locale prefix; returns English (unprefixed) path. */
export function stripLocale(pathname: string): string {
  const normalized = normalizePathname(pathname);
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  if (isPrefixedLocale(parts[0]!)) {
    const rest = parts.slice(1);
    return rest.length === 0 ? '/' : `/${rest.join('/')}`;
  }
  return normalized;
}

/**
 * Prefix path with locale when not English.
 * `withLocale('/merge-pdf', 'es')` → `/es/merge-pdf`
 * `withLocale('/merge-pdf', 'en')` → `/merge-pdf`
 */
export function withLocale(path: string, locale: LocaleCode): string {
  const base = stripLocale(path);
  if (locale === DEFAULT_LOCALE) return base;
  if (base === '/') return `/${locale}`;
  return `/${locale}${base}`;
}
