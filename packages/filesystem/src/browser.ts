/// <reference path="./fs-api.d.ts" />
import {
  Permission,
  cancelledError,
  err,
  notFoundError,
  ok,
  permissionError,
  unsupportedError,
  validationError,
  type LocalFileRef,
  type Permission as PermissionType,
  type Result,
} from '@localdoc/core';
import { checkAborted, matchesExtension } from './helpers.js';
import type {
  DirectoryRef,
  DirectorySelection,
  FilesystemAdapter,
  FilesystemCapabilities,
  ListDirectoryOptions,
  PickDirectoryOptions,
  ReadBytesOptions,
  WriteBytesOptions,
} from './types.js';

export interface BrowserFilesystemAdapterOptions {
  capabilities?: Partial<FilesystemCapabilities>;
}

function detectCapabilities(): FilesystemCapabilities {
  const hasWindow = typeof window !== 'undefined';
  const w = hasWindow ? window : undefined;

  return {
    supportsDirectoryPicker: Boolean(w?.showDirectoryPicker),
    supportsFilePicker: Boolean(w?.showOpenFilePicker),
    supportsWriteToHandle: Boolean(w?.showSaveFilePicker),
    supportsBlobDownload: hasWindow && typeof document !== 'undefined',
    supportsSessionMutation: true,
    supportsCreateFolder: Boolean(w?.showDirectoryPicker),
  };
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

async function collectFromDirectory(
  dirHandle: FileSystemDirectoryHandle,
  registerFile: (file: File, path?: string) => LocalFileRef,
  options: {
    recursive: boolean;
    extensions: string[];
    signal?: AbortSignal;
    basePath: string;
  },
): Promise<Result<LocalFileRef[]>> {
  const refs: LocalFileRef[] = [];

  for await (const [name, handle] of dirHandle.entries()) {
    const aborted = checkAborted(options.signal);
    if (!aborted.ok) return aborted;

    const path = `${options.basePath}/${name}`;

    if (handle.kind === 'file') {
      if (!matchesExtension(name, options.extensions)) continue;
      const file = await (handle as FileSystemFileHandle).getFile();
      refs.push(registerFile(file, path));
      continue;
    }

    if (handle.kind === 'directory' && options.recursive) {
      const nested = await collectFromDirectory(handle as FileSystemDirectoryHandle, registerFile, {
        ...options,
        basePath: path,
      });
      if (!nested.ok) return nested;
      refs.push(...nested.value);
    }
  }

  return ok(refs);
}

/**
 * Browser filesystem adapter.
 * Uses File System Access API when available; falls back to input/download.
 * Document contents are never uploaded.
 */
export function createBrowserFilesystemAdapter(
  options: BrowserFilesystemAdapterOptions = {},
): FilesystemAdapter {
  const capabilities: FilesystemCapabilities = {
    ...detectCapabilities(),
    ...options.capabilities,
  };

  const fileStore = new Map<string, File>();
  const directoryStore = new Map<string, FileSystemDirectoryHandle>();

  function registerFile(file: File, path?: string): LocalFileRef {
    const id = newId();
    fileStore.set(id, file);
    return {
      id,
      name: file.name,
      path,
      size: file.size,
      mimeType: file.type || undefined,
      lastModified: file.lastModified,
    };
  }

  return {
    capabilities,

    registerFiles(files: File[]): Result<LocalFileRef[]> {
      return ok(files.map((file) => registerFile(file)));
    },

    hasPermission(permission: PermissionType): boolean {
      if (permission === Permission.READ_FILES) return true;
      if (permission === Permission.LIST_DIRECTORY) return capabilities.supportsDirectoryPicker;
      if (permission === Permission.WRITE_FILES) {
        return capabilities.supportsWriteToHandle || capabilities.supportsBlobDownload;
      }
      return false;
    },

    async pickFiles(pickOptions = {}): Promise<Result<LocalFileRef[]>> {
      const multiple = pickOptions.multiple ?? true;

      if (capabilities.supportsFilePicker && typeof window !== 'undefined' && window.showOpenFilePicker) {
        try {
          const handles = await window.showOpenFilePicker({
            multiple,
            types: pickOptions.accept
              ? [{ description: 'Documents', accept: pickOptions.accept }]
              : undefined,
          });
          const refs: LocalFileRef[] = [];
          for (const handle of handles) {
            const file = await handle.getFile();
            refs.push(registerFile(file, handle.name));
          }
          return ok(refs);
        } catch (e) {
          if (e instanceof DOMException && e.name === 'AbortError') {
            return err(cancelledError('File selection was cancelled.'));
          }
          return err(
            permissionError(
              'Could not open the file picker.',
              'Allow file access when prompted, or use drag-and-drop.',
            ),
          );
        }
      }

      return new Promise((resolve) => {
        let settled = false;
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = multiple;
        if (pickOptions.accept) {
          input.accept = Object.values(pickOptions.accept).flat().join(',');
        }

        const settle = (result: Result<LocalFileRef[]>) => {
          if (settled) return;
          settled = true;
          window.removeEventListener('focus', onWindowFocus);
          input.removeEventListener('cancel', onCancel);
          resolve(result);
        };

        const onCancel = () => settle(err(cancelledError('File selection was cancelled.')));
        const onWindowFocus = () => {
          // Browsers without a reliable `cancel` event: treat refocus with no
          // selection as a user dismiss so the Promise cannot hang forever.
          window.setTimeout(() => {
            if (!settled && (!input.files || input.files.length === 0)) {
              settle(err(cancelledError('File selection was cancelled.')));
            }
          }, 400);
        };

        input.onchange = () => {
          const files = Array.from(input.files ?? []);
          settle(ok(files.map((f) => registerFile(f))));
        };
        input.addEventListener('cancel', onCancel);
        window.addEventListener('focus', onWindowFocus);
        input.click();
      });
    },

    async pickDirectory(
      pickOptions: PickDirectoryOptions = {},
    ): Promise<Result<DirectorySelection>> {
      const aborted = checkAborted(pickOptions.signal);
      if (!aborted.ok) return aborted;

      if (
        !capabilities.supportsDirectoryPicker ||
        typeof window === 'undefined' ||
        !window.showDirectoryPicker
      ) {
        return err(
          unsupportedError(
            'Folder selection needs Chrome or Edge for the best experience.',
            'Select PDF files individually, or open this app in Chrome or Edge.',
          ),
        );
      }

      try {
        const dirHandle = await window.showDirectoryPicker();
        const directoryId = newId();
        directoryStore.set(directoryId, dirHandle);

        const files = await collectFromDirectory(dirHandle, registerFile, {
          recursive: pickOptions.recursive ?? true,
          extensions: pickOptions.extensions ?? ['pdf'],
          signal: pickOptions.signal,
          basePath: dirHandle.name,
        });
        if (!files.ok) return files;

        return ok({
          directory: { id: directoryId, name: dirHandle.name },
          files: files.value,
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return err(cancelledError('Folder selection was cancelled.'));
        }
        return err(
          permissionError(
            'Could not access the selected folder.',
            'Grant folder permission when prompted.',
          ),
        );
      }
    },

    async listDirectory(
      directoryId: string,
      listOptions: ListDirectoryOptions = {},
    ): Promise<Result<LocalFileRef[]>> {
      const aborted = checkAborted(listOptions.signal);
      if (!aborted.ok) return aborted;

      const dirHandle = directoryStore.get(directoryId);
      if (!dirHandle) {
        return err(
          notFoundError(
            'Folder is no longer available in this session.',
            'Select the folder again.',
          ),
        );
      }

      try {
        return await collectFromDirectory(dirHandle, registerFile, {
          recursive: listOptions.recursive ?? true,
          extensions: listOptions.extensions ?? ['pdf'],
          signal: listOptions.signal,
          basePath: dirHandle.name,
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return err(cancelledError('Folder listing was cancelled.'));
        }
        return err(
          permissionError(
            'Could not read files from this folder.',
            'Grant folder permission when prompted, or select the folder again.',
          ),
        );
      }
    },

    async readBytes(file: LocalFileRef, readOptions?: ReadBytesOptions): Promise<Result<Uint8Array>> {
      const aborted = checkAborted(readOptions?.signal);
      if (!aborted.ok) return aborted;

      const stored = fileStore.get(file.id);
      if (!stored) {
        return err(
          notFoundError(`File not found in local session: ${file.name}`, 'Re-select the file and try again.'),
        );
      }
      const buffer = await stored.arrayBuffer();
      const abortedAfter = checkAborted(readOptions?.signal);
      if (!abortedAfter.ok) return abortedAfter;
      return ok(new Uint8Array(buffer));
    },

    async writeBytes(
      data: Uint8Array,
      writeOptions?: WriteBytesOptions,
    ): Promise<Result<{ uri: string; method: 'handle' | 'download'; note?: string }>> {
      const aborted = checkAborted(writeOptions?.signal);
      if (!aborted.ok) return aborted;
      const suggestedName = writeOptions?.suggestedName ?? 'merged.pdf';
      const payload = toArrayBuffer(data);
      const isDocx = suggestedName.toLowerCase().endsWith('.docx');
      const mime = isDocx
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';
      const accept = isDocx
        ? { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
        : { 'application/pdf': ['.pdf'] };
      const description = isDocx ? 'Word document' : 'PDF';

      let savePickerFailed = false;

      if (
        capabilities.supportsWriteToHandle &&
        typeof window !== 'undefined' &&
        window.showSaveFilePicker
      ) {
        let writable: FileSystemWritableFileStream | undefined;
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName,
            types: [{ description, accept }],
          });
          const abortedAfterPicker = checkAborted(writeOptions?.signal);
          if (!abortedAfterPicker.ok) return abortedAfterPicker;
          writable = await handle.createWritable();
          const abortedBeforeWrite = checkAborted(writeOptions?.signal);
          if (!abortedBeforeWrite.ok) return abortedBeforeWrite;
          await writable.write(payload);
          await writable.close();
          writable = undefined;
          return ok({ uri: handle.name, method: 'handle' });
        } catch (e) {
          if (e instanceof DOMException && e.name === 'AbortError') {
            return err(cancelledError('Save was cancelled.'));
          }
          savePickerFailed = true;
        } finally {          if (writable) {
            try {
              await writable.abort();
            } catch {
              /* ignore close failures during fallback */
            }
          }
        }
      }

      if (!capabilities.supportsBlobDownload) {
        return err(
          unsupportedError(
            'Cannot save the file in this environment.',
            'Use a modern desktop browser such as Chrome or Edge.',
          ),
        );
      }

      const abortedBeforeDownload = checkAborted(writeOptions?.signal);
      if (!abortedBeforeDownload.ok) return abortedBeforeDownload;

      const blob = new Blob([payload], { type: mime });      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = suggestedName;
      anchor.click();
      URL.revokeObjectURL(url);
      return ok({
        uri: suggestedName,
        method: 'download',
        note: savePickerFailed
          ? 'Native save failed; downloaded a copy instead.'
          : undefined,
      });
    },

    renameInSession(file: LocalFileRef, newName: string): Result<LocalFileRef> {
      const trimmed = newName.trim();
      if (!trimmed) {
        return err(validationError('New file name is required.', 'Enter a non-empty name.'));
      }
      const stored = fileStore.get(file.id);
      if (!stored) {
        return err(
          notFoundError(`File not found in local session: ${file.name}`, 'Re-select the file and try again.'),
        );
      }
      const renamed = new File([stored], trimmed, {
        type: stored.type,
        lastModified: stored.lastModified,
      });
      fileStore.set(file.id, renamed);
      return ok({
        ...file,
        name: trimmed,
        path: file.path ? file.path.replace(/[^/\\]+$/, trimmed) : trimmed,
      });
    },

    async duplicateInSession(file: LocalFileRef, newName: string): Promise<Result<LocalFileRef>> {
      const trimmed = newName.trim();
      if (!trimmed) {
        return err(validationError('Copy name is required.', 'Enter a non-empty name.'));
      }
      const stored = fileStore.get(file.id);
      if (!stored) {
        return err(
          notFoundError(`File not found in local session: ${file.name}`, 'Re-select the file and try again.'),
        );
      }
      const copy = new File([stored], trimmed, {
        type: stored.type,
        lastModified: Date.now(),
      });
      return ok(registerFile(copy, trimmed));
    },

    async createFolder(
      directoryId: string,
      folderName: string,
    ): Promise<Result<DirectoryRef>> {
      const trimmed = folderName.trim();
      if (!trimmed) {
        return err(validationError('Folder name is required.', 'Enter a non-empty folder name.'));
      }
      if (/[\\/:*?"<>|]/.test(trimmed)) {
        return err(
          validationError(
            'Folder name contains invalid characters.',
            'Avoid \\ / : * ? " < > | in the name.',
          ),
        );
      }
      if (!capabilities.supportsCreateFolder) {
        return err(
          unsupportedError(
            'Creating folders needs Chrome or Edge with folder access.',
            'Select a folder first in a Chromium browser.',
          ),
        );
      }
      const parent = directoryStore.get(directoryId);
      if (!parent) {
        return err(
          notFoundError(
            'Parent folder is no longer available in this session.',
            'Select the folder again, then create a subfolder.',
          ),
        );
      }
      try {
        const child = await parent.getDirectoryHandle(trimmed, { create: true });
        const id = newId();
        directoryStore.set(id, child);
        return ok({ id, name: child.name });
      } catch {
        return err(
          permissionError(
            `Could not create folder “${trimmed}”.`,
            'Grant write permission to the folder when prompted.',
          ),
        );
      }
    },
  };
}
