import { useOnlineStatus } from '../hooks/useOnlineStatus';

/** Compact network indicator (used by TrustStatusStrip; kept for reuse). */
export function NetworkStatus() {
  const online = useOnlineStatus();

  return (
    <aside
      className="status-pill"
      aria-live="polite"
      aria-label={online ? 'Network: online' : 'Network: offline'}
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
          {online ? 'Online' : 'Offline'}
        </span>
        <span className="ml-1 text-[var(--text-tertiary)]">
          {online
            ? '· May be available · work stays local'
            : '· Local document tools continue to work'}
        </span>
      </span>
    </aside>
  );
}
