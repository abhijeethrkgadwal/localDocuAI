import { PDFDocument } from 'pdf-lib';
import {
  CommandName,
  Permission,
  SupportedFileType,
  err,
  internalError,
  ok,
  parseWithSchema,
  validationError,
  type CommandContext,
  type CommandDefinition,
  type Result,
} from '@localdoc/core';
import { z } from 'zod';
import {
  checkAbort,
  commandFileSchema,
  ensurePdfFilename,
  loadPdfDocument,
  parsePageSpec,
  savePdf,
  toZeroBased,
} from './shared.js';

export const extractPagesInputSchema = z.object({
  file: commandFileSchema,
  /** 1-based page numbers, or omit and provide pageSpec */
  pages: z.array(z.number().int().positive()).optional(),
  /** e.g. "1-3,5" */
  pageSpec: z.string().optional(),
  outputFilename: z.string().min(1).optional(),
});

export type ExtractPagesInput = z.infer<typeof extractPagesInputSchema>;

export const extractPagesOutputSchema = z.object({
  filename: z.string(),
  bytes: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
  pageCount: z.number().int().positive(),
  extractedPages: z.array(z.number().int().positive()),
});

export type ExtractPagesOutput = z.infer<typeof extractPagesOutputSchema>;

export function validateExtractPagesInput(input: unknown): Result<ExtractPagesInput> {
  const parsed = parseWithSchema(
    extractPagesInputSchema,
    input,
    'Choose a PDF and the pages to extract.',
  );
  if (!parsed.ok) return parsed;
  if (!parsed.value.pages?.length && !parsed.value.pageSpec?.trim()) {
    return err(validationError('Specify pages to extract.', 'Example: pages [1,2] or pageSpec “1-3”.'));
  }
  return parsed;
}

export async function executeExtractPages(
  input: ExtractPagesInput,
  ctx?: CommandContext,
): Promise<Result<ExtractPagesOutput>> {
  const validated = validateExtractPagesInput(input);
  if (!validated.ok) return validated;

  const aborted = checkAbort(ctx?.signal);
  if (!aborted.ok) return aborted;

  const { file, outputFilename } = validated.value;
  const loaded = await loadPdfDocument(file.name, file.bytes);
  if (!loaded.ok) return loaded;

  const source = loaded.value;
  const pageCount = source.getPageCount();

  let pages1: number[];
  if (validated.value.pageSpec?.trim()) {
    const parsed = parsePageSpec(validated.value.pageSpec, pageCount);
    if (!parsed.ok) return parsed;
    pages1 = parsed.value;
  } else {
    pages1 = [...new Set(validated.value.pages ?? [])].sort((a, b) => a - b);
    for (const p of pages1) {
      if (p > pageCount) {
        return err(
          validationError(
            `Page ${p} is outside this PDF (${pageCount} pages).`,
            'Check the page count and try again.',
          ),
        );
      }
    }
  }

  if (pages1.length === 0) {
    return err(validationError('No pages selected to extract.', 'Choose at least one page.'));
  }

  ctx?.onProgress?.({
    operation: 'EXTRACT_PAGES',
    filesProcessed: 0,
    totalFiles: 1,
    fraction: 0.2,
    message: `Extracting ${pages1.length} page(s)`,
  });

  try {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(source, toZeroBased(pages1));
    for (const page of copied) out.addPage(page);
    const bytes = await savePdf(out);

    ctx?.onProgress?.({
      operation: 'EXTRACT_PAGES',
      filesProcessed: 1,
      totalFiles: 1,
      fraction: 1,
      message: 'Extract complete',
    });

    return ok({
      filename: ensurePdfFilename(
        outputFilename ?? `${file.name.replace(/\.pdf$/i, '')}-extract.pdf`,
      ),
      bytes,
      pageCount: out.getPageCount(),
      extractedPages: pages1,
    });
  } catch (error) {
    return err(
      internalError('Failed to extract pages.', {
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

export const extractPagesCommand: CommandDefinition<ExtractPagesInput, ExtractPagesOutput> = {
  name: CommandName.EXTRACT_PAGES,
  description: 'Extract selected pages into a new PDF.',
  inputSchema: extractPagesInputSchema,
  outputSchema: extractPagesOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.PDF],
  validate: validateExtractPagesInput,
  execute: executeExtractPages,
};

export { extractPagesCommand as EXTRACT_PAGES };
