import { corruptError, err, ok, type Result } from '@localdoc/core';

const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] as const;

function looksLikeOle(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  return OLE_MAGIC.every((b, i) => bytes[i] === b);
}

function isPrintableAscii(code: number): boolean {
  return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126);
}

/**
 * Best-effort plain-text scrape from legacy .doc (OLE) binaries.
 * Not Word-faithful — good enough for simple local conversion on the web.
 */
export function extractPlainTextFromDocBinary(
  bytes: Uint8Array,
  filename: string,
): Result<string> {
  const WEB_DOC_SCAN_MAX_BYTES = 12 * 1024 * 1024;
  if (bytes.byteLength > WEB_DOC_SCAN_MAX_BYTES) {
    return err(
      corruptError(
        `${filename} is too large for simple web .doc extraction (${(bytes.byteLength / (1024 * 1024)).toFixed(1)} MB).`,
        { affectedFiles: [filename] },
        'Try a smaller file, export as DOCX, or wait for the desktop app (coming soon).',
      ),
    );
  }

  if (!looksLikeOle(bytes)) {
    return err(
      corruptError(`${filename} is not a recognizable Word .doc file.`, {
        affectedFiles: [filename],
      }),
    );
  }

  const utf16Chunks: string[] = [];
  let run = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = bytes[i]! | (bytes[i + 1]! << 8);
    if (code === 0) {
      if (run.length >= 4) utf16Chunks.push(run);
      run = '';
      continue;
    }
    if (isPrintableAscii(code) || (code >= 160 && code <= 255)) {
      run += String.fromCharCode(code);
    } else {
      if (run.length >= 4) utf16Chunks.push(run);
      run = '';
    }
  }
  if (run.length >= 4) utf16Chunks.push(run);

  // Fallback: ASCII-ish runs when UTF-16 yields little.
  const asciiChunks: string[] = [];
  let ascii = '';
  for (let i = 0; i < bytes.length; i++) {
    const code = bytes[i]!;
    if (isPrintableAscii(code)) {
      ascii += String.fromCharCode(code);
    } else {
      if (ascii.length >= 8) asciiChunks.push(ascii.trim());
      ascii = '';
    }
  }
  if (ascii.length >= 8) asciiChunks.push(ascii.trim());

  const utf16Text = utf16Chunks.join('\n').replace(/[ \t]+\n/g, '\n').trim();
  const asciiText = asciiChunks
    .filter((c) => /[A-Za-z]{3,}/.test(c))
    .join('\n')
    .trim();

  const text = utf16Text.length >= 40 ? utf16Text : asciiText.length > utf16Text.length ? asciiText : utf16Text;

  if (!text || text.length < 8) {
    return err(
      corruptError(
        `${filename} had no extractable text for simple web conversion.`,
        { affectedFiles: [filename] },
        'Try a simpler document, export as DOCX, or wait for the desktop app (coming soon) for richer .doc support.',
      ),
    );
  }

  return ok(text);
}
