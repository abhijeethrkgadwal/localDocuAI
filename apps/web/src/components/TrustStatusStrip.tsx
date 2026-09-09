import { useId, useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useT } from '../i18n';

interface TrustStatusStripProps {
  filesOnDevice: number;
}

export function TrustStatusStrip({ filesOnDevice }: TrustStatusStripProps) {
  const t = useT();
  const online = useOnlineStatus();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();

  return (
    <section aria-label={t('common.trust.ariaNetworkPrivacy')} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="status-pill"
          aria-label={online ? t('common.trust.ariaNetworkOnline') : t('common.trust.ariaNetworkOffline')}
        >
          <span
            className="status-dot"
            style={{
              backgroundColor: online ? 'var(--status-online)' : 'var(--status-offline)',
            }}
            aria-hidden
          />
          {online ? t('common.trust.browserOnline') : t('common.trust.offline')}
        </span>

        <span className="status-pill" aria-label={t('common.trust.ariaLocalProcessing')}>
          <span
            className="status-dot"
            style={{ backgroundColor: 'var(--accent)' }}
            aria-hidden
          />
          {t('common.trust.localProcessing')}
        </span>

        <span className="status-pill" aria-label={t('common.trust.ariaCloudOff')}>
          {t('common.trust.cloudProcessingOff')}
        </span>

        <span className="status-pill" aria-label={t('common.trust.ariaAiOff')}>
          {t('common.trust.localDocuAiOff')}
        </span>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          {t('common.trust.details')}
        </button>
      </div>

      {!online ? (
        <p
          className="rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]"
          role="status"
          aria-live="polite"
        >
          <span className="font-medium text-[var(--text-primary)]">
            {t('common.trust.offlineBannerTitle')}
          </span>{' '}
          {t('common.trust.offlineBannerBody')}
        </p>
      ) : null}

      <div
        id={detailsId}
        hidden={!detailsOpen}
        className="rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]"
      >
        {detailsOpen ? (
          <>
            <p className="font-medium text-[var(--text-primary)]">
              {online
                ? t('common.trust.detailsOnlineTitle')
                : t('common.trust.detailsOfflineTitle')}
            </p>
            <p className="mt-1">
              {online
                ? t('common.trust.detailsOnlineBody')
                : t('common.trust.detailsOfflineBody')}
            </p>
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              <li>{t('common.trust.filesInSession', { count: filesOnDevice })}</li>
              <li>{t('common.trust.contentsProcessedLocally')}</li>
              <li>{t('common.trust.cloudDocumentProcessingOff')}</li>
              <li>{t('common.trust.localDocuAiOffDetail')}</li>
            </ul>
            <p className="mt-3 text-xs text-[var(--text-tertiary)]">
              {t('common.trust.notUploadedFootnote')}
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
