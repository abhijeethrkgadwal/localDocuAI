import { maxWebWordToPdfFileBytes } from '@localdoc/docx';
import { getT, type TranslateFn } from '../i18n';

export type CapacityHintTone = 'info' | 'warning';

export interface DeviceCapacityHint {
  tone: CapacityHintTone;
  message: string;
}

function readDeviceMemoryGb(): number | undefined {
  const nav =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & { deviceMemory?: number })
      : undefined;
  return typeof nav?.deviceMemory === 'number' && Number.isFinite(nav.deviceMemory)
    ? nav.deviceMemory
    : undefined;
}

function readHardwareConcurrency(): number {
  const cores =
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
  return typeof cores === 'number' && cores > 0 ? cores : 4;
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

/** Early, honest guidance for convert / compress on constrained phones. */
export function getConvertCapacityHint(t: TranslateFn = getT()): DeviceCapacityHint {
  const deviceMemoryGb = readDeviceMemoryGb();
  const hardwareConcurrency = readHardwareConcurrency();
  const maxBytes = maxWebWordToPdfFileBytes({
    deviceMemoryGb,
    hardwareConcurrency,
  });
  const lowRam =
    deviceMemoryGb !== undefined ? deviceMemoryGb <= 4 : hardwareConcurrency <= 4;
  const maxMb = formatMb(maxBytes);

  return {
    tone: lowRam ? 'warning' : 'info',
    message: lowRam
      ? t('workspace.capacity.convertLowRam', { maxMb })
      : t('workspace.capacity.convertInfo', { maxMb }),
  };
}

export function getCompressCapacityHint(t: TranslateFn = getT()): DeviceCapacityHint {
  const deviceMemoryGb = readDeviceMemoryGb();
  const hardwareConcurrency = readHardwareConcurrency();
  const lowRam =
    deviceMemoryGb !== undefined ? deviceMemoryGb <= 4 : hardwareConcurrency <= 4;

  return {
    tone: lowRam ? 'warning' : 'info',
    message: lowRam
      ? t('workspace.capacity.compressLowRam')
      : t('workspace.capacity.compressInfo'),
  };
}

/** Coarse pointer or narrow viewport — prefer Select files over drag-drop copy. */
export function prefersTouchFirstUi(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 640px)').matches;
  return coarse || narrow;
}
