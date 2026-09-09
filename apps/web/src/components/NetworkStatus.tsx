import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useT } from '../i18n';

/** Compact network indicator (used by TrustStatusStrip; kept for reuse). */
export function NetworkStatus() {
  const t = useT();
  const online = useOnlineStatus();

  return (
    <aside
      className="status-pill"
      aria-live="polite"
      aria-label={online ? t('common.networkStatus.ariaOnline') : t('common.networkStatus.ariaOffline')}
    >
      <span
        className="status-dot"
        style={{
          backgroundColor: online ? 'var(--status-online)' : 'var(--status-offline)',
        }}
        aria-hidden
      />
      <span>
        <span className="font-medium text-[var(--text-primary)]">
          {online ? t('common.networkStatus.online') : t('common.networkStatus.offline')}
        </span>
        <span className="ml-1 text-[var(--text-tertiary)]">
          {online
            ? t('common.networkStatus.onlineSuffix')
            : t('common.networkStatus.offlineSuffix')}
        </span>
      </span>
    </aside>
  );
}
