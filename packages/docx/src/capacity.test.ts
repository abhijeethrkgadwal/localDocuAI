import { describe, expect, it } from 'vitest';
import {
  assessWordToPdfCapacity,
  maxWebWordToPdfFileBytes,
  WEB_HARD_MAX_FILE_BYTES,
} from './capacity.js';

describe('word → PDF capacity gate', () => {
  it('caps unknown hardware conservatively', () => {
    const max = maxWebWordToPdfFileBytes({ hardwareConcurrency: 8 });
    expect(max).toBeLessThanOrEqual(WEB_HARD_MAX_FILE_BYTES);
    expect(max).toBeGreaterThanOrEqual(512 * 1024);
  });

  it('allows small files on typical desktop RAM', () => {
    const result = assessWordToPdfCapacity({
      fileSizeBytes: 200_000,
      filename: 'letter.docx',
      system: { deviceMemoryGb: 8, hardwareConcurrency: 8 },
    });
    expect(result.canProceed).toBe(true);
  });

  it('blocks oversized files before any conversion work', () => {
    const result = assessWordToPdfCapacity({
      fileSizeBytes: 50 * 1024 * 1024,
      filename: 'huge.docx',
      system: { deviceMemoryGb: 16, hardwareConcurrency: 12 },
    });
    expect(result.canProceed).toBe(false);
    if (result.canProceed) return;
    expect(result.message.toLowerCase()).toContain('exceeds');
    expect(result.recovery.toLowerCase()).toContain('desktop');
  });

  it('blocks when estimated peak exceeds JS heap budget', () => {
    const result = assessWordToPdfCapacity({
      fileSizeBytes: 3 * 1024 * 1024,
      filename: 'mid.docx',
      system: {
        deviceMemoryGb: 16,
        hardwareConcurrency: 8,
        jsHeapSizeLimitBytes: 20 * 1024 * 1024,
      },
    });
    expect(result.canProceed).toBe(false);
    if (result.canProceed) return;
    expect(result.recovery.toLowerCase()).toContain('coming soon');
  });

  it('rejects empty files without desktop messaging', () => {
    const result = assessWordToPdfCapacity({
      fileSizeBytes: 0,
      filename: 'empty.docx',
      system: { deviceMemoryGb: 8, hardwareConcurrency: 4 },
    });
    expect(result.canProceed).toBe(false);
    if (result.canProceed) return;
    expect(result.message.toLowerCase()).toContain('empty');
  });
});
