import {
  CommandName,
  Permission,
  SupportedFileType,
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

export const moveFilesInputSchema = z.object({
  files: z.array(fileRefSchema).min(1),
  /** Destination folder label for session paths (e.g. "archive") */
  destination: z.string().min(1),
});

export type MoveFilesInput = z.infer<typeof moveFilesInputSchema>;

export const moveFilesOutputSchema = z.object({
  files: z.array(fileRefSchema),
  movedCount: z.number().int().nonnegative(),
});

export type MoveFilesOutput = z.infer<typeof moveFilesOutputSchema>;

export function validateMoveFilesInput(input: unknown): Result<MoveFilesInput> {
  return parseWithSchema(
    moveFilesInputSchema,
    input,
    'Select files and a destination folder name.',
  );
}

/**
 * Session-level move: updates path metadata to destination/name.
 * Native disk moves land with the desktop adapter later.
 */
export async function executeMoveFiles(
  input: MoveFilesInput,
  ctx?: CommandContext,
  _adapter?: FilesystemAdapter,
): Promise<Result<MoveFilesOutput>> {
  const validated = validateMoveFilesInput(input);
  if (!validated.ok) return validated;

  const dest = validated.value.destination.replace(/[\\/]+/g, '/').replace(/^\/+|\/+$/g, '');
  if (!dest) {
    return err(validationError('Destination folder name is required.', 'Example: archive'));
  }

  const moved: LocalFileRef[] = [];
  for (let i = 0; i < validated.value.files.length; i++) {
    if (ctx?.signal?.aborted) return err(cancelledError());
    const file = validated.value.files[i]!;
    ctx?.onProgress?.({
      operation: 'MOVE_FILES',
      filesProcessed: i,
      totalFiles: validated.value.files.length,
      fraction: i / validated.value.files.length,
      message: `Moving ${file.name}`,
    });
    moved.push({
      ...file,
      path: `${dest}/${file.name}`,
    });
  }

  ctx?.onProgress?.({
    operation: 'MOVE_FILES',
    filesProcessed: moved.length,
    totalFiles: moved.length,
    fraction: 1,
    message: 'Move complete (session paths updated)',
  });

  return ok({ files: moved, movedCount: moved.length });
}

export const moveFilesCommand: CommandDefinition<MoveFilesInput, MoveFilesOutput> = {
  name: CommandName.MOVE_FILES,
  description:
    'Update session paths to a destination folder. Native disk moves use the desktop adapter later.',
  inputSchema: moveFilesInputSchema,
  outputSchema: moveFilesOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.ANY],
  validate: validateMoveFilesInput,
  execute: executeMoveFiles,
};

export { moveFilesCommand as MOVE_FILES };
