import { Link } from 'react-router-dom';
import type { RouteMeta } from '../lib/routeMeta';
import { SITE_PATHS } from '../lib/siteConfig';

interface BreadcrumbsProps {
  items: NonNullable<RouteMeta['breadcrumbs']>;
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-[var(--text-tertiary)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link className="underline-offset-2 hover:underline" to={SITE_PATHS.home}>
            Home
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.path} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            <Link className="underline-offset-2 hover:underline" to={item.path} aria-current="page">
              {item.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
