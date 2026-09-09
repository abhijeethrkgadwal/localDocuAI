import { DEFAULT_LOCALE, isLocaleCode, type LocaleCode } from './locales';

const STORAGE_KEY = 'localdocu-locale';

export function readStoredLocale(): LocaleCode | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isLocaleCode(raw)) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredLocale(locale: LocaleCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function clearStoredLocale(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Prefer stored locale; otherwise default (no auto-redirect from navigator). */
export function resolveInitialLocale(fromPath: LocaleCode): LocaleCode {
  if (fromPath !== DEFAULT_LOCALE) return fromPath;
  return readStoredLocale() ?? DEFAULT_LOCALE;
}
