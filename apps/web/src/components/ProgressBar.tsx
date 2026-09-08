interface ProgressBarProps {
  label: string;
  filesProcessed: number;
  totalFiles: number;
  /** 0–1 when known */
  fraction?: number;
}

export function ProgressBar({ label, filesProcessed, totalFiles, fraction }: ProgressBarProps) {
  const percent =
    typeof fraction === 'number' ? Math.round(Math.min(1, Math.max(0, fraction)) * 100) : null;
  const valueText =
    percent !== null
      ? `${label}: ${percent} percent, ${filesProcessed} of ${totalFiles} files`
      : `${label}: ${filesProcessed} of ${totalFiles} files`;

  return (
    <div className="mt-4 space-y-2" role="status" aria-live="polite">
      <div className="flex justify-between gap-3 text-xs text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="tabular-nums shrink-0">
          {filesProcessed}/{totalFiles}
          {percent !== null ? ` · ${percent}%` : ''}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[var(--accent-soft)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
        aria-valuetext={valueText}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-[var(--duration-normal)]"
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
    </div>
  );
}
