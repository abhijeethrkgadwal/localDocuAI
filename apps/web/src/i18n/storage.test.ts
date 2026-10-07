import { describe, expect, it } from 'vitest';
import {
  isCrawlerUserAgent,
  localeFromNavigator,
  resolvePreferredLocale,
} from './storage';

describe('localeFromNavigator', () => {
  it('defaults to English when the list is empty', () => {
    expect(localeFromNavigator([])).toBe('en');
  });

  it('uses the primary subtag so regional English stays English', () => {
    expect(localeFromNavigator(['en-IN'])).toBe('en');
    expect(localeFromNavigator(['en-US'])).toBe('en');
    expect(localeFromNavigator(['en-DE'])).toBe('en');
  });

  it('does not treat a later German tag as the default', () => {
    expect(localeFromNavigator(['en-US', 'en', 'de-DE', 'de'])).toBe('en');
  });

  it('maps supported non-English tags', () => {
    expect(localeFromNavigator(['de-DE'])).toBe('de');
    expect(localeFromNavigator(['pt-BR'])).toBe('pt');
    expect(localeFromNavigator(['zh-CN'])).toBe('zh');
    expect(localeFromNavigator(['hi'])).toBe('hi');
  });

  it('picks the first matching language in browser order', () => {
    expect(localeFromNavigator(['de', 'en'])).toBe('de');
    expect(localeFromNavigator(['fr-CA', 'en-US'])).toBe('fr');
  });

  it('skips unknown tags until a supported locale appears', () => {
    expect(localeFromNavigator(['sv-SE', 'fi', 'es-MX'])).toBe('es');
  });
});

describe('resolvePreferredLocale', () => {
  it('keeps the URL locale for crawlers so localized pages stay indexable', () => {
    expect(
      resolvePreferredLocale('de', {
        userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)',
        languages: ['en-US'],
        stored: null,
      }),
    ).toBe('de');
  });

  it('honors an explicit switcher choice over the browser and the URL', () => {
    expect(
      resolvePreferredLocale('en', {
        userAgent: 'Mozilla/5.0 Chrome/120',
        languages: ['en-US'],
        stored: 'de',
      }),
    ).toBe('de');
  });

  it('uses the browser language when there is no switcher choice', () => {
    expect(
      resolvePreferredLocale('de', {
        userAgent: 'Mozilla/5.0 Chrome/120',
        languages: ['en-IN', 'en'],
        stored: null,
      }),
    ).toBe('en');
    expect(
      resolvePreferredLocale('en', {
        userAgent: 'Mozilla/5.0 Chrome/120',
        languages: ['de-DE', 'de'],
        stored: null,
      }),
    ).toBe('de');
  });
});

describe('isCrawlerUserAgent', () => {
  it('detects common crawlers', () => {
    expect(isCrawlerUserAgent('Googlebot/2.1')).toBe(true);
    expect(isCrawlerUserAgent('Mozilla/5.0 Chrome/120.0.0.0')).toBe(false);
  });
});
