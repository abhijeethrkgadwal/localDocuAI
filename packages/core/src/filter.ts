import type { LocalFileRef } from '@localdoc/core';

export interface FilterSpec {
  /** Case-insensitive substring match against name (and path when present). */
  query?: string;
  /** Extensions without dots, e.g. ["pdf"]. Empty/omit = no extension filter. */
  extensions?: string[];
}

export function filterFiles<T extends Pick<LocalFileRef, 'name' | 'path'>>(
  files: T[],
  spec: FilterSpec,
): T[] {
  const query = spec.query?.trim().toLowerCase();
  const extensions = spec.extensions?.map((e) => e.replace(/^\./, '').toLowerCase());

  return files.filter((file) => {
    if (extensions?.length) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !extensions.includes(ext)) return false;
    }
    if (query) {
      const haystack = `${file.name} ${file.path ?? ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/**
 * Apply a bulk rename pattern.
 * Tokens: {name} stem, {ext} extension, {n} 1-based index, {nn} zero-padded index.
 */
export function applyRenamePattern(filename: string, pattern: string, index1Based: number): string {
  const lastDot = filename.lastIndexOf('.');
  const stem = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  const ext = lastDot > 0 ? filename.slice(lastDot + 1) : '';
  const nn = String(index1Based).padStart(2, '0');

  let next = pattern
    .replaceAll('{name}', stem)
    .replaceAll('{ext}', ext)
    .replaceAll('{nn}', nn)
    .replaceAll('{n}', String(index1Based));

  if (ext && !next.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
    next = `${next}.${ext}`;
  }
  return next;
}
