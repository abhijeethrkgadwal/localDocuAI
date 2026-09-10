/**
 * Text wordmark: LocalDocu with accent on L and D only.
 */
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span className={`brand-mark-text ${className}`.trim()} translate="no">
      <span className="brand-mark-accent">L</span>
      <span>ocal</span>
      <span className="brand-mark-accent">D</span>
      <span>ocu</span>
    </span>
  );
}
