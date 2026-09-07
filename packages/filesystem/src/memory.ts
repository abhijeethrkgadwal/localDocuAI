import {
  Permission,
  err,
  notFoundError,
  ok,
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

export interface MemoryFile {
  name: string;
  bytes: Uint8Array;
  path?: string;
  lastModified?: number;
  mimeType?: string;
}

export interface MemoryDirectory {
  name: string;
  files: MemoryFile[];
  children?: Map<string, MemoryDirectory>;
}

export interface MemoryFilesystemOptions {
  capabilities?: Partial<FilesystemCapabilities>;
  pickFilesResult?: MemoryFile[];
  pickDirectoryResult?: MemoryDirectory;
}

export function createMemoryFilesystemAdapter(
  options: MemoryFilesystemOptions = {},
): FilesystemAdapter {
  const capabilities: FilesystemCapabilities = {
    supportsDirectoryPicker: true,
    supportsFilePicker: true,
    supportsWriteToHandle: true,
    supportsBlobDownload: true,
    supportsSessionMutation: true,
    supportsCreateFolder: true,
    ...options.capabilities,
  };

  const fileStore = new Map<string, MemoryFile>();
  const directoryStore = new Map<string, MemoryDirectory>();
  let idCounter = 0;

  function nextId(prefix: string): string {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  }

  function registerMemoryFile(file: MemoryFile): LocalFileRef {
    const id = nextId('file');
    fileStore.set(id, file);
    return {
      id,
      name: file.name,
      path: file.path,
      size: file.bytes.byteLength,
      mimeType: file.mimeType,
      lastModified: file.lastModified,
    };
  }

  return {
    capabilities,

    registerFiles(): Result<LocalFileRef[]> {
      return err(
        unsupportedError(
          'registerFiles is browser-only.',
          'Use pickFiles or seed the memory adapter in tests.',
        ),
      );
    },

    hasPermission(permission: PermissionType): boolean {
      if (permission === Permission.READ_FILES) return true;
      if (permission === Permission.LIST_DIRECTORY) return capabilities.supportsDirectoryPicker;
      if (permission === Permission.WRITE_FILES) {
        return capabilities.supportsWriteToHandle || capabilities.supportsBlobDownload;
      }
      return false;
    },

    async pickFiles(): Promise<Result<LocalFileRef[]>> {
      const files = options.pickFilesResult ?? [];
      return ok(files.map(registerMemoryFile));
    },

    async pickDirectory(pickOptions: PickDirectoryOptions = {}): Promise<Result<DirectorySelection>> {
      const aborted = checkAborted(pickOptions.signal);
      if (!aborted.ok) return aborted;

      if (!capabilities.supportsDirectoryPicker) {
        return err(
          unsupportedError('Folder selection is not available.', 'Select files individually.'),
        );
      }

      const directory = options.pickDirectoryResult;
      if (!directory) {
        return ok({
          directory: { id: nextId('dir'), name: 'empty' },
          files: [],
        });
      }

      const directoryId = nextId('dir');
      if (!directory.children) directory.children = new Map();
      directoryStore.set(directoryId, directory);

      const extensions = pickOptions.extensions ?? ['pdf'];
      const files = directory.files
        .filter((f) => matchesExtension(f.name, extensions))
        .map((f) => registerMemoryFile({ ...f, path: `${directory.name}/${f.name}` }));

      return ok({
        directory: { id: directoryId, name: directory.name },
        files,
      });
    },

    async listDirectory(
      directoryId: string,
      listOptions: ListDirectoryOptions = {},
    ): Promise<Result<LocalFileRef[]>> {
      const aborted = checkAborted(listOptions.signal);
      if (!aborted.ok) return aborted;

      const directory = directoryStore.get(directoryId);
      if (!directory) {
        return err(notFoundError(`Directory not found: ${directoryId}`));
      }

      const extensions = listOptions.extensions ?? ['pdf'];
      return ok(
        directory.files
          .filter((f) => matchesExtension(f.name, extensions))
          .map((f) => registerMemoryFile({ ...f, path: `${directory.name}/${f.name}` })),
      );
    },

    async readBytes(file: LocalFileRef, readOptions?: ReadBytesOptions): Promise<Result<Uint8Array>> {
      const aborted = checkAborted(readOptions?.signal);
      if (!aborted.ok) return aborted;

      const stored = fileStore.get(file.id);
      if (!stored) {
        return err(notFoundError(`File not found in session: ${file.name}`));
      }
      return ok(stored.bytes);
    },

    async writeBytes(
      data: Uint8Array,
      writeOptions?: WriteBytesOptions,
    ):     Promise<Result<{ uri: string; method: 'handle' | 'download'; note?: string }>> {
      const aborted = checkAborted(writeOptions?.signal);
      if (!aborted.ok) return aborted;

      const name = writeOptions?.suggestedName ?? 'output.bin';
      fileStore.set(nextId('out'), { name, bytes: data });
      return ok({ uri: name, method: 'handle' });
    },

    renameInSession(file: LocalFileRef, newName: string): Result<LocalFileRef> {
      const trimmed = newName.trim();
      if (!trimmed) {
        return err(validationError('New file name is required.', 'Enter a non-empty name.'));
      }
      const stored = fileStore.get(file.id);
      if (!stored) {
        return err(notFoundError(`File not found in session: ${file.name}`));
      }
      const updated = { ...stored, name: trimmed };
      fileStore.set(file.id, updated);
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
        return err(notFoundError(`File not found in session: ${file.name}`));
      }
      return ok(
        registerMemoryFile({
          ...stored,
          name: trimmed,
          path: trimmed,
          bytes: new Uint8Array(stored.bytes),
        }),
      );
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
        return err(unsupportedError('Creating folders is not available.', 'Use a writable adapter.'));
      }
      const parent = directoryStore.get(directoryId);
      if (!parent) {
        return err(notFoundError(`Directory not found: ${directoryId}`));
      }
      if (!parent.children) parent.children = new Map();
      const child: MemoryDirectory = { name: trimmed, files: [], children: new Map() };
      parent.children.set(trimmed, child);
      const id = nextId('dir');
      directoryStore.set(id, child);
      return ok({ id, name: trimmed });
    },
  };
}
