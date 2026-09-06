import {
  CommandName,
  Permission,
  SupportedFileType,
  ok,
  parseWithSchema,
  sortingSchema,
  sortFiles,
  type CommandContext,
  type CommandDefinition,
  type LocalFileRef,
  type Result,
} from '@localdoc/core';
import { z } from 'zod';

const fileRefSchema: z.ZodType<LocalFileRef> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  path: z.string().optional(),
  size: z.number().nonnegative(),
  mimeType: z.string().optional(),
  lastModified: z.number().optional(),
});

export const sortFilesInputSchema = z.object({
  files: z.array(fileRefSchema).min(1),
  sorting: sortingSchema,
});

export type SortFilesInput = z.infer<typeof sortFilesInputSchema>;

export const sortFilesOutputSchema = z.object({
  files: z.array(fileRefSchema),
});

export type SortFilesOutput = z.infer<typeof sortFilesOutputSchema>;

export function validateSortFilesInput(input: unknown): Result<SortFilesInput> {
  return parseWithSchema(sortFilesInputSchema, input, 'Provide files and a sorting type.');
}

export async function executeSortFiles(
  input: SortFilesInput,
  _ctx?: CommandContext,
): Promise<Result<SortFilesOutput>> {
  const validated = validateSortFilesInput(input);
  if (!validated.ok) return validated;
  return ok({ files: sortFiles(validated.value.files, validated.value.sorting) });
}

export const sortFilesCommand: CommandDefinition<SortFilesInput, SortFilesOutput> = {
  name: CommandName.SORT_FILES,
  description: 'Sort files by natural name, alphabetical order, or modified time.',
  inputSchema: sortFilesInputSchema,
  outputSchema: sortFilesOutputSchema,
  requiredPermissions: [Permission.READ_FILES],
  supportedFileTypes: [SupportedFileType.ANY],
  validate: validateSortFilesInput,
  execute: executeSortFiles,
};

export { sortFilesCommand as SORT_FILES };
