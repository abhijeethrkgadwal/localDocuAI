interface PrivacyStatusProps {
  filesOnDevice: number;
  processingLocation: string;
  cloudDocumentProcessing: string;
  aiProcessing: string;
}

export function PrivacyStatus({
  filesOnDevice,
  processingLocation,
  cloudDocumentProcessing,
  aiProcessing,
}: PrivacyStatusProps) {
  return (
    <aside
      className="rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/40 px-4 py-3 text-sm"
      aria-label="Privacy status"
    >
      <p className="font-medium text-[var(--accent)]">Privacy status</p>
      <ul className="mt-2 grid gap-1 text-[var(--ink-muted)] sm:grid-cols-2">
        <li>Files on device: {filesOnDevice}</li>
        <li>Document processing: {processingLocation}</li>
        <li>Cloud document processing: {cloudDocumentProcessing}</li>
        <li>AI processing: {aiProcessing}</li>
      </ul>
      <p className="mt-2 text-xs">
        Document contents are not uploaded to LocalDoc servers. Phase 1 has no product analytics
        pipeline.
      </p>
    </aside>
  );
}
