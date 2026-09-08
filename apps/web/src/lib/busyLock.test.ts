import { describe, expect, it } from 'vitest';
import { createBusyLock } from './busyLock.js';

describe('createBusyLock', () => {
  it('allows only one acquire until released', () => {
    const lock = createBusyLock();
    expect(lock.tryAcquire()).toBe(true);
    expect(lock.isLocked()).toBe(true);
    expect(lock.tryAcquire()).toBe(false);
    expect(lock.tryAcquire()).toBe(false);

    lock.release();
    expect(lock.isLocked()).toBe(false);
    expect(lock.tryAcquire()).toBe(true);
  });

  it('blocks overlapping async tasks like double-clicks', async () => {
    const lock = createBusyLock();
    const order: string[] = [];

    async function runTask(label: string) {
      if (!lock.tryAcquire()) {
        order.push(`${label}:blocked`);
        return;
      }
      order.push(`${label}:start`);
      await Promise.resolve();
      order.push(`${label}:done`);
      lock.release();
    }

    await Promise.all([runTask('a'), runTask('b'), runTask('c')]);
    expect(order).toEqual(['a:start', 'b:blocked', 'c:blocked', 'a:done']);

    await runTask('d');
    expect(order.at(-2)).toBe('d:start');
    expect(order.at(-1)).toBe('d:done');
  });
});
