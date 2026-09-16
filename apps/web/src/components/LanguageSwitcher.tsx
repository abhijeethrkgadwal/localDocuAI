import { useLocation, useNavigate } from 'react-router-dom';
import {
  LOCALE_CODES,
  LOCALES,
  stripLocale,
  useLocale,
  withLocale,
  writeStoredLocale,
  type LocaleCode,
} from '../i18n';

export function LanguageSwitcher() {
  const { locale, t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();

  const onChange = (next: LocaleCode) => {
    if (next === locale) return;
    writeStoredLocale(next);
    const bare = stripLocale(location.pathname);
    const target = withLocale(bare, next);
    navigate(
      { pathname: target, search: location.search, hash: location.hash },
      { replace: true },
    );
  };

  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      <span className="sr-only">{t('common.language.label')}</span>
      <select
        className="max-w-[9.5rem] rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1 text-xs text-[var(--text-primary)]"
        value={locale}
        aria-label={t('common.language.aria')}
        onChange={(e) => onChange(e.target.value as LocaleCode)}
      >
        {LOCALE_CODES.map((code) => (
          <option key={code} value={code}>
            {LOCALES[code].nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
