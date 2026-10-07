import { useEffect } from 'react';
import { useLocale, useT, type LocaleCode } from '../i18n';
import { buildJsonLd } from '../lib/jsonLd';
import type { RouteMeta } from '../lib/routeMeta';

export const JSON_LD_ELEMENT_ID = 'ld-json';

/**
 * Keeps the single head JSON-LD script (also emitted by the prerenderer) in sync with the
 * current route, so crawlers and client navigation see the same graph without duplicates.
 */
export function PublicJsonLd({ meta, locale: localeProp }: { meta: RouteMeta; locale?: LocaleCode }) {
  const t = useT();
  const { locale, catalog } = useLocale();
  const activeLocale = localeProp ?? locale;

  useEffect(() => {
    const payload = buildJsonLd({ meta, locale: activeLocale, t, pages: catalog.pages });
    let el = document.getElementById(JSON_LD_ELEMENT_ID) as HTMLScriptElement | null;
    if (!payload) {
      el?.remove();
      return;
    }
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = JSON_LD_ELEMENT_ID;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(payload);
  }, [meta, activeLocale, t, catalog.pages]);

  return null;
}
