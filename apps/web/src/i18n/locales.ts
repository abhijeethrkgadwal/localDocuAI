/** Supported UI locales. English stays unprefixed in URLs. */

export const LOCALE_CODES = ['en', 'hi', 'es', 'pt', 'de', 'fr', 'ja', 'zh'] as const;

export type LocaleCode = (typeof LOCALE_CODES)[number];

export const DEFAULT_LOCALE: LocaleCode = 'en';

/** Non-default locales that appear as `/:locale/...` URL prefixes. */
export const PREFIXED_LOCALES = LOCALE_CODES.filter((c) => c !== DEFAULT_LOCALE);

export interface LocaleInfo {
  code: LocaleCode;
  /** BCP-47 for html lang / og:locale */
  bcp47: string;
  /** og:locale style (underscore) */
  ogLocale: string;
  /** Native language name for the switcher */
  nativeName: string;
  /** English name for accessibility */
  englishName: string;
  isRtl: boolean;
}

export const LOCALES: Record<LocaleCode, LocaleInfo> = {
  en: {
    code: 'en',
    bcp47: 'en',
    ogLocale: 'en_US',
    nativeName: 'English',
    englishName: 'English',
    isRtl: false,
  },
  hi: {
    code: 'hi',
    bcp47: 'hi',
    ogLocale: 'hi_IN',
    nativeName: 'हिन्दी',
    englishName: 'Hindi',
    isRtl: false,
  },
  es: {
    code: 'es',
    bcp47: 'es',
    ogLocale: 'es',
    nativeName: 'Español',
    englishName: 'Spanish',
    isRtl: false,
  },
  pt: {
    code: 'pt',
    bcp47: 'pt-BR',
    ogLocale: 'pt_BR',
    nativeName: 'Português',
    englishName: 'Portuguese (Brazil)',
    isRtl: false,
  },
  de: {
    code: 'de',
    bcp47: 'de',
    ogLocale: 'de_DE',
    nativeName: 'Deutsch',
    englishName: 'German',
    isRtl: false,
  },
  fr: {
    code: 'fr',
    bcp47: 'fr',
    ogLocale: 'fr_FR',
    nativeName: 'Français',
    englishName: 'French',
    isRtl: false,
  },
  ja: {
    code: 'ja',
    bcp47: 'ja',
    ogLocale: 'ja_JP',
    nativeName: '日本語',
    englishName: 'Japanese',
    isRtl: false,
  },
  zh: {
    code: 'zh',
    bcp47: 'zh-CN',
    ogLocale: 'zh_CN',
    nativeName: '简体中文',
    englishName: 'Chinese (Simplified)',
    isRtl: false,
  },
};

export function isLocaleCode(value: string): value is LocaleCode {
  return (LOCALE_CODES as readonly string[]).includes(value);
}

export function isPrefixedLocale(value: string): value is Exclude<LocaleCode, 'en'> {
  return PREFIXED_LOCALES.includes(value as Exclude<LocaleCode, 'en'>);
}
