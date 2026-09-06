import {
  CommandName,
  Permission,
  SupportedFileType,
  filterFiles,
  ok,
  parseWithSchema,
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

export const filterFilesInputSchema = z.object({
  files: z.array(fileRefSchema),
  query: z.string().optional(),
  extensions: z.array(z.string()).optional(),
});

export type FilterFilesInput = z.infer<typeof filterFilesInputSchema>;

export const filterFilesOutputSchema = z.object({
  files: z.array(fileRefSchema),
  matchedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
});

export type FilterFilesOutput = z.infer<typeof filterFilesOutputSchema>;

export function validateFilterFilesInput(input: unknown): Result<FilterFilesInput> {
  return parseWithSchema(filterFilesInputSchema, input, 'Provide a file list to filter.');
}

export async function executeFilterFiles(
  input: FilterFilesInput,
  _ctx?: CommandContext,
): Promise<Result<FilterFilesOutput>> {
  const validated = validateFilterFilesInput(input);
  if (!validated.ok) return validated;

  const { files, query, extensions } = validated.value;
  const matched = filterFiles(files, { query, extensions });
  return ok({
    files: matched,
    matchedCount: matched.length,
    totalCount: files.length,
  });
}

export const filterFilesCommand: CommandDefinition<FilterFilesInput, FilterFilesOutput> = {
  name: CommandName.FILTER_FILES,
  description: 'Filter files by name query and/or extension.',
  inputSchema: filterFilesInputSchema,
  outputSchema: filterFilesOutputSchema,
  requiredPermissions: [Permission.READ_FILES],
  supportedFileTypes: [SupportedFileType.ANY],
  validate: validateFilterFilesInput,
  execute: executeFilterFiles,
};

export { filterFilesCommand as FILTER_FILES };
