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

export const renameFilesInputSchema = z.object({
  files: z.array(fileRefSchema).min(1),
  pattern: z.string().min(1).optional(),
  renames: z
    .array(z.object({ id: z.string().min(1), newName: z.string().min(1) }))
    .optional(),
});

export type RenameFilesInput = z.infer<typeof renameFilesInputSchema>;

export const renameFilesOutputSchema = z.object({
  files: z.array(fileRefSchema),
  renamedCount: z.number().int().nonnegative(),
});

export type RenameFilesOutput = z.infer<typeof renameFilesOutputSchema>;

export function validateRenameFilesInput(input: unknown): Result<RenameFilesInput> {
  const parsed = parseWithSchema(
    renameFilesInputSchema,
    input,
    'Provide a rename pattern or explicit renames.',
  );
  if (!parsed.ok) return parsed;
  if (!parsed.value.pattern?.trim() && !parsed.value.renames?.length) {
    return err(
      validationError(
        'Provide a rename pattern or explicit renames.',
        'Example pattern: {name}_{nn} or invoice-{n}',
      ),
    );
  }
  return parsed;
}

export async function executeRenameFiles(
  input: RenameFilesInput,
  ctx?: CommandContext,
  adapter?: FilesystemAdapter,
): Promise<Result<RenameFilesOutput>> {
  const validated = validateRenameFilesInput(input);
  if (!validated.ok) return validated;

  if (!adapter) {
    return err(
      validationError(
        'Filesystem adapter is required to rename files.',
        'Run this command through the app shell.',
      ),
    );
  }

  const { files, pattern, renames } = validated.value;
  const renameMap = new Map(renames?.map((r) => [r.id, r.newName]) ?? []);
  const next: LocalFileRef[] = [];
  let renamedCount = 0;

  for (let i = 0; i < files.length; i++) {
    if (ctx?.signal?.aborted) return err(cancelledError());

    const file = files[i]!;
    ctx?.onProgress?.({
      operation: 'RENAME_FILES',
      filesProcessed: i,
      totalFiles: files.length,
      fraction: i / files.length,
      message: `Renaming ${file.name}`,
    });

    const newName =
      renameMap.get(file.id) ??
      (pattern ? applyRenamePattern(file.name, pattern, i + 1) : file.name);

    if (newName === file.name) {
      next.push(file);
      continue;
    }

    const result = adapter.renameInSession(file, newName);
    if (!result.ok) return result;
    next.push(result.value);
    renamedCount += 1;
  }

  ctx?.onProgress?.({
    operation: 'RENAME_FILES',
    filesProcessed: files.length,
    totalFiles: files.length,
    fraction: 1,
    message: 'Rename complete',
  });

  return ok({ files: next, renamedCount });
}

export const renameFilesCommand: CommandDefinition<RenameFilesInput, RenameFilesOutput> = {
  name: CommandName.RENAME_FILES,
  description: 'Bulk-rename files in the current session using a pattern or explicit map.',
  inputSchema: renameFilesInputSchema,
  outputSchema: renameFilesOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.ANY],
  validate: validateRenameFilesInput,
  execute: async () =>
    err(
      validationError(
        'RENAME_FILES requires a filesystem adapter.',
        'Use executeRenameFiles(input, ctx, adapter) from the app shell.',
      ),
    ),
};

export { renameFilesCommand as RENAME_FILES };
