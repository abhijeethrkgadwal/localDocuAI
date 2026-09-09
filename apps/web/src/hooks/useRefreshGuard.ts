import { useEffect } from 'react';
import { getT, type TranslateFn } from '../i18n';

export interface RefreshGuardOptions {
  /** When true, refresh / leave attempts are intercepted. */
  enabled: boolean;
  /**
   * Shown in `window.confirm` for keyboard refresh (F5 / Ctrl+R / Cmd+R / hard refresh).
   * Browser chrome refresh / tab close only gets the generic leave dialog.
   */
  confirmMessage: string;
}

/** Soft navigation reload — goes through the service worker (unlike Shift+reload). */
export function softReload(): void {
  const { pathname, search, hash } = window.location;
  window.location.assign(`${pathname}${search}${hash}`);
}

export function isHardRefreshKey(event: KeyboardEvent): boolean {
  if (event.key === 'F5' && event.shiftKey) return true;
  const mod = event.ctrlKey || event.metaKey;
  return Boolean(mod && event.shiftKey && (event.key === 'r' || event.key === 'R'));
}

export function isRefreshKey(event: KeyboardEvent): boolean {
  if (event.key === 'F5') return true;
  const mod = event.ctrlKey || event.metaKey;
  return Boolean(mod && (event.key === 'r' || event.key === 'R'));
}

/**
 * Soft-blocks page refresh while offline or during in-flight work.
 *
 * Going offline does not interrupt local processing. A reload clears in-memory
 * session state. A *hard* refresh also bypasses the service worker and usually
 * fails offline — confirmed reloads always use a soft assign so the SW can serve
 * the cached app shell.
 */
export function useRefreshGuard({ enabled, confirmMessage }: RefreshGuardOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Required for legacy browsers; modern browsers show a generic dialog.
      event.returnValue = '';
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isRefreshKey(event)) return;
      event.preventDefault();
      event.stopPropagation();
      const proceed = window.confirm(confirmMessage);
      if (proceed) {
        // Always soft-reload so the service worker can answer while offline.
        softReload();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [enabled, confirmMessage]);
}

export function buildRefreshGuardMessage(input: {
  offline: boolean;
  busy: boolean;
  t?: TranslateFn;
}): string {
  const t = input.t ?? getT();
  const hardRefreshNote = input.offline ? t('workspace.refreshGuard.hardRefreshNote') : '';

  if (input.busy && input.offline) {
    return t('workspace.refreshGuard.busyAndOffline', { hardRefreshNote });
  }
  if (input.busy) {
    return t('workspace.refreshGuard.busy');
  }
  if (input.offline) {
    return t('workspace.refreshGuard.offline', { hardRefreshNote });
  }
  return t('workspace.refreshGuard.default');
}
