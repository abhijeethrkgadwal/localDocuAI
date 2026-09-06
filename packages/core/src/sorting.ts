import { z } from 'zod';

/** Sorting strategies referenced by AI command plans and file commands. */
export const SortingType = {
  NATURAL_FILENAME: 'natural_filename',
  ALPHABETICAL: 'alphabetical',
  MODIFIED_ASC: 'modified_asc',
  MODIFIED_DESC: 'modified_desc',
} as const;

export type SortingType = (typeof SortingType)[keyof typeof SortingType];

export const sortingSchema = z.object({
  type: z.enum([
    SortingType.NATURAL_FILENAME,
    SortingType.ALPHABETICAL,
    SortingType.MODIFIED_ASC,
    SortingType.MODIFIED_DESC,
  ]),
});

export type SortingSpec = z.infer<typeof sortingSchema>;

const NATURAL_CHUNK = /(\d+|\D+)/g;

/** Compare filenames with numeric segments ordered numerically (e.g. 2 before 10). */
export function compareNaturalFilename(a: string, b: string): number {
  const aParts = a.toLowerCase().match(NATURAL_CHUNK) ?? [a];
  const bParts = b.toLowerCase().match(NATURAL_CHUNK) ?? [b];
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    const aPart = aParts[i] ?? '';
    const bPart = bParts[i] ?? '';
    if (aPart === bPart) continue;

    const aNum = /^\d+$/.test(aPart);
    const bNum = /^\d+$/.test(bPart);
    if (aNum && bNum) {
      return Number(aPart) - Number(bPart);
    }
    return aPart.localeCompare(bPart);
  }
  return 0;
}

export interface SortableFile {
  name: string;
  lastModified?: number;
}

export function sortFiles<T extends SortableFile>(files: T[], spec: SortingSpec): T[] {
  const copy = [...files];
  switch (spec.type) {
    case SortingType.NATURAL_FILENAME:
      return copy.sort((a, b) => compareNaturalFilename(a.name, b.name));
    case SortingType.ALPHABETICAL:
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case SortingType.MODIFIED_ASC:
      return copy.sort((a, b) => (a.lastModified ?? 0) - (b.lastModified ?? 0));
    case SortingType.MODIFIED_DESC:
      return copy.sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0));
    default:
      return copy;
  }
}
