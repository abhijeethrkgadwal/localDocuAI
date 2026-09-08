import { useEffect, useState } from 'react';
import { formatAppErrorLine, type LocalFileRef } from '@localdoc/core';
import type { FilesystemAdapter } from '@localdoc/filesystem';
import { looksLikePdf } from '../lib/pdfMagic';

interface PdfPreviewProps {
  file: LocalFileRef | null;
  fs: FilesystemAdapter;
}

export function PdfPreview({ file, fs }: PdfPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      setError(null);
      setUrl(null);
      if (!file) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await fs.readBytes(file);
      if (cancelled) return;

      if (!result.ok) {
        setError(formatAppErrorLine(result.error));
        setLoading(false);
        return;
      }

      if (!looksLikePdf(result.value)) {
        setError(`${file.name} could not be read as a PDF.`);
        setLoading(false);
        return;
      }

      const copy = new Uint8Array(result.value.byteLength);
      copy.set(result.value);
      const blob = new Blob([copy], { type: 'application/pdf' });
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
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
      <div className="rounded-[var(--radius-surface)] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-12 text-center">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Select a document to preview it here.
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Preview stays on this device.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--text-secondary)]">
        Preview: <span className="font-medium text-[var(--text-primary)]">{file.name}</span>
      </p>
      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]" role="status">
          Loading preview…
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {url ? (
        <iframe
          title={`Preview of ${file.name}`}
          src={url}
          className="h-80 w-full rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface)]"
        />
      ) : null}
    </div>
  );
}
