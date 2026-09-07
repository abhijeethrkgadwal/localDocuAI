import {
  CommandName,
  Permission,
  SupportedFileType,
  applyRenamePattern,
  cancelledError,
  err,
  ok,
  parseWithSchema,
  validationError,
  type CommandContext,
  type CommandDefinition,
  type LocalFileRef,
  type Result,
} from '@localdoc/core';
import { z } from 'zod';
import type { FilesystemAdapter } from '../types.js';

const fileRefSchema: z.ZodType<LocalFileRef> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  path: z.string().optional(),
  size: z.number().nonnegative(),
  mimeType: z.string().optional(),
  lastModified: z.number().optional(),
});

export const copyFilesInputSchema = z.object({
  files: z.array(fileRefSchema).min(1),
  /** Optional pattern for copy names; default `{name}-copy.{ext}` via {name}_copy */
  pattern: z.string().min(1).optional(),
});

export type CopyFilesInput = z.infer<typeof copyFilesInputSchema>;

export const copyFilesOutputSchema = z.object({
  files: z.array(fileRefSchema),
  copiedCount: z.number().int().nonnegative(),
});

export type CopyFilesOutput = z.infer<typeof copyFilesOutputSchema>;

export function validateCopyFilesInput(input: unknown): Result<CopyFilesInput> {
  return parseWithSchema(copyFilesInputSchema, input, 'Select at least one file to copy.');
}

export async function executeCopyFiles(
  input: CopyFilesInput,
  ctx?: CommandContext,
  adapter?: FilesystemAdapter,
): Promise<Result<CopyFilesOutput>> {
  const validated = validateCopyFilesInput(input);
  if (!validated.ok) return validated;
  if (!adapter) {
    return err(
      validationError(
        'Filesystem adapter is required to copy files.',
        'Run this command through the app shell.',
      ),
    );
  }

  const pattern = validated.value.pattern ?? '{name}_copy';
  const copies: LocalFileRef[] = [];

  for (let i = 0; i < validated.value.files.length; i++) {
    if (ctx?.signal?.aborted) return err(cancelledError());
    const file = validated.value.files[i]!;
    ctx?.onProgress?.({
      operation: 'COPY_FILES',
      filesProcessed: i,
      totalFiles: validated.value.files.length,
      fraction: i / validated.value.files.length,
      message: `Copying ${file.name}`,
    });

    const newName = applyRenamePattern(file.name, pattern, i + 1);
    const result = await adapter.duplicateInSession(file, newName);
    if (!result.ok) return result;
    copies.push(result.value);
  }

  ctx?.onProgress?.({
    operation: 'COPY_FILES',
    filesProcessed: validated.value.files.length,
    totalFiles: validated.value.files.length,
    fraction: 1,
    message: 'Copy complete',
  });

  return ok({ files: copies, copiedCount: copies.length });
}

export const copyFilesCommand: CommandDefinition<CopyFilesInput, CopyFilesOutput> = {
  name: CommandName.COPY_FILES,
  description: 'Duplicate files in the current local session.',
  inputSchema: copyFilesInputSchema,
  outputSchema: copyFilesOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.ANY],
  validate: validateCopyFilesInput,
  execute: async () =>
    err(
      validationError(
        'COPY_FILES requires a filesystem adapter.',
        'Use executeCopyFiles(input, ctx, adapter) from the app shell.',
      ),
    ),
};

export { copyFilesCommand as COPY_FILES };
