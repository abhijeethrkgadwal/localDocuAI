import { SITE_PATHS } from '../lib/siteConfig';
import { useT } from '../i18n';
import { LocalizedLink } from './LocalizedLink';

interface OpenLocalDocuCtaProps {
  className?: string;
}

export function OpenLocalDocuCta({ className = '' }: OpenLocalDocuCtaProps) {
  const t = useT();

  return (
    <p className={className}>
      <LocalizedLink to={SITE_PATHS.home} className="btn btn-primary inline-flex">
        {t('common.cta.openLocalDocu')}
      </LocalizedLink>
    </p>
  );
}
