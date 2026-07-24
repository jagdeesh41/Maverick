import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { submitRecovery, getRecoveryRequests } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';

// POST /customer/recovery -> RecoveryService.submitRequest()
// GET  /customer/recovery/{userId} -> your past requests
// "I lost access, help me" — status progresses REQUESTED ->
// IDENTITY_PROOFING -> GOVERNANCE_APPROVAL -> RESET, advanced by RM
// (POST /rm/recovery/{id}/advance?status=...).
export default function Recovery() {
  const { user } = useAuth();
  const [form, setForm] = useState({ recoveryReason: '', verificationMethod: 'Bank KYC + MFA', emergencyContact: '' });
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    getRecoveryRequests(user.userId).then(setRequests).catch(() => {});
  }
  useEffect(load, [user.userId]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await submitRecovery({ userId: user.userId, ...form });
      setForm({ recoveryReason: '', verificationMethod: 'Bank KYC + MFA', emergencyContact: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 style={{ marginTop: 0 }}>Account recovery</h1>
      <InfoNote>
        Calls <code>POST /customer/recovery</code>.
      </InfoNote>

      <form onSubmit={handleSubmit} className="lb-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="lb-label">Reason</label>
          <input className="lb-input" placeholder="e.g. Lost device" required
            value={form.recoveryReason} onChange={(e) => update('recoveryReason', e.target.value)} />
        </div>
        <div>
          <label className="lb-label">Verification method</label>
          <input className="lb-input" value={form.verificationMethod} onChange={(e) => update('verificationMethod', e.target.value)} />
        </div>
        <div>
          <label className="lb-label">Emergency contact</label>
          <input className="lb-input" value={form.emergencyContact} onChange={(e) => update('emergencyContact', e.target.value)} />
        </div>
        {error && <div className="lb-error-banner">{error}</div>}
        <button className="lb-btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
      </form>

      <h3 style={{ marginTop: 32 }}>Your requests</h3>
      {requests.length === 0 ? <p>None yet.</p> : (
        <table className="lb-table">
          <thead><tr><th>ID</th><th>Reason</th><th>Status</th><th>Submitted</th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>#{r.id}</td><td>{r.recoveryReason}</td>
                <td><span className={`lb-status ${r.status.toLowerCase()}`}>{r.status}</span></td>
                <td>{new Date(r.createdAt).toLocaleString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
