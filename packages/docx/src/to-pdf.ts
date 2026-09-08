import {
  CommandName,
  Permission,
  SupportedFileType,
  err,
  ok,
  parseWithSchema,
  validationError,
  type CommandContext,
  type CommandDefinition,
  type CommandFilePayload,
  type Result,
} from '@localdoc/core';
import { z } from 'zod';
import { gateWordToPdfCapacity } from './capacity.js';
import { extractPlainTextFromDocBinary } from './doc-extract.js';
import {
  checkAbort,
  extractPlainTextFromDocumentXml,
  loadDocxZip,
  readDocumentXml,
} from './shared.js';
import { buildSimpleTextPdf } from './text-to-pdf.js';

const fileSchema: z.ZodType<CommandFilePayload> = z.object({
  name: z.string().min(1),
  bytes: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
});

export const convertToPdfInputSchema = z.object({
  file: fileSchema,
  /** Declared size for the capacity gate (defaults to bytes.byteLength). */
  declaredSizeBytes: z.number().int().nonnegative().optional(),
  outputFilename: z.string().min(1).optional(),
});

export type ConvertToPdfInput = z.infer<typeof convertToPdfInputSchema>;

export const convertToPdfOutputSchema = z.object({
  filename: z.string(),
  bytes: z.custom<Uint8Array>((v) => v instanceof Uint8Array),
  pageCount: z.number().int().positive(),
  sourceFormat: z.enum(['doc', 'docx']),
  fidelityNote: z.string(),
});

export type ConvertToPdfOutput = z.infer<typeof convertToPdfOutputSchema>;

export function validateConvertToPdfInput(input: unknown): Result<ConvertToPdfInput> {
  return parseWithSchema(
    convertToPdfInputSchema,
    input,
    'Choose a DOC or DOCX file to convert to PDF.',
  );
}

function detectSourceFormat(name: string): Result<'doc' | 'docx'> {
  const lower = name.toLowerCase();
  if (lower.endsWith('.docx')) return ok('docx');
  if (lower.endsWith('.doc')) return ok('doc');
  return err(
    validationError(
      'Convert to PDF accepts .doc or .docx files only.',
      'Select a Word document, then run Convert to PDF.',
    ),
  );
}

function ensurePdfFilename(name: string, fallback: string): string {
  const base = name.trim() || fallback;
  if (base.toLowerCase().endsWith('.pdf')) return base;
  return `${base.replace(/\.(docx?|DOCX?)$/, '')}.pdf`;
}

async function extractText(
  format: 'doc' | 'docx',
  file: CommandFilePayload,
  signal?: AbortSignal,
): Promise<Result<string>> {
  const aborted = checkAbort(signal);
  if (!aborted.ok) return aborted;

  if (format === 'docx') {
    const zipResult = await loadDocxZip(file.bytes, file.name);
    if (!zipResult.ok) return zipResult;
    const xmlResult = await readDocumentXml(zipResult.value);
    if (!xmlResult.ok) return xmlResult;
    return ok(extractPlainTextFromDocumentXml(xmlResult.value));
  }

  return extractPlainTextFromDocBinary(file.bytes, file.name);
}

/**
 * Simple local DOC/DOCX → PDF for the web.
 *
 * Capacity is measured first (file size + device hints). Over-capacity jobs are
 * refused with a desktop-app coming-soon recovery — no conversion is attempted.
 *
 * Output is a readable text PDF, not a Word-layout replica.
 */
export async function executeConvertToPdf(
  input: ConvertToPdfInput,
  ctx?: CommandContext,
): Promise<Result<ConvertToPdfOutput>> {
  const validated = validateConvertToPdfInput(input);
  if (!validated.ok) return validated;

  const { file, outputFilename } = validated.value;
  const format = detectSourceFormat(file.name);
  if (!format.ok) return format;

  // Prefer actual payload length; declared size is only a pre-read hint.
  const sizeBytes = Math.max(
    file.bytes.byteLength,
    validated.value.declaredSizeBytes ?? 0,
  );
  const capacity = gateWordToPdfCapacity({
    fileSizeBytes: sizeBytes || file.bytes.byteLength,
    filename: file.name,
  });
  if (!capacity.ok) return capacity;
  ctx?.onProgress?.({
    operation: 'CONVERT_TO_PDF',
    filesProcessed: 0,
    totalFiles: 1,
    fraction: 0.1,
    message: 'Capacity OK — extracting text…',
  });

  const aborted = checkAbort(ctx?.signal);
  if (!aborted.ok) return aborted;

  const textResult = await extractText(format.value, file, ctx?.signal);
  if (!textResult.ok) return textResult;

  ctx?.onProgress?.({
    operation: 'CONVERT_TO_PDF',
    filesProcessed: 0,
    totalFiles: 1,
    fraction: 0.55,
    message: 'Building PDF…',
  });

  const abortedBeforePdf = checkAbort(ctx?.signal);
  if (!abortedBeforePdf.ok) return abortedBeforePdf;

  const pdf = await buildSimpleTextPdf(textResult.value, { signal: ctx?.signal });
  if (!pdf.ok) return pdf;

  const filename = ensurePdfFilename(
    outputFilename ?? file.name,
    format.value === 'docx' ? 'converted.docx.pdf' : 'converted.doc.pdf',
  );

  ctx?.onProgress?.({
    operation: 'CONVERT_TO_PDF',
    filesProcessed: 1,
    totalFiles: 1,
    fraction: 1,
    message: 'Conversion complete',
  });

  let fidelityNote =
    'Simple text PDF (not Word-layout faithful). Complex formatting, images, and headers may be missing.';
  if (pdf.value.emptySource) {
    fidelityNote =
      'No extractable text (empty or images-only). PDF contains a placeholder page. Try exporting as DOCX or wait for the desktop app for richer conversion.';
  } else if (pdf.value.truncated) {
    fidelityNote =
      'Simple text PDF truncated to the web page/character limit. Complex formatting may be missing. Larger conversions are coming in the desktop app.';
  }

  return ok({
    filename,
    bytes: pdf.value.bytes,
    pageCount: pdf.value.pageCount,
    sourceFormat: format.value,
    fidelityNote,
  });
}

/** @deprecated Prefer executeConvertToPdf — kept for older call sites. */
export async function executeDocxToPdf(
  input?: ConvertToPdfInput,
  ctx?: CommandContext,
): Promise<Result<ConvertToPdfOutput>> {
  if (!input) {
    return err(
      validationError(
        'DOCX to PDF requires a file payload.',
        'Select a DOC or DOCX file, then run Convert to PDF.',
      ),
    );
  }
  return executeConvertToPdf(input, ctx);
}

export const convertToPdfCommand: CommandDefinition<ConvertToPdfInput, ConvertToPdfOutput> = {
  name: CommandName.CONVERT_TO_PDF,
  description:
    'Convert a DOC or DOCX file to a simple local PDF when the device can safely handle it.',
  inputSchema: convertToPdfInputSchema,
  outputSchema: convertToPdfOutputSchema,
  requiredPermissions: [Permission.READ_FILES, Permission.WRITE_FILES],
  supportedFileTypes: [SupportedFileType.DOCX, SupportedFileType.DOC],
  validate: validateConvertToPdfInput,
  execute: executeConvertToPdf,
};
