import {
  CommandName,
  Permission,
  SupportedFileType,
  err,
  ok,
  parseWithSchema,
  unsupportedError,
  validationError,
  type CommandContext,
  type CommandDefinition,
  type Result,
} from '@localdoc/core';
import { z } from 'zod';
import type { FilesystemAdapter } from '../types.js';

export const createFolderInputSchema = z.object({
  parentDirectoryId: z.string().min(1),
  folderName: z
    .string()
    .min(1)
    .regex(/^[^\\/:*?"<>|]+$/, 'Folder name contains invalid characters.'),
});

export type CreateFolderInput = z.infer<typeof createFolderInputSchema>;

export const createFolderOutputSchema = z.object({
  directory: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type CreateFolderOutput = z.infer<typeof createFolderOutputSchema>;

export function validateCreateFolderInput(input: unknown): Result<CreateFolderInput> {
  return parseWithSchema(
    createFolderInputSchema,
    input,
    'Provide a parent folder and a new folder name.',
  );
}

export async function executeCreateFolder(
  input: CreateFolderInput,
  ctx?: CommandContext,
  adapter?: FilesystemAdapter,
): Promise<Result<CreateFolderOutput>> {
  const validated = validateCreateFolderInput(input);
  if (!validated.ok) return validated;
  if (!adapter) {
    return err(
      validationError(
        'Filesystem adapter is required to create a folder.',
        'Run this command through the app shell.',
      ),
    );
  }
  if (!adapter.capabilities.supportsCreateFolder) {
    return err(
      unsupportedError(
        'Creating folders needs Chrome or Edge with folder access granted.',
        'Select a folder first, then try again in a Chromium browser.',
      ),
    );
  }

  ctx?.onProgress?.({
    operation: 'CREATE_FOLDER',
    filesProcessed: 0,
    totalFiles: 1,
    fraction: 0.2,
    message: `Creating ${validated.value.folderName}`,
  });

  const created = await adapter.createFolder(
    validated.value.parentDirectoryId,
    validated.value.folderName,
  );
  if (!created.ok) return created;

  ctx?.onProgress?.({
    operation: 'CREATE_FOLDER',
    filesProcessed: 1,
    totalFiles: 1,
    fraction: 1,
    message: 'Folder created',
  });

  return ok({ directory: created.value });
}

export const createFolderCommand: CommandDefinition<CreateFolderInput, CreateFolderOutput> = {
  name: CommandName.CREATE_FOLDER,
  description: 'Create a subfolder under a previously selected directory (Chromium).',
  inputSchema: createFolderInputSchema,
  outputSchema: createFolderOutputSchema,
  requiredPermissions: [Permission.WRITE_FILES, Permission.LIST_DIRECTORY],
  supportedFileTypes: [SupportedFileType.ANY],
  validate: validateCreateFolderInput,
  execute: async () =>
    err(
      validationError(
        'CREATE_FOLDER requires a filesystem adapter.',
        'Use executeCreateFolder(input, ctx, adapter) from the app shell.',
      ),
    ),
};

export { createFolderCommand as CREATE_FOLDER };
