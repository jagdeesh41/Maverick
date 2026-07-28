const STEPS = ['REQUESTED', 'IDENTITY_PROOFING', 'GOVERNANCE_APPROVAL', 'RESET'];
const LABELS = {
  REQUESTED: 'Requested',
  IDENTITY_PROOFING: 'Identity proofing',
  GOVERNANCE_APPROVAL: 'Governance approval',
  RESET: 'Reset complete',
};

/** Renders REQUESTED -> IDENTITY_PROOFING -> GOVERNANCE_APPROVAL -> RESET as a visual stepper. */
export default function StatusStepper({ status }) {
  const currentIndex = Math.max(0, STEPS.indexOf(status));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STEPS.map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'initial' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: i <= currentIndex ? 'var(--lb-green-600)' : '#dde3de',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700,
            }}>
              {i < currentIndex ? '✓' : i + 1}
            </div>
            <div style={{
              fontSize: '0.72rem', marginTop: 6, textAlign: 'center',
              color: i <= currentIndex ? 'var(--lb-ink)' : 'var(--lb-ink-soft)',
              fontWeight: i === currentIndex ? 700 : 500,
            }}>
              {LABELS[step]}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < currentIndex ? 'var(--lb-green-600)' : '#dde3de', marginBottom: 20 }} />
          )}
        </div>
      ))}
    </div>
  );
}
