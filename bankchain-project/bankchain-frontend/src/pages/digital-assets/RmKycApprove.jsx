import { useEffect, useState } from 'react';
import { getPendingKyc, approveKyc } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';
import ProofViewer from '../../components/ProofViewer.jsx';

export default function RmKycApprove() {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  function load() {
    getPendingKyc().then(setRecords).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function handleApprove(userId) {
    setBusyId(userId);
    setError('');
    try {
      await approveKyc(userId);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>KYC Approvals</h1>
      <InfoNote>
        Live from <code>GET /rm/kyc/pending</code>. Approving now runs the
        document number through smart contract Rule 6 and requires a proof
        photo on file — required before that person can be a buyer in any transfer.
      </InfoNote>

      {error && <div className="lb-error-banner">{error}</div>}
      {!records && !error && <p>Loading…</p>}
      {records && records.length === 0 && <p>Nothing pending.</p>}

      {records && records.map((k) => (
        <div key={k.userId} className="lb-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong>{k.fullName}</strong> <span style={{ color: 'var(--lb-ink-soft)' }}>({k.username})</span>
              <div style={{ color: 'var(--lb-ink-soft)', marginTop: 4 }}>{k.documentType} — {k.documentNumber}</div>
            </div>
            <ProofViewer value={k.proofPhotoBase64} />
          </div>
          <button
            className="lb-btn" style={{ marginTop: 12 }}
            disabled={busyId === k.userId} onClick={() => handleApprove(k.userId)}
          >
            {busyId === k.userId ? 'Approving…' : 'Approve'}
          </button>
        </div>
      ))}
    </div>
  );
}
