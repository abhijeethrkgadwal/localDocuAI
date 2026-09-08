import type { z } from 'zod';
import type { Result } from './result.js';

/** Permissions a command may require from the filesystem adapter. */
export const Permission = {
  READ_FILES: 'read_files',
  WRITE_FILES: 'write_files',
  LIST_DIRECTORY: 'list_directory',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const SupportedFileType = {
  PDF: 'pdf',
  DOCX: 'docx',
  DOC: 'doc',
  /** Any file type (file-management commands). */
  ANY: '*',
} as const;

export type SupportedFileType = (typeof SupportedFileType)[keyof typeof SupportedFileType];

/** Command surface — expand as commands ship. */
export const CommandName = {
  MERGE_FILES: 'MERGE_FILES',
  SPLIT_FILE: 'SPLIT_FILE',
  EXTRACT_PAGES: 'EXTRACT_PAGES',
  DELETE_PAGES: 'DELETE_PAGES',
  REORDER_PAGES: 'REORDER_PAGES',
  ROTATE_PAGES: 'ROTATE_PAGES',
  COMPRESS_PDF: 'COMPRESS_PDF',
  CONVERT_TO_PDF: 'CONVERT_TO_PDF',
  RENAME_FILES: 'RENAME_FILES',
  MOVE_FILES: 'MOVE_FILES',
  COPY_FILES: 'COPY_FILES',
  CREATE_FOLDER: 'CREATE_FOLDER',
  FILTER_FILES: 'FILTER_FILES',
  SORT_FILES: 'SORT_FILES',
} as const;

export type CommandName = (typeof CommandName)[keyof typeof CommandName];

export interface ProgressUpdate {
  operation: string;
  filesProcessed: number;
  totalFiles: number;
  /** 0–1 when reliably known; omit when unknown */
  fraction?: number;
  message?: string;
}

export interface CommandContext {
  signal?: AbortSignal;
  onProgress?: (update: ProgressUpdate) => void;
}

export interface CommandDefinition<TInput, TOutput> {
  name: CommandName;
  description: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  requiredPermissions: readonly Permission[];
  supportedFileTypes: readonly SupportedFileType[];
  validate: (input: TInput) => Result<TInput>;
  execute: (input: TInput, ctx?: CommandContext) => Promise<Result<TOutput>>;
}
