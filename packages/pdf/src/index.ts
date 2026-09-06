export {
  mergeFilesCommand,
  MERGE_FILES,
  mergeFilesInputSchema,
  mergeFilesOutputSchema,
  mergeFileSchema,
  validateMergeFilesInput,
  executeMergeFiles,
  toMergeInput,
  type MergeFilesInput,
  type MergeFilesOutput,
} from './merge.js';

export {
  splitFileCommand,
  SPLIT_FILE,
  splitFileInputSchema,
  splitFileOutputSchema,
  validateSplitFileInput,
  executeSplitFile,
  type SplitFileInput,
  type SplitFileOutput,
} from './split.js';

export {
  extractPagesCommand,
  EXTRACT_PAGES,
  extractPagesInputSchema,
  extractPagesOutputSchema,
  validateExtractPagesInput,
  executeExtractPages,
  type ExtractPagesInput,
  type ExtractPagesOutput,
} from './extract.js';

export {
  deletePagesCommand,
  DELETE_PAGES,
  deletePagesInputSchema,
  deletePagesOutputSchema,
  validateDeletePagesInput,
  executeDeletePages,
  type DeletePagesInput,
  type DeletePagesOutput,
} from './delete-pages.js';

export {
  rotatePagesCommand,
  ROTATE_PAGES,
  rotatePagesInputSchema,
  rotatePagesOutputSchema,
  validateRotatePagesInput,
  executeRotatePages,
  type RotatePagesInput,
  type RotatePagesOutput,
} from './rotate.js';

export {
  reorderPagesCommand,
  REORDER_PAGES,
  reorderPagesInputSchema,
  reorderPagesOutputSchema,
  validateReorderPagesInput,
  executeReorderPages,
  type ReorderPagesInput,
  type ReorderPagesOutput,
} from './reorder.js';

export { parsePageSpec, ensurePdfFilename } from './shared.js';

export { pdfCommandRegistry, phase1CommandRegistry } from './registry.js';

export { createTestPdf, createTestPdfs } from './test-utils.js';
