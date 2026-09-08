import { useId, useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface TrustStatusStripProps {
  filesOnDevice: number;
}

export function TrustStatusStrip({ filesOnDevice }: TrustStatusStripProps) {
  const online = useOnlineStatus();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();

  return (
    <section aria-label="Network and privacy status" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="status-pill"
          aria-label={online ? 'Network: browser reports online' : 'Network: offline'}
        >
          <span
            className="status-dot"
            style={{
              backgroundColor: online ? 'var(--status-online)' : 'var(--status-offline)',
            }}
            aria-hidden
          />
          {online ? 'Browser online' : 'Offline'}
        </span>

        <span className="status-pill" aria-label="Document processing: local">
          <span
            className="status-dot"
            style={{ backgroundColor: 'var(--accent)' }}
            aria-hidden
          />
          Local processing
        </span>

        <span className="status-pill" aria-label="Cloud document processing: off">
          Cloud processing Off
        </span>

        <span className="status-pill" aria-label="LocalDocu AI: off">
          LocalDocu AI Off
        </span>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          Details
        </button>
      </div>

      <div
        id={detailsId}
        hidden={!detailsOpen}
        className="rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]"
      >
        {detailsOpen ? (
          <>
            <p className="font-medium text-[var(--text-primary)]">
              {online ? 'Browser reports a connection' : 'Offline'}
            </p>
            <p className="mt-1">
              {online
                ? 'Network available. Local document processing still happens on this device.'
                : 'Offline. Local document tools continue to work.'}
            </p>
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              <li>Files in session: {filesOnDevice}</li>
              <li>Document contents are processed on this device.</li>
              <li>Cloud document processing: Off</li>
              <li>LocalDocu AI: Off (desktop, metadata-only intent — not in this web release)</li>
            </ul>
            <p className="mt-3 text-xs text-[var(--text-tertiary)]">
              Files are not uploaded for document processing. Processed locally on your device.
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
