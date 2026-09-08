/**
 * Synchronous in-flight guard so rapid clicks cannot start a second task
 * before React re-renders disabled buttons.
 */
export function createBusyLock() {
  let locked = false;

  return {
    tryAcquire(): boolean {
      if (locked) return false;
      locked = true;
      return true;
    },
    release(): void {
      locked = false;
    },
    isLocked(): boolean {
      return locked;
    },
  };
}
