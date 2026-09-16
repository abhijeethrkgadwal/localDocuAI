import { DEFAULT_LOCALE, isLocaleCode, type LocaleCode } from './locales';

/** Only written when the user picks a language in the switcher — not on URL visits. */
const CHOSEN_KEY = 'localdocu-locale-chosen';

export function readStoredLocale(): LocaleCode | null {
  try {
    const raw = localStorage.getItem(CHOSEN_KEY);
    if (raw && isLocaleCode(raw)) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredLocale(locale: LocaleCode): void {
  try {
    localStorage.setItem(CHOSEN_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function clearStoredLocale(): void {
  try {
    localStorage.removeItem(CHOSEN_KEY);
    localStorage.removeItem('localdocu-locale');
  } catch {
    /* ignore */
  }
}

export function isCrawlerUserAgent(userAgent: string): boolean {
  return /bot|crawl|spider|slurp|facebookexternalhit|preview|prerender/i.test(userAgent);
}

/**
 * Map browser language tags to a supported locale.
 * Uses the primary subtag only (`en-IN` → en, `en-DE` → en, `pt-BR` → pt).
 * First listed language wins so English-first devices stay on English even if
 * German (or another locale) appears later in the list.
 */
export function localeFromNavigator(languages: readonly string[] = []): LocaleCode {
  for (const raw of languages) {
    if (!raw) continue;
    const primary = raw.toLowerCase().split(/[-_]/)[0];
    if (primary && isLocaleCode(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

function browserLanguages(): string[] {
  if (typeof navigator === 'undefined') return [];
  if (navigator.languages?.length) return [...navigator.languages];
  if (navigator.language) return [navigator.language];
  return [];
}

export interface ResolvePreferredLocaleOptions {
  languages?: readonly string[];
  userAgent?: string;
  stored?: LocaleCode | null;
}

/**
 * Locale for this visitor:
 * 1. Crawlers keep the URL locale (so `/de` stays indexable).
 * 2. An explicit switcher choice wins.
 * 3. Otherwise the browser language list (not the inbound URL — Google and
 *    address-bar autocomplete often land on the wrong prefix).
 */
export function resolvePreferredLocale(
  fromPath: LocaleCode,
  options: ResolvePreferredLocaleOptions = {},
): LocaleCode {
  const ua =
    options.userAgent ?? (typeof navigator === 'undefined' ? '' : navigator.userAgent);
  if (isCrawlerUserAgent(ua)) return fromPath;

  const stored = options.stored !== undefined ? options.stored : readStoredLocale();
  if (stored) return stored;

  return localeFromNavigator(options.languages ?? browserLanguages());
}
