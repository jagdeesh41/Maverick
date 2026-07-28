import { useEffect, useState } from 'react';
import { getAllRecoveryRequests, advanceRecovery } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';
import StatusStepper from '../../components/StatusStepper.jsx';

const NEXT_STATUS = {
  REQUESTED: 'IDENTITY_PROOFING',
  IDENTITY_PROOFING: 'GOVERNANCE_APPROVAL',
  GOVERNANCE_APPROVAL: 'RESET',
};
const NEXT_LABEL = {
  REQUESTED: 'Advance to Identity Proofing',
  IDENTITY_PROOFING: 'Advance to Governance Approval',
  GOVERNANCE_APPROVAL: 'Complete Reset',
};

// GET /rm/recovery -> every recovery request, any customer, newest
// first. POST /rm/recovery/{id}/advance?status=... moves it one stage.
export default function RmRecovery() {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  function load() {
    getAllRecoveryRequests().then(setRequests).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function handleAdvance(id, nextStatus) {
    setBusyId(id);
    setError('');
    try {
      await advanceRecovery(id, nextStatus);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Recovery Requests</h1>
      <InfoNote>
        Live from <code>GET /rm/recovery</code>. The first advance out of REQUESTED
        runs through smart contract Rule 8 (phone, email, and identity proof all
        required) before it's allowed to move.
      </InfoNote>

      {error && <div className="lb-error-banner">{error}</div>}
      {!requests && !error && <p>Loading…</p>}
      {requests && requests.length === 0 && <p>No recovery requests.</p>}

      {requests && requests.map((r) => (
        <div key={r.id} className="lb-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <strong>#{r.id} — {r.user?.fullName} ({r.recoveryReason})</strong>
            <span style={{ color: 'var(--lb-ink-soft)', fontSize: '0.85rem' }}>
              {new Date(r.createdAt).toLocaleString('en-GB')}
            </span>
          </div>
          <StatusStepper status={r.status} />
          {NEXT_STATUS[r.status] && (
            <button
              className="lb-btn" style={{ marginTop: 16 }}
              disabled={busyId === r.id}
              onClick={() => handleAdvance(r.id, NEXT_STATUS[r.status])}
            >
              {busyId === r.id ? 'Updating…' : NEXT_LABEL[r.status]}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
