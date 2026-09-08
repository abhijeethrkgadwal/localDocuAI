interface PrivacyStatusProps {
  filesOnDevice: number;
  processingLocation: string;
  cloudDocumentProcessing: string;
  aiProcessing: string;
}

/** Compact privacy indicators (used by TrustStatusStrip; kept for reuse). */
export function PrivacyStatus({
  filesOnDevice,
  processingLocation,
  cloudDocumentProcessing,
  aiProcessing,
}: PrivacyStatusProps) {
  return (
    <aside className="flex flex-wrap gap-2" aria-label="Privacy status">
      <span className="status-pill">
        <span
          className="status-dot"
          style={{ backgroundColor: 'var(--accent)' }}
          aria-hidden
        />
        Local processing
      </span>
      <span className="status-pill">Cloud processing {cloudDocumentProcessing}</span>
      <span className="status-pill">LocalDocu AI {aiProcessing.split(' ')[0]}</span>
      <span className="sr-only">
        {filesOnDevice} files on device. Document processing: {processingLocation}. Cloud
        document processing: {cloudDocumentProcessing}. LocalDocu AI: {aiProcessing}.
        Document contents are processed on this device. Files are not uploaded for document
        processing.
      </span>
    </aside>
  );
}
