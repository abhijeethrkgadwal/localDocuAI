import { SupportedFileType } from './commands.js';

/** Platform-neutral file handle. Bytes are read on demand via the filesystem adapter. */
export interface LocalFileRef {
  id: string;
  name: string;
  /** Absolute or display path when known */
  path?: string;
  size: number;
  mimeType?: string;
  /** Last modified time in ms since epoch, when available */
  lastModified?: number;
}

/** In-memory file payload passed into command handlers after local reads. */
export interface CommandFilePayload {
  name: string;
  bytes: Uint8Array;
}

export interface FileSource {
  type: 'files' | 'folder';
  fileType: SupportedFileType;
}

export function inferFileType(filename: string): SupportedFileType | undefined {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return SupportedFileType.PDF;
  if (ext === 'docx') return SupportedFileType.DOCX;
  return undefined;
}

export function isPdfFile(file: Pick<LocalFileRef, 'name' | 'mimeType'>): boolean {
  if (file.mimeType === 'application/pdf') return true;
  return file.name.toLowerCase().endsWith('.pdf');
}

export function isDocxFile(file: Pick<LocalFileRef, 'name' | 'mimeType'>): boolean {
  if (
    file.mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return true;
  }
  return file.name.toLowerCase().endsWith('.docx');
}
