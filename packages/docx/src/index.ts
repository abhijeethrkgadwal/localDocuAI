export {
  mergeDocxCommand,
  mergeDocxInputSchema,
  mergeDocxOutputSchema,
  validateMergeDocxInput,
  executeMergeDocx,
  type MergeDocxInput,
  type MergeDocxOutput,
} from './merge.js';

export {
  extractDocxTextInputSchema,
  extractDocxTextOutputSchema,
  validateExtractDocxTextInput,
  executeExtractDocxText,
  validateDocxOnlyFiles,
  type ExtractDocxTextInput,
  type ExtractDocxTextOutput,
} from './extract.js';

export {
  convertToPdfCommand,
  convertToPdfInputSchema,
  convertToPdfOutputSchema,
  validateConvertToPdfInput,
  executeConvertToPdf,
  executeDocxToPdf,
  type ConvertToPdfInput,
  type ConvertToPdfOutput,
} from './to-pdf.js';

export {
  assessWordToPdfCapacity,
  gateWordToPdfCapacity,
  maxWebWordToPdfFileBytes,
  WEB_HARD_MAX_FILE_BYTES,
  ESTIMATED_PEAK_MULTIPLIER,
  type SystemCapacityHints,
  type WordToPdfCapacityAssessment,
  type WordToPdfCapacityInput,
} from './capacity.js';

export { extractPlainTextFromDocBinary } from './doc-extract.js';

export { docxCommandRegistry } from './registry.js';

export { createTestDocx, createTestDocxs } from './test-utils.js';
