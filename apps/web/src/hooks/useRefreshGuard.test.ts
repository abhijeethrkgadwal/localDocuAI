import { describe, expect, it } from 'vitest';
import {
  buildRefreshGuardMessage,
  isHardRefreshKey,
  isRefreshKey,
} from './useRefreshGuard';

function keyEvent( partial: Partial<KeyboardEvent> & { key: string }): KeyboardEvent {
  return partial as KeyboardEvent;
}

describe('buildRefreshGuardMessage', () => {
  it('warns about offline session loss and hard refresh / SW', () => {
    const message = buildRefreshGuardMessage({ offline: true, busy: false });
    expect(message).toMatch(/offline/i);
    expect(message).toMatch(/stay on this page/i);
    expect(message).toMatch(/service worker/i);
    expect(message).toMatch(/Hard refresh/i);
  });

  it('warns about interrupting an in-flight operation when online', () => {
    const message = buildRefreshGuardMessage({ offline: false, busy: true });
    expect(message).toMatch(/still running/i);
    expect(message).toMatch(/interrupt/i);
  });

  it('combines offline + busy context', () => {
    const message = buildRefreshGuardMessage({ offline: true, busy: true });
    expect(message).toMatch(/still running/i);
    expect(message).toMatch(/offline/i);
    expect(message).toMatch(/service worker/i);
  });
});

describe('refresh key detection', () => {
  it('treats F5 and Ctrl/Cmd+R as refresh', () => {
    expect(isRefreshKey(keyEvent({ key: 'F5' }))).toBe(true);
    expect(isRefreshKey(keyEvent({ key: 'r', ctrlKey: true }))).toBe(true);
    expect(isRefreshKey(keyEvent({ key: 'R', metaKey: true }))).toBe(true);
    expect(isRefreshKey(keyEvent({ key: 'a', ctrlKey: true }))).toBe(false);
  });

  it('detects hard refresh shortcuts', () => {
    expect(isHardRefreshKey(keyEvent({ key: 'F5', shiftKey: true }))).toBe(true);
    expect(isHardRefreshKey(keyEvent({ key: 'r', ctrlKey: true, shiftKey: true }))).toBe(true);
    expect(isHardRefreshKey(keyEvent({ key: 'r', ctrlKey: true }))).toBe(false);
  });
});
