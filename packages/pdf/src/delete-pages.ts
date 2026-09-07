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
} from './shared.js';

export const deletePagesInputSchema = z.object({
  file: commandFileSchema,
  pages: z.array(z.number().int().positive()).optional(),
  pageSpec: z.string().optional(),
  outputFilename: z.string().min(1).optional(),
});

export type DeletePagesInput = z.infer<typeof deletePagesInputSchema>;

export const deletePagesOutputSchema = z.object({
  filename: z.string(),
  bytes: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
  pageCount: z.number().int().nonnegative(),
  deletedPages: z.array(z.number().int().positive()),
});

export type DeletePagesOutput = z.infer<typeof deletePagesOutputSchema>;

export function validateDeletePagesInput(input: unknown): Result<DeletePagesInput> {
  const parsed = parseWithSchema(
    deletePagesInputSchema,
    input,
    'Choose a PDF and the pages to delete.',
  );
  if (!parsed.ok) return parsed;
  if (!parsed.value.pages?.length && !parsed.value.pageSpec?.trim()) {
    return err(validationError('Specify pages to delete.', 'Example: pages [2] or pageSpec “2,4-5”.'));
  }
  return parsed;
}

export async function executeDeletePages(
  input: DeletePagesInput,
  ctx?: CommandContext,
): Promise<Result<DeletePagesOutput>> {
  const validated = validateDeletePagesInput(input);
  if (!validated.ok) return validated;

  const aborted = checkAbort(ctx?.signal);
  if (!aborted.ok) return aborted;

  const { file, outputFilename } = validated.value;
  const loaded = await loadPdfDocument(file.name, file.bytes);
  if (!loaded.ok) return loaded;

  const source = loaded.value;
  const pageCount = source.getPageCount();

  let toDelete: number[];
  if (validated.value.pageSpec?.trim()) {
    const parsed = parsePageSpec(validated.value.pageSpec, pageCount);
    if (!parsed.ok) return parsed;
    toDelete = parsed.value;
  } else {
    toDelete = [...new Set(validated.value.pages ?? [])].sort((a, b) => a - b);
    for (const p of toDelete) {
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

  if (toDelete.length === 0) {
    return err(validationError('No pages selected to delete.', 'Choose at least one page.'));
  }

  if (toDelete.length >= pageCount) {
    return err(
      validationError('Cannot delete all pages from a PDF.', 'Keep at least one page.'),
    );
  }

  const deleteSet = new Set(toDelete);
  const keep: number[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (!deleteSet.has(i)) keep.push(i - 1);
  }

  ctx?.onProgress?.({
    operation: 'DELETE_PAGES',
    filesProcessed: 0,
    totalFiles: 1,
    fraction: 0.2,
    message: `Removing ${toDelete.length} page(s)`,
  });

  try {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(source, keep);
    for (const page of copied) out.addPage(page);
    const bytes = await savePdf(out);

    ctx?.onProgress?.({
      operation: 'DELETE_PAGES',
      filesProcessed: 1,
      totalFiles: 1,
      fraction: 1,
      message: 'Delete complete',
    });

    return ok({
      filename: ensurePdfFilename(
        outputFilename ?? `${file.name.replace(/\.pdf$/i, '')}-edited.pdf`,
      ),
      bytes,
      pageCount: out.getPageCount(),
      deletedPages: toDelete,
    });
  } catch (error) {
    return err(
      internalError('Failed to delete pages.', {
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

export const deletePagesCommand: CommandDefinition<DeletePagesInput, DeletePagesOutput> = {
  name: CommandName.DELETE_PAGES,
  description: 'Delete selected pages from a PDF.',
  inputSchema: deletePagesInputSchema,
  outputSchema: deletePagesOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.PDF],
  validate: validateDeletePagesInput,
  execute: executeDeletePages,
};

export { deletePagesCommand as DELETE_PAGES };
