import { PDFDocument } from 'pdf-lib';
import {
  CommandName,
  Permission,
  SupportedFileType,
  cancelledError,
  corruptError,
  encryptedError,
  err,
  internalError,
  ok,
  parseWithSchema,
  type CommandContext,
  type CommandDefinition,
  type CommandFilePayload,
  type Result,
} from '@localdoc/core';
import { z } from 'zod';
import { classifyPdfLoadError, commandFileSchema, ensurePdfFilename, savePdf } from './shared.js';

export const mergeFileSchema = commandFileSchema;

export const mergeFilesInputSchema = z.object({
  files: z.array(mergeFileSchema).min(2, 'At least two PDF files are required to merge.'),
  outputFilename: z.string().min(1).optional(),
});

export type MergeFilesInput = z.infer<typeof mergeFilesInputSchema>;

export const mergeFilesOutputSchema = z.object({
  filename: z.string(),
  bytes: z.custom<Uint8Array>((val) => val instanceof Uint8Array),
  pageCount: z.number().int().nonnegative(),
  sourceCount: z.number().int().positive(),
});

export type MergeFilesOutput = z.infer<typeof mergeFilesOutputSchema>;

export function validateMergeFilesInput(input: unknown): Result<MergeFilesInput> {
  return parseWithSchema(
    mergeFilesInputSchema,
    input,
    'Select at least two valid PDF files and try again.',
  );
}

export function toMergeInput(
  files: CommandFilePayload[],
  outputFilename = 'merged.pdf',
): MergeFilesInput {
  return {
    files: files.map((f) => ({ name: f.name, bytes: f.bytes })),
    outputFilename,
  };
}

export async function executeMergeFiles(
  input: MergeFilesInput,
  ctx?: CommandContext,
): Promise<Result<MergeFilesOutput>> {
  const validated = validateMergeFilesInput(input);
  if (!validated.ok) return validated;

  const { files, outputFilename = 'merged.pdf' } = validated.value;
  const total = files.length;

  if (ctx?.signal?.aborted) {
    return err(cancelledError());
  }

  const merged = await PDFDocument.create();
  const failed: { name: string; category: 'encrypted' | 'corrupt'; message: string }[] = [];
  let processed = 0;

  for (const file of files) {
    if (ctx?.signal?.aborted) {
      return err(cancelledError());
    }

    ctx?.onProgress?.({
      operation: 'MERGE_FILES',
      filesProcessed: processed,
      totalFiles: total,
      fraction: total > 0 ? processed / total : 0,
      message: `Merging ${file.name}`,
    });

    if (ctx?.signal?.aborted) {
      return err(cancelledError());
    }

    try {
      const source = await PDFDocument.load(file.bytes, { ignoreEncryption: false });
      const pageIndices = source.getPageIndices();
      const copied = await merged.copyPages(source, pageIndices);
      for (const page of copied) {
        merged.addPage(page);
      }
    } catch (error) {
      failed.push({ name: file.name, ...classifyPdfLoadError(file.name, error) });
    }

    processed += 1;
  }

  if (failed.length > 0) {
    const encrypted = failed.filter((f) => f.category === 'encrypted');
    const corrupt = failed.filter((f) => f.category === 'corrupt');
    const affected = failed.map((f) => f.name);

    if (encrypted.length > 0 && corrupt.length === 0) {
      return err(
        encryptedError(
          `${encrypted.length} file${encrypted.length === 1 ? '' : 's'} could not be processed because ${
            encrypted.length === 1 ? 'it is' : 'they are'
          } password protected.`,
          { affectedFiles: affected },
        ),
      );
    }

    if (corrupt.length > 0 && encrypted.length === 0) {
      return err(
        corruptError(
          `${corrupt.length} file${corrupt.length === 1 ? '' : 's'} could not be processed because ${
            corrupt.length === 1 ? 'it is' : 'they are'
          } damaged or not a valid PDF.`,
          { affectedFiles: affected },
        ),
      );
    }

    return err(
      corruptError(
        `${encrypted.length} password-protected and ${corrupt.length} damaged file(s) blocked the merge.`,
        {
          affectedFiles: affected,
          encryptedFiles: encrypted.map((f) => f.name),
          corruptFiles: corrupt.map((f) => f.name),
        },
        'Unlock or remove password-protected files, replace damaged ones, then retry.',
      ),
    );
  }

  if (ctx?.signal?.aborted) {
    return err(cancelledError());
  }

  try {
    const bytes = await savePdf(merged);

    ctx?.onProgress?.({
      operation: 'MERGE_FILES',
      filesProcessed: total,
      totalFiles: total,
      fraction: 1,
      message: 'Merge complete',
    });

    return ok({
      filename: ensurePdfFilename(outputFilename),
      bytes,
      pageCount: merged.getPageCount(),
      sourceCount: total,
    });
  } catch (error) {
    return err(
      internalError('Failed to write the merged PDF.', {
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

export const mergeFilesCommand: CommandDefinition<MergeFilesInput, MergeFilesOutput> = {
  name: CommandName.MERGE_FILES,
  description: 'Merge multiple PDF files into a single PDF, preserving page order.',
  inputSchema: mergeFilesInputSchema,
  outputSchema: mergeFilesOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.PDF],
  validate: validateMergeFilesInput,
  execute: executeMergeFiles,
};

export { mergeFilesCommand as MERGE_FILES };
