import { Link, type LinkProps } from 'react-router-dom';
import { useLocale, withLocale } from '../i18n';

/**
 * Link that prefixes `to` with the active locale (English stays unprefixed).
 * External `to` values that are already absolute or start with http are passed through.
 */
export function LocalizedLink({ to, ...rest }: LinkProps) {
  const { locale } = useLocale();
  const localized =
    typeof to === 'string'
      ? to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:')
        ? to
        : withLocale(to, locale)
      : to;

  return <Link to={localized} {...rest} />;
}

export function useLocalizedPath() {
  const { locale } = useLocale();
  return (path: string) => withLocale(path, locale);
}
