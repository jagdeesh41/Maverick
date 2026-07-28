import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { submitRecovery, getRecoveryRequests } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';
import StatusStepper from '../../components/StatusStepper.jsx';
import FileUpload from '../../components/FileUpload.jsx';

export default function Recovery() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    recoveryReason: '', verificationMethod: 'Bank KYC + MFA',
    phoneNumber: '', email: '', proofDocumentBase64: '',
  });
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
      setForm({ recoveryReason: '', verificationMethod: 'Bank KYC + MFA', phoneNumber: '', email: '', proofDocumentBase64: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 style={{ marginTop: 0 }}>Account recovery</h1>
      <InfoNote>
        Calls <code>POST /customer/recovery</code>. An RM works your request
        through the stages below from their queue.
      </InfoNote>

      {requests.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3>Your requests</h3>
          {requests.map((r) => (
            <div key={r.id} className="lb-card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <strong>#{r.id} — {r.recoveryReason}</strong>
                <span style={{ color: 'var(--lb-ink-soft)', fontSize: '0.85rem' }}>{new Date(r.createdAt).toLocaleString('en-GB')}</span>
              </div>
              <StatusStepper status={r.status} />
            </div>
          ))}
        </div>
      )}

      <h3>New request</h3>
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
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="lb-label">Phone number</label>
            <input className="lb-input" type="tel" required placeholder="+44 7..."
              value={form.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label className="lb-label">Email</label>
            <input className="lb-input" type="email" required placeholder="you@example.com"
              value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
        </div>
        <FileUpload
          label="Identity proof (photo/document)"
          value={form.proofDocumentBase64}
          onChange={(v) => update('proofDocumentBase64', v)}
        />
        {error && <div className="lb-error-banner">{error}</div>}
        <button className="lb-btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
      </form>
    </div>
  );
}
