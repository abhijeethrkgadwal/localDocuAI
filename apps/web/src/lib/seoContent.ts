/** Shared copy for visible FAQ + JSON-LD (keep answers identical for AEO/GEO). */

import { getEnglishCatalog } from '../i18n';
import type { MessageTree, TranslateFn } from '../i18n/translate';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/** Catalog keys under pages.faq.items.* (camelCase). */
export const FAQ_ITEM_IDS = [
  'whatIsLocaldocu',
  'areFilesUploaded',
  'worksOffline',
  'supportedFormats',
  'accountRequired',
  'howToMergePdfs',
  'filesAfterFinish',
  'reduceCloudProcessing',
  'isOpenSource',
  'howToContribute',
  'mobileBrowsers',
  'heavyOperations',
  'whatIsLocaldocuAi',
] as const;

export type FaqCatalogKey = (typeof FAQ_ITEM_IDS)[number];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
}

/** camelCase catalog key → kebab-case HTML / JSON-LD id. */
export function faqCatalogKeyToId(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function getFaqItemsFromPages(pages: MessageTree | Record<string, unknown>): FaqItem[] {
  const faq = asRecord((pages as Record<string, unknown>).faq);
  const items = asRecord(faq?.items);
  return FAQ_ITEM_IDS.map((key) => {
    const entry = asRecord(items?.[key]);
    return {
      id: faqCatalogKeyToId(key),
      question: asString(entry?.question) ?? '',
      answer: asString(entry?.answer) ?? '',
    };
  });
}

/** Runtime FAQ for JSON-LD / UI via translator. */
export function getFaqItems(t: TranslateFn): FaqItem[] {
  return FAQ_ITEM_IDS.map((key) => ({
    id: faqCatalogKeyToId(key),
    question: t(`pages.faq.items.${key}.question`),
    answer: t(`pages.faq.items.${key}.answer`),
  }));
}

export function getHowItWorksSteps(
  pages: MessageTree | Record<string, unknown>,
): { name: string; text: string }[] {
  const shared = asRecord((pages as Record<string, unknown>).howItWorksShared);
  const steps = Array.isArray(shared?.steps) ? shared.steps : [];
  return steps
    .map((step) => {
      const row = asRecord(step);
      const name = asString(row?.name);
      const text = asString(row?.text);
      if (!name || !text) return null;
      return { name, text };
    })
    .filter((step): step is { name: string; text: string } => step != null);
}

export function getWhyLocalMatters(pages: MessageTree | Record<string, unknown>): {
  title: string;
  points: string[];
} {
  const shared = asRecord((pages as Record<string, unknown>).howItWorksShared);
  const whyLocal = asRecord(shared?.whyLocal);
  return {
    title: asString(whyLocal?.title) ?? '',
    points: asStringArray(whyLocal?.points),
  };
}

const enPages = getEnglishCatalog().pages as Record<string, unknown>;

/** English constants for vite.seo-plugin and tests. */
export const PRODUCT_SUMMARY = asString(enPages.productSummary) ?? '';

export const HOW_IT_WORKS_STEPS = getHowItWorksSteps(enPages);

export const WHY_LOCAL_MATTERS = getWhyLocalMatters(enPages);

export const FAQ_ITEMS: FaqItem[] = getFaqItemsFromPages(enPages);

export const FAQ_SUBTITLE =
  asString(asRecord(enPages.faq)?.subtitle) ??
  'Common questions about LocalDocu, privacy, supported files, offline use, mobile browsers, and LocalDocu AI.';
