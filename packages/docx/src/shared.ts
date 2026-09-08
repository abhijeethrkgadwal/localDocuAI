import JSZip from 'jszip';
import {
  cancelledError,
  corruptError,
  encryptedError,
  err,
  ok,
  type Result,
} from '@localdoc/core';

const BODY_OPEN = /<w:body[^>]*>/i;
const SECT_PR = /<w:sectPr[\s\S]*?<\/w:sectPr>/i;

function looksEncryptedDocx(bytes: Uint8Array, errorText: string): boolean {
  const lower = errorText.toLowerCase();
  if (
    lower.includes('encrypted') ||
    lower.includes('password') ||
    lower.includes('encrypt')
  ) {
    return true;
  }
  // OOXML ECMA-376 encrypted packages often start with the OLE compound header
  // rather than a ZIP local file header (PK).
  if (bytes.length >= 8) {
    const ole =
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0;
    const zip = bytes[0] === 0x50 && bytes[1] === 0x4b;
    if (ole && !zip) return true;
  }
  return false;
}

export async function loadDocxZip(bytes: Uint8Array, name: string): Promise<Result<JSZip>> {
  try {
    const zip = await JSZip.loadAsync(bytes);
    if (zip.file('EncryptedPackage') || zip.file('EncryptionInfo')) {
      return err(
        encryptedError(`${name} is password protected.`, { affectedFiles: [name] }, 'Remove the password locally, then convert again.'),
      );
    }
    const doc = zip.file('word/document.xml');
    if (!doc) {
      return err(
        corruptError(`${name} is not a valid DOCX (missing word/document.xml).`, {
          affectedFiles: [name],
        }),
      );
    }
    return ok(zip);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    if (looksEncryptedDocx(bytes, reason)) {
      return err(
        encryptedError(`${name} is password protected.`, { affectedFiles: [name] }, 'Remove the password locally, then convert again.'),
      );
    }
    return err(
      corruptError(`${name} could not be read as a DOCX.`, {
        affectedFiles: [name],
        reason,
      }),
    );
  }
}

/** Body children XML excluding the final sectPr block. */
export function extractBodyContent(documentXml: string): Result<string> {
  const open = documentXml.match(BODY_OPEN);
  if (!open || open.index === undefined) {
    return err(corruptError('DOCX document.xml is missing w:body.'));
  }
  const start = open.index + open[0].length;
  const afterOpen = documentXml.slice(start);
  const sect = afterOpen.match(SECT_PR);
  const end = sect?.index ?? afterOpen.lastIndexOf('</w:body>');
  if (end < 0) {
    return err(corruptError('DOCX document.xml body is malformed.'));
  }
  return ok(afterOpen.slice(0, end).trim());
}

export function insertBodyContent(baseDocumentXml: string, extraContent: string): Result<string> {
  const open = baseDocumentXml.match(BODY_OPEN);
  if (!open || open.index === undefined) {
    return err(corruptError('Base DOCX document.xml is missing w:body.'));
  }
  const start = open.index + open[0].length;
  const afterOpen = baseDocumentXml.slice(start);
  const sect = afterOpen.match(SECT_PR);
  if (!sect || sect.index === undefined) {
    // Append before closing body tag
    const close = baseDocumentXml.lastIndexOf('</w:body>');
    if (close < 0) return err(corruptError('Base DOCX body is malformed.'));
    return ok(
      `${baseDocumentXml.slice(0, close)}${extraContent}${baseDocumentXml.slice(close)}`,
    );
  }
  const absSect = start + sect.index;
  return ok(
    `${baseDocumentXml.slice(0, absSect)}${extraContent}${baseDocumentXml.slice(absSect)}`,
  );
}

/** Very rough text extraction from document.xml for preview — not Word-faithful. */
export function extractPlainTextFromDocumentXml(documentXml: string): string {
  const paragraphs = documentXml.split(/<\/w:p>/i);
  const lines = paragraphs.map((paragraph) => {
    const texts = [...paragraph.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1] ?? '');
    return texts.join('');
  });
  return lines
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

export async function readDocumentXml(zip: JSZip): Promise<Result<string>> {
  const file = zip.file('word/document.xml');
  if (!file) {
    return err(corruptError('DOCX is missing word/document.xml.'));
  }
  try {
    return ok(await file.async('string'));
  } catch (error) {
    return err(
      corruptError('Could not read word/document.xml.', {
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

export function checkAbort(signal?: AbortSignal): Result<void> {
  if (signal?.aborted) return err(cancelledError());
  return ok(undefined);
}

export function ensureDocxFilename(name: string, fallback = 'merged.docx'): string {
  const base = name.trim() || fallback;
  return base.toLowerCase().endsWith('.docx') ? base : `${base}.docx`;
}
