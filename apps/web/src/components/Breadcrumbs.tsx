import type { RouteMeta } from '../lib/routeMeta';
import { SITE_PATHS } from '../lib/siteConfig';
import { useT } from '../i18n';
import { LocalizedLink } from './LocalizedLink';

interface BreadcrumbsProps {
  items: NonNullable<RouteMeta['breadcrumbs']>;
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const t = useT();
  if (!items.length) return null;
  return (
    <nav aria-label={t('common.breadcrumbs.aria')} className="text-xs text-[var(--text-tertiary)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <LocalizedLink className="underline-offset-2 hover:underline" to={SITE_PATHS.home}>
            {t('common.breadcrumbs.home')}
          </LocalizedLink>
        </li>
        {items.map((item) => (
          <li key={item.path} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            <LocalizedLink
              className="underline-offset-2 hover:underline"
              to={item.path}
              aria-current="page"
            >
              {item.name}
            </LocalizedLink>
          </li>
        ))}
      </ol>
    </nav>
  );
}
