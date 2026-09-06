import type { CommandName } from './commands.js';
import type { ErrorCategory } from './errors.js';

/** Where document bytes are processed — shown in privacy UI. */
export const ProcessingLocation = {
  LOCAL_BROWSER: 'local_browser',
  LOCAL_DESKTOP: 'local_desktop',
  CLOUD: 'cloud',
} as const;

export type ProcessingLocation = (typeof ProcessingLocation)[keyof typeof ProcessingLocation];

export const OperationStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type OperationStatus = (typeof OperationStatus)[keyof typeof OperationStatus];

/** Privacy-safe operation summary for UI and future analytics buckets. */
export interface OperationSummary {
  command: CommandName;
  status: OperationStatus;
  filesProcessed: number;
  totalFiles: number;
  durationMs?: number;
  errorCategory?: ErrorCategory;
}

/** Event names aligned with spec §15 — no document contents in payloads. */
export const OperationEvent = {
  STARTED: 'operation_started',
  COMPLETED: 'operation_completed',
  FAILED: 'operation_failed',
} as const;

export type OperationEvent = (typeof OperationEvent)[keyof typeof OperationEvent];

export interface OperationEventPayload {
  event: OperationEvent;
  command: CommandName;
  filesProcessed?: number;
  totalFiles?: number;
  durationMs?: number;
  errorCategory?: ErrorCategory;
}
