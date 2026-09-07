import { PDFDocument } from 'pdf-lib';
import {
  CommandName,
  Permission,
  SupportedFileType,
  err,
  corruptError,
  internalError,
  ok,
  parseWithSchema,
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
  savePdf,
} from './shared.js';

export const splitFileInputSchema = z.object({
  file: commandFileSchema,
  outputBasename: z.string().min(1).optional(),
});

export type SplitFileInput = z.infer<typeof splitFileInputSchema>;

export const splitFileOutputSchema = z.object({
  files: z.array(
    z.object({
      filename: z.string(),
      bytes: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
      pageNumber: z.number().int().positive(),
    }),
  ),
  sourcePageCount: z.number().int().positive(),
});

export type SplitFileOutput = z.infer<typeof splitFileOutputSchema>;

export function validateSplitFileInput(input: unknown): Result<SplitFileInput> {
  return parseWithSchema(splitFileInputSchema, input, 'Choose one PDF to split.');
}

export async function executeSplitFile(
  input: SplitFileInput,
  ctx?: CommandContext,
): Promise<Result<SplitFileOutput>> {
  const validated = validateSplitFileInput(input);
  if (!validated.ok) return validated;

  const aborted = checkAbort(ctx?.signal);
  if (!aborted.ok) return aborted;

  const { file, outputBasename } = validated.value;
  const loaded = await loadPdfDocument(file.name, file.bytes);
  if (!loaded.ok) return loaded;

  const source = loaded.value;
  const pageCount = source.getPageCount();
  if (pageCount < 1) {
    return err(
      corruptError(
        `${file.name} has no pages to split.`,
        { affectedFiles: [file.name] },
        'Replace this file with a valid multi-page PDF, then retry.',
      ),
    );
  }

  const stem = file.name.replace(/\.pdf$/i, '') || 'page';
  const base = (outputBasename ?? stem).replace(/\.pdf$/i, '');
  const outputs: SplitFileOutput['files'] = [];

  for (let i = 0; i < pageCount; i++) {
    const midAbort = checkAbort(ctx?.signal);
    if (!midAbort.ok) return midAbort;

    ctx?.onProgress?.({
      operation: 'SPLIT_FILE',
      filesProcessed: i,
      totalFiles: pageCount,
      fraction: i / pageCount,
      message: `Splitting page ${i + 1}`,
    });

    try {
      const out = await PDFDocument.create();
      const [copied] = await out.copyPages(source, [i]);
      if (!copied) return err(internalError(`Failed to copy page ${i + 1}.`));
      out.addPage(copied);
      outputs.push({
        filename: ensurePdfFilename(`${base}-${i + 1}`),
        bytes: await savePdf(out),
        pageNumber: i + 1,
      });
    } catch (error) {
      return err(
        internalError(`Failed while splitting page ${i + 1}.`, {
          reason: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  ctx?.onProgress?.({
    operation: 'SPLIT_FILE',
    filesProcessed: pageCount,
    totalFiles: pageCount,
    fraction: 1,
    message: 'Split complete',
  });

  return ok({ files: outputs, sourcePageCount: pageCount });
}

export const splitFileCommand: CommandDefinition<SplitFileInput, SplitFileOutput> = {
  name: CommandName.SPLIT_FILE,
  description: 'Split a PDF into one file per page.',
  inputSchema: splitFileInputSchema,
  outputSchema: splitFileOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.PDF],
  validate: validateSplitFileInput,
  execute: executeSplitFile,
};

export { splitFileCommand as SPLIT_FILE };
