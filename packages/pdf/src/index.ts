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

export {
  loadPdfDocument,
  classifyPdfLoadError,
  parsePageSpec,
  checkAbort,
} from './shared.js';

export {
  compressPdfCommand,
  COMPRESS_PDF,
  compressPdfInputSchema,
  compressPdfOutputSchema,
  validateCompressPdfInput,
  executeCompressPdf,
  buildPdfFromRasterPages,
  WEB_COMPRESS_HARD_MAX_BYTES,
  WEB_COMPRESS_MAX_RASTER_COST,
  type CompressPdfInput,
  type CompressPdfOutput,
  type CompressPdfDeps,
  type CompressPdfRasterizer,
  type RasterPageImage,
} from './compress.js';

/** Lightweight constants — import these without pulling pdf-lib / compress logic. */
export {
  CompressMode,
  CompressQuality,
  COMPRESS_PRESETS,
  type CompressPreset,
} from './compress-presets.js';

export { ensurePdfFilename } from './shared.js';

export { pdfCommandRegistry, phase1CommandRegistry } from './registry.js';

export { createTestPdf, createTestPdfs, createTestPdfWithJpeg } from './test-utils.js';
