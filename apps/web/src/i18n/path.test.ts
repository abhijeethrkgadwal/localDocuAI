import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  detectLocaleFromPath,
  getEnglishCatalog,
  isPrefixedLocale,
  stripLocale,
  translate,
  withLocale,
} from './index';
import { flattenCatalog } from './catalog';

describe('i18n path helpers', () => {
  it('detects locale from prefixed paths', () => {
    expect(detectLocaleFromPath('/')).toBe('en');
    expect(detectLocaleFromPath('/merge-pdf')).toBe('en');
    expect(detectLocaleFromPath('/es')).toBe('es');
    expect(detectLocaleFromPath('/es/merge-pdf')).toBe('es');
    expect(detectLocaleFromPath('/hi/faq/')).toBe('hi');
  });

  it('strips and reapplies locale prefixes', () => {
    expect(stripLocale('/es/merge-pdf')).toBe('/merge-pdf');
    expect(stripLocale('/merge-pdf')).toBe('/merge-pdf');
    expect(stripLocale('/ja')).toBe('/');
    expect(withLocale('/merge-pdf', 'en')).toBe('/merge-pdf');
    expect(withLocale('/merge-pdf', 'es')).toBe('/es/merge-pdf');
    expect(withLocale('/', 'zh')).toBe('/zh');
    expect(withLocale('/es/faq', 'de')).toBe('/de/faq');
  });

  it('validates prefixed locales only', () => {
    expect(isPrefixedLocale('es')).toBe(true);
    expect(isPrefixedLocale('en')).toBe(false);
    expect(isPrefixedLocale('xx')).toBe(false);
  });
});

describe('translate fallback', () => {
  it('falls back to English for missing keys', () => {
    const en = flattenCatalog(getEnglishCatalog());
    const empty = {};
    expect(translate(empty, en, 'common.nav.faq')).toBe('FAQ');
    expect(translate(en, en, 'common.site.tagline')).toContain('device');
  });

  it('interpolates variables', () => {
    const en = flattenCatalog(getEnglishCatalog());
    expect(translate(en, en, 'workspace.fileList.nDocuments', { count: 3 })).toBe('3 documents');
  });

  it('returns key when both catalogs miss', () => {
    const en = flattenCatalog(getEnglishCatalog());
    expect(translate(en, en, 'does.not.exist')).toBe('does.not.exist');
  });

  it('defaults to English locale code', () => {
    expect(DEFAULT_LOCALE).toBe('en');
  });
});
