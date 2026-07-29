import { useState } from 'react';

/**
 * Shows an uploaded proof document from its signed GCS URL. Falls back to
 * a plain badge if it's not a renderable image (e.g. a PDF) - the <img>
 * tag's onError fires for those since the browser can't decode them,
 * same fallback path as a broken/expired link.
 */
export default function ProofViewer({ label, value }) {
  const [broken, setBroken] = useState(false);
  if (!value) return <span style={{ color: 'var(--lb-ink-soft)' }}>No proof attached</span>;

  return (
    <div>
      {label && <div className="lb-label" style={{ marginBottom: 6 }}>{label}</div>}
      {!broken ? (
        <img
          src={value}
          alt={label || 'proof'}
          onError={() => setBroken(true)}
          style={{ maxWidth: 220, maxHeight: 160, borderRadius: 8, border: '1px solid var(--lb-border)' }}
        />
      ) : (
        <span className="lb-status pending">📎 Proof document attached</span>
      )}
    </div>
  );
}
