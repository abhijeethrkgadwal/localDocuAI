import {
  CommandName,
  Permission,
  SupportedFileType,
  err,
  internalError,
  ok,
  parseWithSchema,
  validationError,
  type CommandContext,
  type CommandDefinition,
  type Result,
} from '@localdoc/core';
import { z } from 'zod';
import {
  applyRotation,
  checkAbort,
  commandFileSchema,
  ensurePdfFilename,
  loadPdfDocument,
  parsePageSpec,
  savePdf,
  type RotationDegrees,
} from './shared.js';

export const rotatePagesInputSchema = z.object({
  file: commandFileSchema,
  /** Degrees to rotate clockwise */
  rotation: z.union([z.literal(90), z.literal(180), z.literal(270)]),
  /** 1-based pages; omit / empty = all pages */
  pages: z.array(z.number().int().positive()).optional(),
  pageSpec: z.string().optional(),
  outputFilename: z.string().min(1).optional(),
});

export type RotatePagesInput = z.infer<typeof rotatePagesInputSchema>;

export const rotatePagesOutputSchema = z.object({
  filename: z.string(),
  bytes: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
  pageCount: z.number().int().positive(),
  rotatedPages: z.array(z.number().int().positive()),
  rotation: z.union([z.literal(90), z.literal(180), z.literal(270)]),
});

export type RotatePagesOutput = z.infer<typeof rotatePagesOutputSchema>;

export function validateRotatePagesInput(input: unknown): Result<RotatePagesInput> {
  return parseWithSchema(
    rotatePagesInputSchema,
    input,
    'Choose a PDF and a rotation of 90, 180, or 270 degrees.',
  );
}

export async function executeRotatePages(
  input: RotatePagesInput,
  ctx?: CommandContext,
): Promise<Result<RotatePagesOutput>> {
  const validated = validateRotatePagesInput(input);
  if (!validated.ok) return validated;

  const aborted = checkAbort(ctx?.signal);
  if (!aborted.ok) return aborted;

  const { file, rotation, outputFilename } = validated.value;
  const loaded = await loadPdfDocument(file.name, file.bytes);
  if (!loaded.ok) return loaded;

  const doc = loaded.value;
  const pageCount = doc.getPageCount();

  let targets: number[];
  if (validated.value.pageSpec?.trim()) {
    const parsed = parsePageSpec(validated.value.pageSpec, pageCount);
    if (!parsed.ok) return parsed;
    targets = parsed.value;
  } else if (validated.value.pages?.length) {
    targets = [...new Set(validated.value.pages)].sort((a, b) => a - b);
    for (const p of targets) {
      if (p > pageCount) {
        return err(
          validationError(
            `Page ${p} is outside this PDF (${pageCount} pages).`,
            'Check the page count and try again.',
          ),
        );
      }
    }
  } else {
    targets = Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  ctx?.onProgress?.({
    operation: 'ROTATE_PAGES',
    filesProcessed: 0,
    totalFiles: 1,
    fraction: 0.3,
    message: `Rotating ${targets.length} page(s) by ${rotation}°`,
  });

  try {
    for (const page1 of targets) {
      const page = doc.getPage(page1 - 1);
      applyRotation(page, rotation as RotationDegrees);
    }
    const bytes = await savePdf(doc);

    ctx?.onProgress?.({
      operation: 'ROTATE_PAGES',
      filesProcessed: 1,
      totalFiles: 1,
      fraction: 1,
      message: 'Rotate complete',
    });

    return ok({
      filename: ensurePdfFilename(
        outputFilename ?? `${file.name.replace(/\.pdf$/i, '')}-rotated.pdf`,
      ),
      bytes,
      pageCount,
      rotatedPages: targets,
      rotation: rotation as RotationDegrees,
    });
  } catch (error) {
    return err(
      internalError('Failed to rotate pages.', {
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

export const rotatePagesCommand: CommandDefinition<RotatePagesInput, RotatePagesOutput> = {
  name: CommandName.ROTATE_PAGES,
  description: 'Rotate selected pages (or all pages) by 90, 180, or 270 degrees.',
  inputSchema: rotatePagesInputSchema,
  outputSchema: rotatePagesOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.PDF],
  validate: validateRotatePagesInput,
  execute: executeRotatePages,
};

export { rotatePagesCommand as ROTATE_PAGES };
