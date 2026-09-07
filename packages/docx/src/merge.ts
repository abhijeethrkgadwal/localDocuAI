import {
  CommandName,
  Permission,
  SupportedFileType,
  cancelledError,
  err,
  internalError,
  ok,
  parseWithSchema,
  type CommandContext,
  type CommandDefinition,
  type CommandFilePayload,
  type Result,
} from '@localdoc/core';
import { z } from 'zod';
import {
  checkAbort,
  ensureDocxFilename,
  extractBodyContent,
  insertBodyContent,
  loadDocxZip,
  readDocumentXml,
} from './shared.js';

const fileSchema: z.ZodType<CommandFilePayload> = z.object({
  name: z.string().min(1),
  bytes: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
});

export const mergeDocxInputSchema = z.object({
  files: z.array(fileSchema).min(2, 'At least two DOCX files are required to merge.'),
  outputFilename: z.string().min(1).optional(),
});

export type MergeDocxInput = z.infer<typeof mergeDocxInputSchema>;

export const mergeDocxOutputSchema = z.object({
  filename: z.string(),
  bytes: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
  sourceCount: z.number().int().positive(),
  /** Practical note for UI honesty */
  fidelityNote: z.string(),
});

export type MergeDocxOutput = z.infer<typeof mergeDocxOutputSchema>;

export function validateMergeDocxInput(input: unknown): Result<MergeDocxInput> {
  return parseWithSchema(
    mergeDocxInputSchema,
    input,
    'Select at least two valid DOCX files and try again.',
  );
}

/**
 * Merge DOCX files by appending document body content into the first file.
 *
 * Limitations (by design for MVP):
 * - Headers/footers/styles from later files are not fully merged
 * - Images and other relationships from later files may not copy
 * - Not Word-perfect fidelity — see ADR 0003
 */
export async function executeMergeDocx(
  input: MergeDocxInput,
  ctx?: CommandContext,
): Promise<Result<MergeDocxOutput>> {
  const validated = validateMergeDocxInput(input);
  if (!validated.ok) return validated;

  const { files, outputFilename = 'merged.docx' } = validated.value;
  const total = files.length;

  const aborted = checkAbort(ctx?.signal);
  if (!aborted.ok) return aborted;

  const first = files[0]!;
  const baseZipResult = await loadDocxZip(first.bytes, first.name);
  if (!baseZipResult.ok) return baseZipResult;
  const baseZip = baseZipResult.value;

  const baseXmlResult = await readDocumentXml(baseZip);
  if (!baseXmlResult.ok) return baseXmlResult;
  let documentXml = baseXmlResult.value;

  for (let i = 1; i < files.length; i++) {
    if (ctx?.signal?.aborted) return err(cancelledError());

    const file = files[i]!;
    ctx?.onProgress?.({
      operation: 'MERGE_FILES',
      filesProcessed: i,
      totalFiles: total,
      fraction: i / total,
      message: `Merging ${file.name}`,
    });

    const zipResult = await loadDocxZip(file.bytes, file.name);
    if (!zipResult.ok) return zipResult;

    const xmlResult = await readDocumentXml(zipResult.value);
    if (!xmlResult.ok) return xmlResult;

    const body = extractBodyContent(xmlResult.value);
    if (!body.ok) {
      return err({
        ...body.error,
        details: { ...(body.error.details ?? {}), affectedFiles: [file.name] },
      });
    }

    // Page break between documents when practical
    const pageBreak =
      '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    const inserted = insertBodyContent(documentXml, `${pageBreak}${body.value}`);
    if (!inserted.ok) return inserted;
    documentXml = inserted.value;
  }

  try {
    baseZip.file('word/document.xml', documentXml);
    const saved = await baseZip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
    });

    ctx?.onProgress?.({
      operation: 'MERGE_FILES',
      filesProcessed: total,
      totalFiles: total,
      fraction: 1,
      message: 'DOCX merge complete',
    });

    return ok({
      filename: ensureDocxFilename(outputFilename),
      bytes: saved instanceof Uint8Array ? saved : new Uint8Array(saved),
      sourceCount: total,
      fidelityNote:
        'Merged body content only. Styles, headers/footers, and images from later files may be incomplete.',
    });
  } catch (error) {
    return err(
      internalError('Failed to write the merged DOCX.', {
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

export const mergeDocxCommand: CommandDefinition<MergeDocxInput, MergeDocxOutput> = {
  name: CommandName.MERGE_FILES,
  description:
    'Merge DOCX files by appending body content (practical merge — not full Word fidelity).',
  inputSchema: mergeDocxInputSchema,
  outputSchema: mergeDocxOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.DOCX],
  validate: validateMergeDocxInput,
  execute: executeMergeDocx,
};
