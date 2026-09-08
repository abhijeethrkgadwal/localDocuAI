import {
  err,
  ok,
  parseWithSchema,
  validationError,
  type CommandContext,
  type CommandFilePayload,
  type Result,
} from '@localdoc/core';
import { z } from 'zod';
import {
  checkAbort,
  extractPlainTextFromDocumentXml,
  loadDocxZip,
  readDocumentXml,
} from './shared.js';

const fileSchema: z.ZodType<CommandFilePayload> = z.object({
  name: z.string().min(1),
  bytes: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
});

export const extractDocxTextInputSchema = z.object({
  file: fileSchema,
});

export type ExtractDocxTextInput = z.infer<typeof extractDocxTextInputSchema>;

export const extractDocxTextOutputSchema = z.object({
  text: z.string(),
  filename: z.string(),
  fidelityNote: z.string(),
});

export type ExtractDocxTextOutput = z.infer<typeof extractDocxTextOutputSchema>;

export function validateExtractDocxTextInput(input: unknown): Result<ExtractDocxTextInput> {
  return parseWithSchema(extractDocxTextInputSchema, input, 'Choose a DOCX file to preview.');
}

export async function executeExtractDocxText(
  input: ExtractDocxTextInput,
  ctx?: CommandContext,
): Promise<Result<ExtractDocxTextOutput>> {
  const validated = validateExtractDocxTextInput(input);
  if (!validated.ok) return validated;

  const aborted = checkAbort(ctx?.signal);
  if (!aborted.ok) return aborted;

  const { file } = validated.value;
  const zipResult = await loadDocxZip(file.bytes, file.name);
  if (!zipResult.ok) return zipResult;

  const xmlResult = await readDocumentXml(zipResult.value);
  if (!xmlResult.ok) return xmlResult;

  const text = extractPlainTextFromDocumentXml(xmlResult.value);
  return ok({
    text,
    filename: file.name,
    fidelityNote:
      'Plain-text preview extracted from document.xml — not a full Word layout preview.',
  });
}

export function validateDocxOnlyFiles(files: { name: string }[]): Result<void> {
  const nonDocx = files.filter((f) => !f.name.toLowerCase().endsWith('.docx'));
  if (nonDocx.length) {
    return err(
      validationError(
        'DOCX merge requires all selected files to be .docx.',
        'Remove non-DOCX files or run PDF merge separately.',
      ),
    );
  }
  return ok(undefined);
}
