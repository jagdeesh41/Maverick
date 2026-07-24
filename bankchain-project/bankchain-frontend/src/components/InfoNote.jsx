import { useState } from 'react';

/**
 * Collapsed by default so the screen reads as a finished product, not
 * scaffolding. A judge (or you, mid-demo) can click "How this works" to
 * reveal exactly which endpoint fired and what it does — proof this is
 * really wired up, on demand instead of printed unconditionally.
 */
export default function InfoNote({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: 'var(--lb-green-800)', fontWeight: 700, fontSize: '0.82rem',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{
          display: 'inline-flex', width: 16, height: 16, borderRadius: '50%',
          border: '1.5px solid currentColor', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.68rem',
        }}>i</span>
        {open ? 'Hide how this works' : 'How this works'}
      </button>
      {open && (
        <div style={{
          marginTop: 8, padding: '10px 14px', background: '#f4f6f3',
          border: '1px solid var(--lb-border)', borderRadius: 8,
          fontSize: '0.85rem', color: 'var(--lb-ink-soft)', lineHeight: 1.5,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}
