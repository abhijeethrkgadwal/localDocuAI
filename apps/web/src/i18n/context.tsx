import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { flattenCatalog, getEnglishCatalog, loadCatalog, type Catalog } from './catalog';
import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from './locales';
import { writeStoredLocale } from './storage';
import { translate, type TranslateFn, type TranslateVars } from './translate';

interface LocaleContextValue {
  locale: LocaleCode;
  ready: boolean;
  setLocale: (locale: LocaleCode) => void;
  t: TranslateFn;
  catalog: Catalog;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const enFlat = flattenCatalog(getEnglishCatalog());

/** Module-level translator for non-React code (workflows). Updated by LocaleProvider. */
let activeTranslate: TranslateFn = (key, vars) => translate(enFlat, enFlat, key, vars);

export function getT(): TranslateFn {
  return activeTranslate;
}

export function t(key: string, vars?: TranslateVars): string {
  return activeTranslate(key, vars);
}

function applyDocumentLang(locale: LocaleCode): void {
  const info = LOCALES[locale];
  document.documentElement.lang = info.bcp47;
  document.documentElement.dir = info.isRtl ? 'rtl' : 'ltr';
}

export function LocaleProvider({
  locale,
  children,
}: {
  locale: LocaleCode;
  children: ReactNode;
}) {
  const [catalog, setCatalog] = useState<Catalog>(() =>
    locale === DEFAULT_LOCALE ? getEnglishCatalog() : getEnglishCatalog(),
  );
  const [ready, setReady] = useState(locale === DEFAULT_LOCALE);

  useEffect(() => {
    let cancelled = false;
    setReady(locale === DEFAULT_LOCALE);
    applyDocumentLang(locale);
    writeStoredLocale(locale);

    void loadCatalog(locale).then((loaded) => {
      if (cancelled) return;
      setCatalog(loaded);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const flat = useMemo(() => flattenCatalog(catalog), [catalog]);

  const tFn = useCallback<TranslateFn>(
    (key, vars) => translate(flat, enFlat, key, vars),
    [flat],
  );

  useEffect(() => {
    activeTranslate = tFn;
    return () => {
      activeTranslate = (key, vars) => translate(enFlat, enFlat, key, vars);
    };
  }, [tFn]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      ready,
      setLocale: () => {
        /* setLocale is driven by URL navigation via LocaleRoute */
      },
      t: tFn,
      catalog,
    }),
    [locale, ready, tFn, catalog],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

export function useT(): TranslateFn {
  return useLocale().t;
}
