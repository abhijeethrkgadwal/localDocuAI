import type { LocalFileRef, Permission, Result } from '@localdoc/core';

export type { LocalFileRef };

export interface ReadBytesOptions {
  signal?: AbortSignal;
}

export interface WriteBytesOptions {
  signal?: AbortSignal;
  suggestedName?: string;
}

export interface ListDirectoryOptions {
  recursive?: boolean;
  extensions?: string[];
  signal?: AbortSignal;
}

export type PickDirectoryOptions = ListDirectoryOptions;

export interface DirectoryRef {
  id: string;
  name: string;
}

export interface DirectorySelection {
  directory: DirectoryRef;
  files: LocalFileRef[];
}

export interface FilesystemCapabilities {
  supportsDirectoryPicker: boolean;
  supportsFilePicker: boolean;
  supportsWriteToHandle: boolean;
  supportsBlobDownload: boolean;
  /** Session rename/duplicate without writing to disk */
  supportsSessionMutation: boolean;
  /** Create subfolders via a previously picked directory handle */
  supportsCreateFolder: boolean;
}

export interface FilesystemAdapter {
  readonly capabilities: FilesystemCapabilities;

  pickFiles(options?: {
    multiple?: boolean;
    accept?: Record<string, string[]>;
  }): Promise<Result<LocalFileRef[]>>;

  pickDirectory(options?: PickDirectoryOptions): Promise<Result<DirectorySelection>>;

  registerFiles(files: File[]): Result<LocalFileRef[]>;

  listDirectory(directoryId: string, options?: ListDirectoryOptions): Promise<Result<LocalFileRef[]>>;

  readBytes(file: LocalFileRef, options?: ReadBytesOptions): Promise<Result<Uint8Array>>;

  writeBytes(
    data: Uint8Array,
    options?: WriteBytesOptions,
  ): Promise<
    Result<{ uri: string; method: 'handle' | 'download'; note?: string }>
  >;

  /** Rename within the current session (updates display name / File object). */
  renameInSession(file: LocalFileRef, newName: string): Result<LocalFileRef>;

  /** Duplicate bytes in-session under a new name. */
  duplicateInSession(file: LocalFileRef, newName: string): Promise<Result<LocalFileRef>>;

  /**
   * Create a subfolder under a previously picked directory.
   * Requires File System Access directory permission (Chrome/Edge).
   */
  createFolder(
    directoryId: string,
    folderName: string,
  ): Promise<Result<DirectoryRef>>;

  hasPermission(permission: Permission): boolean;
}

export const PDF_ACCEPT: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
};

export const DOCX_ACCEPT: Record<string, string[]> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export const DOCUMENT_ACCEPT: Record<string, string[]> = {
  ...PDF_ACCEPT,
  ...DOCX_ACCEPT,
};
