import { useState } from 'react';
import { initiateTransfer } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';

// POST /customer/transfer -> TransferService.initiateTransfer()
// Backend flow: asks the Python smart contract Rule 1
// (check_transfer_allowed) whether the asset's current status permits a
// transfer. If FROZEN, it throws BusinessRuleException and this form
// shows that exact reason string, straight from contracts.py.
// If allowed, the transfer is created with status LOCKED and
// ledgerService.transfer() is called (escrow lock, mocked) — it still
// needs an RM to approve() before it actually settles (see RM > Approval Queue).
export default function Transfer() {
  const [form, setForm] = useState({ assetId: '', buyerCustomerId: '', units: '', settlementRail: 'Tokenised deposit rail' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const transfer = await initiateTransfer({
        assetId: Number(form.assetId),
        buyerCustomerId: form.buyerCustomerId,
        units: Number(form.units),
        settlementRail: form.settlementRail,
      });
      setResult(transfer);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>Transfer / DvP settlement</h1>
      <InfoNote>
        Calls <code>POST /customer/transfer</code>. Enter the asset ID you own
        (see My Assets) and the buyer's <em>username</em> (e.g. <code>priyal</code>) —
        the backend matches <code>buyerCustomerId</code> against a real username.
        Backend then asks the Python smart contract Rule 1
        (<code>check_transfer_allowed</code>) before locking the transfer.
      </InfoNote>

      <form onSubmit={handleSubmit} className="lb-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="lb-label">Asset ID</label>
          <input className="lb-input" type="number" required value={form.assetId} onChange={(e) => update('assetId', e.target.value)} />
        </div>
        <div>
          <label className="lb-label">Buyer username</label>
          <input className="lb-input" required value={form.buyerCustomerId} onChange={(e) => update('buyerCustomerId', e.target.value)} />
        </div>
        <div>
          <label className="lb-label">Units to transfer</label>
          <input className="lb-input" type="number" min="1" required value={form.units} onChange={(e) => update('units', e.target.value)} />
        </div>
        <div>
          <label className="lb-label">Settlement rail</label>
          <input className="lb-input" value={form.settlementRail} onChange={(e) => update('settlementRail', e.target.value)} />
        </div>

        {error && <div className="lb-error-banner">{error}</div>}
        {result && (
          <div className="lb-success-banner">
            Transfer #{result.id} created with status <strong>{result.status}</strong> — waiting for RM approval.
          </div>
        )}

        <button className="lb-btn" disabled={busy}>{busy ? 'Submitting…' : 'Initiate transfer'}</button>
      </form>
    </div>
  );
}
