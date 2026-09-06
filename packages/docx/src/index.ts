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
  executeDocxToPdf,
  validateDocxOnlyFiles,
  type ExtractDocxTextInput,
  type ExtractDocxTextOutput,
} from './extract.js';

export { docxCommandRegistry } from './registry.js';

export { createTestDocx, createTestDocxs } from './test-utils.js';
