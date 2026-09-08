import { describe, expect, it } from 'vitest';
import {
  createTestDocx,
  createTestDocxs,
  docxCommandRegistry,
  executeExtractDocxText,
  executeMergeDocx,
} from '../src/index.js';
import { loadDocxZip, readDocumentXml, extractPlainTextFromDocumentXml } from '../src/shared.js';

describe('@localdoc/docx registry', () => {
  it('registers DOCX merge and convert handlers', () => {
    expect(docxCommandRegistry.list().length).toBe(2);
    expect(docxCommandRegistry.has('MERGE_FILES')).toBe(true);
    expect(docxCommandRegistry.has('CONVERT_TO_PDF')).toBe(true);
  });
});

describe('@localdoc/docx merge', () => {
  it('merges two DOCX bodies and preserves text', async () => {
    const a = await createTestDocx('Alpha', { withTable: true });
    const b = await createTestDocx('Beta', { withPageBreak: true });

    const result = await executeMergeDocx({
      files: [
        { name: 'a.docx', bytes: a },
        { name: 'b.docx', bytes: b },
      ],
      outputFilename: 'combined.docx',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.filename).toBe('combined.docx');
    expect(result.value.sourceCount).toBe(2);
    expect(result.value.fidelityNote.toLowerCase()).toContain('body');

    const zip = await loadDocxZip(result.value.bytes, 'combined.docx');
    expect(zip.ok).toBe(true);
    if (!zip.ok) return;
    const xml = await readDocumentXml(zip.value);
    expect(xml.ok).toBe(true);
    if (!xml.ok) return;
    const text = extractPlainTextFromDocumentXml(xml.value);
    expect(text).toContain('Alpha');
    expect(text).toContain('Beta');
  });

  it('rejects fewer than two files', async () => {
    const a = await createTestDocx('Only');
    const result = await executeMergeDocx({
      files: [{ name: 'a.docx', bytes: a }],
    });
    expect(result.ok).toBe(false);
  });

  it('cancels when aborted', async () => {
    const files = await createTestDocxs(2);
    const controller = new AbortController();
    controller.abort();
    const result = await executeMergeDocx({ files }, { signal: controller.signal });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.category).toBe('cancelled');
  });
});

describe('@localdoc/docx extract / convert', () => {
  it('extracts plain text for preview', async () => {
    const bytes = await createTestDocx('PreviewDoc');
    const result = await executeExtractDocxText({
      file: { name: 'preview.docx', bytes },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.text).toContain('PreviewDoc');
  });
});
