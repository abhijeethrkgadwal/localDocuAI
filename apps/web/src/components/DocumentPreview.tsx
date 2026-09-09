import { useEffect, useState } from 'react';
import {
  formatAppErrorLine,
  isDocFile,
  isDocxFile,
  isPdfFile,
  type LocalFileRef,
} from '@localdoc/core';
import type { FilesystemAdapter } from '@localdoc/filesystem';
import { useT } from '../i18n';
import { looksLikePdf } from '../lib/pdfMagic';

interface DocumentPreviewProps {
  file: LocalFileRef | null;
  fs: FilesystemAdapter;
}

export function DocumentPreview({ file, fs }: DocumentPreviewProps) {
  const t = useT();
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

      if (isPdfFile(file)) {
        // Magic-byte sniff only — full pdf-lib parse is reserved for Run ops.
        if (!looksLikePdf(result.value)) {
          setError(t('workspace.preview.couldNotReadPdf', { name: file.name }));
          setLoading(false);
          return;
        }

        const copy = new Uint8Array(result.value.byteLength);
        copy.set(result.value);
        const blob = new Blob([copy], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        setLoading(false);
        return;
      }

      if (isDocxFile(file)) {
        const { executeExtractDocxText } = await import('@localdoc/docx');
        if (cancelled) return;
        const extracted = await executeExtractDocxText({
          file: { name: file.name, bytes: result.value },
        });
        if (cancelled) return;
        if (!extracted.ok) {
          setError(formatAppErrorLine(extracted.error));
          setLoading(false);
          return;
        }
        setDocxText(extracted.value.text || t('workspace.preview.noExtractableText'));
        setNote(extracted.value.fidelityNote);
        setLoading(false);
        return;
      }

      if (isDocFile(file)) {
        const { extractPlainTextFromDocBinary } = await import('@localdoc/docx');
        if (cancelled) return;
        const extracted = extractPlainTextFromDocBinary(result.value, file.name);
        if (cancelled) return;
        if (!extracted.ok) {
          setError(formatAppErrorLine(extracted.error));
          setLoading(false);
          return;
        }
        setDocxText(extracted.value || t('workspace.preview.noExtractableText'));
        setNote(t('workspace.preview.docFidelityNote'));
        setLoading(false);
        return;
      }

      setError(t('workspace.preview.unsupported'));
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, fs, t]);

  if (!file) {
    return (
      <div className="rounded-[var(--radius-surface)] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-12 text-center">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {t('workspace.preview.emptyTitle')}
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {t('workspace.preview.emptyBody')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-[var(--text-secondary)]">
          {t('workspace.preview.label')}{' '}
          <span className="font-medium text-[var(--text-primary)]">{file.name}</span>
        </p>
        {url ? (
          <a
            className="text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('workspace.preview.openInNewTab')}
            <span className="sr-only">{t('common.nav.opensInNewTab')}</span>
          </a>
        ) : null}
      </div>
      {loading ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <p className="text-sm text-[var(--text-secondary)]">{t('workspace.preview.loading')}</p>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-[var(--accent-soft)]"
            aria-hidden="true"
          >
            <div className="preview-loader-bar h-full w-1/3 rounded-full bg-[var(--accent)]" />
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {url ? (
        <>
          <iframe
            title={t('workspace.preview.iframeTitle', { name: file.name })}
            src={url}
            className="h-80 w-full rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface)]"
          />
          <p className="text-xs text-[var(--text-tertiary)]">
            {t('workspace.preview.mobileBlankNote')}
          </p>
        </>
      ) : null}
      {docxText ? (
        <div className="max-h-80 overflow-auto rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm whitespace-pre-wrap text-[var(--text-primary)]">
          {docxText}
        </div>
      ) : null}
      {note ? <p className="text-xs text-[var(--text-tertiary)]">{note}</p> : null}
    </div>
  );
}
