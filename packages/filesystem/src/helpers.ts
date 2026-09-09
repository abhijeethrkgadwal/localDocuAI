import {
  cancelledError,
  err,
  ok,
  type CommandFilePayload,
  type LocalFileRef,
  type ProgressUpdate,
  type Result,
} from '@localdoc/core';
import type { FilesystemAdapter, FilesystemCapabilities } from './types.js';

export function checkAborted(signal?: AbortSignal): Result<void> {
  if (signal?.aborted) {
    return err(cancelledError());
  }
  return ok(undefined);
}

export function filterByExtension(files: LocalFileRef[], extensions?: string[]): LocalFileRef[] {
  if (!extensions?.length) return files;
  const set = new Set(extensions.map((e) => e.replace(/^\./, '').toLowerCase()));
  return files.filter((file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext !== undefined && set.has(ext);
  });
}

export function matchesExtension(filename: string, extensions?: string[]): boolean {
  if (!extensions?.length) return true;
  const set = new Set(extensions.map((e) => e.replace(/^\./, '').toLowerCase()));
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext !== undefined && set.has(ext);
}

export interface ReadAllOptions {
  signal?: AbortSignal;
  onProgress?: (update: ProgressUpdate) => void;
}

/**
 * Sequentially read file bytes through the adapter.
 * Avoids loading everything into the adapter at once beyond what commands need.
 */
export async function readAllBytes(
  adapter: FilesystemAdapter,
  files: LocalFileRef[],
  options: ReadAllOptions = {},
): Promise<Result<CommandFilePayload[]>> {
  const payloads: CommandFilePayload[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const aborted = checkAborted(options.signal);
    if (!aborted.ok) return aborted;

    const file = files[i];
    if (!file) continue;

    options.onProgress?.({
      operation: 'read_files',
      filesProcessed: i,
      totalFiles: total,
      fraction: total > 0 ? i / total : 0,
      message: `Reading ${file.name}`,
    });

    const bytes = await adapter.readBytes(file, { signal: options.signal });
    if (!bytes.ok) return bytes;

    payloads.push({ name: file.name, bytes: bytes.value });
  }

  options.onProgress?.({
    operation: 'read_files',
    filesProcessed: total,
    totalFiles: total,
    fraction: 1,
    message: 'Finished reading files',
  });

  return ok(payloads);
}

/** Short UX copy describing browser filesystem capabilities. */
export function describeCapabilities(capabilities: FilesystemCapabilities): string {
  if (capabilities.supportsDirectoryPicker && capabilities.supportsWriteToHandle) {
    return 'Full local access: folder pick and native save are available (desktop Chrome or Edge).';
  }
  if (capabilities.supportsWebkitDirectory && capabilities.supportsBlobDownload) {
    return 'Select files or a folder, then download results. Native Save As and on-disk create-folder need desktop Chrome or Edge.';
  }
  if (capabilities.supportsBlobDownload) {
    return 'Select files and download results. Folder pick, native Save As, and create-folder need desktop Chrome or Edge.';
  }
  return 'Filesystem features are limited in this environment.';
}

/** True when any folder-style picker can run (FSA or webkitdirectory). */
export function canPickFolder(capabilities: FilesystemCapabilities): boolean {
  return capabilities.supportsDirectoryPicker || capabilities.supportsWebkitDirectory;
}

export function isChromiumFilesystemPreferred(capabilities: FilesystemCapabilities): boolean {
  return capabilities.supportsDirectoryPicker && capabilities.supportsFilePicker;
}
