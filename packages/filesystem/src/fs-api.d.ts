/// Minimal File System Access API typings for Chromium browsers.
interface FileSystemHandle {
  readonly kind: 'file' | 'directory';
  readonly name: string;
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FileSystemDirectoryHandle>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: Blob | BufferSource | string): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}

interface Window {
  showOpenFilePicker?(options?: object): Promise<FileSystemFileHandle[]>;
  showDirectoryPicker?(options?: object): Promise<FileSystemDirectoryHandle>;
  showSaveFilePicker?(options?: object): Promise<FileSystemFileHandle>;
}
