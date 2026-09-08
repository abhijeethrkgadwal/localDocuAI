import { Link } from 'react-router-dom';
import { SITE_PATHS } from '../lib/siteConfig';

interface OpenLocalDocuCtaProps {
  className?: string;
}

export function OpenLocalDocuCta({ className = '' }: OpenLocalDocuCtaProps) {
  return (
    <p className={className}>
      <Link to={SITE_PATHS.home} className="btn btn-primary inline-flex">
        Open LocalDocu
      </Link>
    </p>
  );
}
