import { PDFDocument } from 'pdf-lib';
import {
  CommandName,
  Permission,
  SupportedFileType,
  err,
  internalError,
  ok,
  parseWithSchema,
  type CommandContext,
  type CommandDefinition,
  type Result,
} from '@localdoc/core';
import { z } from 'zod';
import {
  assertPermutation,
  checkAbort,
  commandFileSchema,
  ensurePdfFilename,
  loadPdfDocument,
  savePdf,
  toZeroBased,
} from './shared.js';

export const reorderPagesInputSchema = z.object({
  file: commandFileSchema,
  /** 1-based permutation of all pages, e.g. [3,1,2] */
  order: z.array(z.number().int().positive()).min(1),
  outputFilename: z.string().min(1).optional(),
});

export type ReorderPagesInput = z.infer<typeof reorderPagesInputSchema>;

export const reorderPagesOutputSchema = z.object({
  filename: z.string(),
  bytes: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
  pageCount: z.number().int().positive(),
  order: z.array(z.number().int().positive()),
});

export type ReorderPagesOutput = z.infer<typeof reorderPagesOutputSchema>;

export function validateReorderPagesInput(input: unknown): Result<ReorderPagesInput> {
  return parseWithSchema(
    reorderPagesInputSchema,
    input,
    'Provide a full page order (e.g. 3,1,2).',
  );
}

export async function executeReorderPages(
  input: ReorderPagesInput,
  ctx?: CommandContext,
): Promise<Result<ReorderPagesOutput>> {
  const validated = validateReorderPagesInput(input);
  if (!validated.ok) return validated;

  const aborted = checkAbort(ctx?.signal);
  if (!aborted.ok) return aborted;

  const { file, outputFilename } = validated.value;
  const loaded = await loadPdfDocument(file.name, file.bytes);
  if (!loaded.ok) return loaded;

  const source = loaded.value;
  const pageCount = source.getPageCount();
  const orderCheck = assertPermutation(validated.value.order, pageCount);
  if (!orderCheck.ok) return orderCheck;

  const order = orderCheck.value;

  ctx?.onProgress?.({
    operation: 'REORDER_PAGES',
    filesProcessed: 0,
    totalFiles: 1,
    fraction: 0.3,
    message: 'Reordering pages',
  });

  try {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(source, toZeroBased(order));
    for (const page of copied) out.addPage(page);
    const bytes = await savePdf(out);

    ctx?.onProgress?.({
      operation: 'REORDER_PAGES',
      filesProcessed: 1,
      totalFiles: 1,
      fraction: 1,
      message: 'Reorder complete',
    });

    return ok({
      filename: ensurePdfFilename(
        outputFilename ?? `${file.name.replace(/\.pdf$/i, '')}-reordered.pdf`,
      ),
      bytes,
      pageCount: out.getPageCount(),
      order,
    });
  } catch (error) {
    return err(
      internalError('Failed to reorder pages.', {
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

export const reorderPagesCommand: CommandDefinition<ReorderPagesInput, ReorderPagesOutput> = {
  name: CommandName.REORDER_PAGES,
  description: 'Reorder all pages of a PDF using a full page permutation.',
  inputSchema: reorderPagesInputSchema,
  outputSchema: reorderPagesOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.PDF],
  validate: validateReorderPagesInput,
  execute: executeReorderPages,
};

export { reorderPagesCommand as REORDER_PAGES };
