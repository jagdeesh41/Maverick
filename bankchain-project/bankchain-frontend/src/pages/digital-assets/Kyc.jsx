import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { submitKyc, getKyc } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';

// POST /customer/kyc -> KycService.submit()  (status starts PENDING)
// GET  /customer/kyc/{userId} -> current status
// An RM must approve this (POST /rm/kyc/{userId}/approve) before this
// user can be a *buyer* in a transfer — that's smart contract Rule 2
// (check_approval_allowed) in TransferService.approveTransfer().
export default function Kyc() {
  const { user } = useAuth();
  const [form, setForm] = useState({ documentType: 'Passport', documentNumber: '' });
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    getKyc(user.userId).then(setCurrent).catch(() => setCurrent(null));
  }
  useEffect(load, [user.userId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await submitKyc({ userId: user.userId, ...form });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>KYC verification</h1>
      <InfoNote>
        Calls <code>POST /customer/kyc</code>. Required before you can be a
        buyer in any transfer.
      </InfoNote>

      {current && (
        <div className="lb-card" style={{ marginBottom: 16 }}>
          Current status: <span className={`lb-status ${current.status.toLowerCase()}`}>{current.status}</span>
          {' '}({current.documentType} — {current.documentNumber})
        </div>
      )}

      <form onSubmit={handleSubmit} className="lb-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="lb-label">Document type</label>
          <select className="lb-input" value={form.documentType} onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}>
            <option>Passport</option>
            <option>Driver's License</option>
            <option>National ID</option>
          </select>
        </div>
        <div>
          <label className="lb-label">Document number</label>
          <input className="lb-input" required value={form.documentNumber}
            onChange={(e) => setForm((f) => ({ ...f, documentNumber: e.target.value }))} />
        </div>
        {error && <div className="lb-error-banner">{error}</div>}
        <button className="lb-btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit for approval'}</button>
      </form>
    </div>
  );
}
