import { useEffect, useState } from 'react';
import { formatAppErrorLine, isDocxFile, isPdfFile, type LocalFileRef } from '@localdoc/core';
import { executeExtractDocxText } from '@localdoc/docx';
import type { FilesystemAdapter } from '@localdoc/filesystem';

interface DocumentPreviewProps {
  file: LocalFileRef | null;
  fs: FilesystemAdapter;
}

export function DocumentPreview({ file, fs }: DocumentPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [docxText, setDocxText] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      setError(null);
      setUrl(null);
      setDocxText(null);
      setNote(null);
      if (!file) return;

      setLoading(true);
      const result = await fs.readBytes(file);
      if (cancelled) return;

      if (!result.ok) {
        setError(formatAppErrorLine(result.error));
        setLoading(false);
        return;
      }

      if (isPdfFile(file)) {
        const copy = new Uint8Array(result.value.byteLength);
        copy.set(result.value);
        const blob = new Blob([copy], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        setLoading(false);
        return;
      }

      if (isDocxFile(file)) {
        const extracted = await executeExtractDocxText({
          file: { name: file.name, bytes: result.value },
        });
        if (cancelled) return;
        if (!extracted.ok) {
          setError(formatAppErrorLine(extracted.error));
          setLoading(false);
          return;
        }
        setDocxText(extracted.value.text || '(No extractable text found.)');
        setNote(extracted.value.fidelityNote);
        setLoading(false);
        return;
      }

      setError('Preview supports PDF and DOCX only. Select a supported document.');
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, fs]);

  if (!file) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-12 text-center text-sm text-[var(--ink-muted)]">
        Select a file in the list to preview it locally.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--ink-muted)]">
        Preview: <span className="font-medium text-[var(--ink)]">{file.name}</span> (local only)
      </p>
      {loading ? <p className="text-sm text-[var(--ink-muted)]">Loading preview…</p> : null}
      {error ? <p className="text-sm text-[var(--warn)]">{error}</p> : null}
      {url ? (
        <iframe
          title={`Preview of ${file.name}`}
          src={url}
          className="h-80 w-full rounded-xl border border-[var(--border)] bg-white"
        />
      ) : null}
      {docxText ? (
        <div className="max-h-80 overflow-auto rounded-xl border border-[var(--border)] bg-white p-4 text-sm whitespace-pre-wrap">
          {docxText}
        </div>
      ) : null}
      {note ? <p className="text-xs text-[var(--ink-muted)]">{note}</p> : null}
    </div>
  );
}
