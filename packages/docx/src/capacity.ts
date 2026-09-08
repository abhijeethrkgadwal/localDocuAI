import { err, ok, unsupportedError, type Result } from '@localdoc/core';

/** Optional system hints — inject in tests; browsers read from navigator when omitted. */
export interface SystemCapacityHints {
  /** Approximate device RAM in GiB (`navigator.deviceMemory`). */
  deviceMemoryGb?: number;
  /** Logical CPU cores (`navigator.hardwareConcurrency`). */
  hardwareConcurrency?: number;
  /** JS heap size limit in bytes (`performance.memory.jsHeapSizeLimit`). */
  jsHeapSizeLimitBytes?: number;
}

export interface WordToPdfCapacityInput {
  fileSizeBytes: number;
  filename?: string;
  system?: SystemCapacityHints;
}

export interface WordToPdfCapacityOk {
  canProceed: true;
  maxFileBytes: number;
  estimatedPeakBytes: number;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number;
}

export interface WordToPdfCapacityBlocked {
  canProceed: false;
  maxFileBytes: number;
  estimatedPeakBytes: number;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number;
  message: string;
  recovery: string;
}

export type WordToPdfCapacityAssessment = WordToPdfCapacityOk | WordToPdfCapacityBlocked;

/** Absolute web ceiling — larger jobs wait for desktop. */
export const WEB_HARD_MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Rough peak memory multiplier for inflate + text build + PDF write. */
export const ESTIMATED_PEAK_MULTIPLIER = 10;

const DESKTOP_COMING_SOON =
  'Try a smaller file or free memory, then retry. Heavier DOC/DOCX → PDF conversion is coming soon in the desktop app.';

function readBrowserHints(): SystemCapacityHints {
  const nav =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & { deviceMemory?: number })
      : undefined;
  const perf =
    typeof performance !== 'undefined'
      ? (performance as Performance & { memory?: { jsHeapSizeLimit?: number } })
      : undefined;

  return {
    deviceMemoryGb:
      typeof nav?.deviceMemory === 'number' && Number.isFinite(nav.deviceMemory)
        ? nav.deviceMemory
        : undefined,
    hardwareConcurrency:
      typeof nav?.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0
        ? nav.hardwareConcurrency
        : undefined,
    jsHeapSizeLimitBytes:
      typeof perf?.memory?.jsHeapSizeLimit === 'number' && perf.memory.jsHeapSizeLimit > 0
        ? perf.memory.jsHeapSizeLimit
        : undefined,
  };
}

/**
 * Cap file size by approximate device RAM / cores.
 * Conservative on unknown hardware so the tab does not OOM.
 */
export function maxWebWordToPdfFileBytes(system: SystemCapacityHints = {}): number {
  const cores = system.hardwareConcurrency ?? 4;
  const mem = system.deviceMemoryGb;

  let byRam: number;
  if (mem === undefined) {
    // Unknown RAM: lean on cores as a weak signal.
    byRam = cores <= 2 ? 2 * 1024 * 1024 : cores <= 4 ? 6 * 1024 * 1024 : 10 * 1024 * 1024;
  } else if (mem <= 2) {
    byRam = 2 * 1024 * 1024;
  } else if (mem <= 4) {
    byRam = 5 * 1024 * 1024;
  } else if (mem <= 8) {
    byRam = 10 * 1024 * 1024;
  } else {
    byRam = 18 * 1024 * 1024;
  }

  let byHeap = WEB_HARD_MAX_FILE_BYTES;
  if (system.jsHeapSizeLimitBytes) {
    // Keep estimated peak under ~40% of the JS heap limit.
    byHeap = Math.floor(system.jsHeapSizeLimitBytes * 0.4) / ESTIMATED_PEAK_MULTIPLIER;
  }

  return Math.max(512 * 1024, Math.min(WEB_HARD_MAX_FILE_BYTES, byRam, byHeap));
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

/**
 * Measure whether this machine can safely attempt web DOC/DOCX → PDF
 * before reading/converting. Call this before accepting the work.
 */
export function assessWordToPdfCapacity(
  input: WordToPdfCapacityInput,
): WordToPdfCapacityAssessment {
  const system = { ...readBrowserHints(), ...input.system };
  const maxFileBytes = maxWebWordToPdfFileBytes(system);
  const estimatedPeakBytes = Math.max(0, input.fileSizeBytes) * ESTIMATED_PEAK_MULTIPLIER;
  const deviceMemoryGb = system.deviceMemoryGb ?? null;
  const hardwareConcurrency = system.hardwareConcurrency ?? 4;
  const name = input.filename ? ` “${input.filename}”` : '';

  if (!Number.isFinite(input.fileSizeBytes) || input.fileSizeBytes < 0) {
    return {
      canProceed: false,
      maxFileBytes,
      estimatedPeakBytes: 0,
      deviceMemoryGb,
      hardwareConcurrency,
      message: `Cannot measure file size for conversion${name}.`,
      recovery: DESKTOP_COMING_SOON,
    };
  }

  if (input.fileSizeBytes === 0) {
    return {
      canProceed: false,
      maxFileBytes,
      estimatedPeakBytes: 0,
      deviceMemoryGb,
      hardwareConcurrency,
      message: `File${name} is empty — nothing to convert.`,
      recovery: 'Choose a non-empty DOC or DOCX file.',
    };
  }

  if (input.fileSizeBytes > maxFileBytes) {
    return {
      canProceed: false,
      maxFileBytes,
      estimatedPeakBytes,
      deviceMemoryGb,
      hardwareConcurrency,
      message: `File${name} is ${formatMb(input.fileSizeBytes)}, which exceeds this browser’s safe limit of ${formatMb(maxFileBytes)} for DOC/DOCX → PDF on this device.`,
      recovery: DESKTOP_COMING_SOON,
    };
  }

  if (system.jsHeapSizeLimitBytes && estimatedPeakBytes > system.jsHeapSizeLimitBytes * 0.4) {
    return {
      canProceed: false,
      maxFileBytes,
      estimatedPeakBytes,
      deviceMemoryGb,
      hardwareConcurrency,
      message: `Converting${name} would need roughly ${formatMb(estimatedPeakBytes)} of memory — more than this browser session can safely spare.`,
      recovery: DESKTOP_COMING_SOON,
    };
  }

  return {
    canProceed: true,
    maxFileBytes,
    estimatedPeakBytes,
    deviceMemoryGb,
    hardwareConcurrency,
  };
}

/** Result-shaped gate used by convert commands before any heavy work. */
export function gateWordToPdfCapacity(
  input: WordToPdfCapacityInput,
): Result<WordToPdfCapacityOk> {
  const assessment = assessWordToPdfCapacity(input);
  if (!assessment.canProceed) {
    return err(
      unsupportedError(assessment.message, assessment.recovery, {
        affectedFiles: input.filename ? [input.filename] : undefined,
        maxFileBytes: assessment.maxFileBytes,
        estimatedPeakBytes: assessment.estimatedPeakBytes,
        deviceMemoryGb: assessment.deviceMemoryGb,
        hardwareConcurrency: assessment.hardwareConcurrency,
      }),
    );
  }
  return ok(assessment);
}
