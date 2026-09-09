import { useT } from '../i18n';

interface PrivacyStatusProps {
  filesOnDevice: number;
  processingLocation: string;
  cloudDocumentProcessing: string;
  aiProcessing: string;
}

/** Compact privacy indicators (used by TrustStatusStrip; kept for reuse). */
export function PrivacyStatus({
  filesOnDevice,
  processingLocation,
  cloudDocumentProcessing,
  aiProcessing,
}: PrivacyStatusProps) {
  const t = useT();

  return (
    <aside className="flex flex-wrap gap-2" aria-label={t('common.privacyStatus.aria')}>
      <span className="status-pill">
        <span
          className="status-dot"
          style={{ backgroundColor: 'var(--accent)' }}
          aria-hidden
        />
        {t('common.privacyStatus.localProcessing')}
      </span>
      <span className="status-pill">
        {t('common.privacyStatus.cloudProcessing', { status: cloudDocumentProcessing })}
      </span>
      <span className="status-pill">
        {t('common.privacyStatus.localDocuAi', { status: aiProcessing.split(' ')[0] ?? '' })}
      </span>
      <span className="sr-only">
        {t('common.privacyStatus.srOnly', {
          count: filesOnDevice,
          processingLocation,
          cloudDocumentProcessing,
          aiProcessing,
        })}
      </span>
    </aside>
  );
}
