import { useState } from 'react';
import { getKyc, approveKyc } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';

// GET /customer/kyc/{userId} + POST /rm/kyc/{userId}/approve
//
// Honest note: the backend has no "list all pending KYC records" endpoint
// (only a lookup by userId), and per your instruction the backend isn't
// being touched — so this screen works by looking up one user at a time
// by their userId. Find userId values from the Approval Queue (buyer
// username) or by asking the customer.
export default function RmKycApprove() {
  const [userId, setUserId] = useState('');
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLookup(e) {
    e.preventDefault();
    setError('');
    setRecord(null);
    try {
      setRecord(await getKyc(userId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleApprove() {
    setBusy(true);
    setError('');
    try {
      setRecord(await approveKyc(userId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>KYC Approvals</h1>
      <InfoNote>
        The backend only exposes lookup-by-userId (no "pending list"
        endpoint), so look up a specific user, then approve.
      </InfoNote>

      <form onSubmit={handleLookup} className="lb-card" style={{ display: 'flex', gap: 8 }}>
        <input className="lb-input" type="number" placeholder="User ID" required
          value={userId} onChange={(e) => setUserId(e.target.value)} />
        <button className="lb-btn outline" type="submit">Look up</button>
      </form>

      {error && <div className="lb-error-banner" style={{ marginTop: 16 }}>{error}</div>}

      {record && (
        <div className="lb-card" style={{ marginTop: 16 }}>
          <div>Document: {record.documentType} — {record.documentNumber}</div>
          <div style={{ marginTop: 6 }}>
            Status: <span className={`lb-status ${record.status.toLowerCase()}`}>{record.status}</span>
          </div>
          <button className="lb-btn" style={{ marginTop: 12 }} disabled={busy || record.status === 'APPROVED'} onClick={handleApprove}>
            {busy ? 'Approving…' : 'Approve KYC'}
          </button>
        </div>
      )}
    </div>
  );
}
