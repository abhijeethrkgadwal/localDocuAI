import { describe, expect, it, vi } from 'vitest';
import { looksLikePdf } from './pdfMagic.js';
import { createThrottledProgress } from './progressThrottle.js';

describe('looksLikePdf', () => {
  it('accepts a %PDF- header', () => {
    const bytes = new TextEncoder().encode('%PDF-1.7\n...');
    expect(looksLikePdf(bytes)).toBe(true);
  });

  it('rejects non-PDF bytes', () => {
    expect(looksLikePdf(new Uint8Array([0, 1, 2, 3, 4]))).toBe(false);
    expect(looksLikePdf(new Uint8Array(0))).toBe(false);
  });
});

describe('createThrottledProgress', () => {
  it('delivers the first update immediately and coalesces the rest', async () => {
    vi.useFakeTimers();
    const received: number[] = [];
    const onProgress = createThrottledProgress((u) => {
      received.push(u.filesProcessed);
    }, 100);

    onProgress({
      operation: 'compress',
      filesProcessed: 1,
      totalFiles: 10,
      fraction: 0.1,
      message: '1',
    });
    onProgress({
      operation: 'compress',
      filesProcessed: 2,
      totalFiles: 10,
      fraction: 0.2,
      message: '2',
    });
    onProgress({
      operation: 'compress',
      filesProcessed: 3,
      totalFiles: 10,
      fraction: 0.3,
      message: '3',
    });

    expect(received).toEqual([1]);
    await vi.advanceTimersByTimeAsync(100);
    expect(received).toEqual([1, 3]);
    vi.useRealTimers();
  });
});
