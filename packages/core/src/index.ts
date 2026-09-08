export {
  ErrorCategory,
  type AppError,
  validationError,
  permissionError,
  cancelledError,
  encryptedError,
  corruptError,
  internalError,
  unsupportedError,
  notFoundError,
} from './errors.js';

export type { Result } from './result.js';
export { ok, err, isOk, isErr, mapResult } from './result.js';

export {
  CommandName,
  Permission,
  SupportedFileType,
  type ProgressUpdate,
  type CommandContext,
  type CommandDefinition,
} from './commands.js';

export {
  type LocalFileRef,
  type CommandFilePayload,
  type FileSource,
  inferFileType,
  isPdfFile,
  isDocxFile,
  isDocFile,
  isWordFile,
} from './files.js';

export {
  ProcessingLocation,
  OperationStatus,
  OperationEvent,
  type OperationSummary,
  type OperationEventPayload,
} from './operation.js';

export {
  SortingType,
  sortingSchema,
  type SortingSpec,
  compareNaturalFilename,
  sortFiles,
  type SortableFile,
} from './sorting.js';

export { filterFiles, applyRenamePattern, type FilterSpec } from './filter.js';

export { parseWithSchema } from './validate.js';

export { createCommandRegistry, type CommandRegistry } from './registry.js';

export {
  formatAppError,
  formatAppErrorLine,
  getAffectedFiles,
  type FormattedAppError,
} from './format-error.js';
