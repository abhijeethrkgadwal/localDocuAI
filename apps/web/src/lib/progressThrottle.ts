import type { ProgressUpdate } from '@localdoc/core';

/**
 * Coalesce high-frequency progress callbacks (e.g. per-page compress) so React
 * is not forced to re-render every tick. Always delivers the latest update.
 */
export function createThrottledProgress(
  onProgress: (update: ProgressUpdate) => void,
  intervalMs = 120,
): (update: ProgressUpdate) => void {
  let lastSent = 0;
  let pending: ProgressUpdate | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    timer = null;
    if (!pending) return;
    lastSent = Date.now();
    const next = pending;
    pending = null;
    onProgress(next);
  };

  return (update: ProgressUpdate) => {
    const now = Date.now();
    if (now - lastSent >= intervalMs) {
      lastSent = now;
      pending = null;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      onProgress(update);
      return;
    }
    pending = update;
    if (!timer) {
      timer = setTimeout(flush, Math.max(0, intervalMs - (now - lastSent)));
    }
  };
}
