import { useState } from 'react';
import { setInheritancePolicy, getInheritancePolicy } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';

// POST /customer/inheritance -> InheritanceService.setPolicy()
// GET  /customer/inheritance/{assetId} -> look up the current policy
//
// Raising a dispute on this policy is an RM action (smart contract Rule 3,
// evaluate_dispute — always auto-freezes) — see the asset's detail page
// once you're logged in as RM.
export default function Inheritance() {
  const [assetId, setAssetId] = useState('');
  const [form, setForm] = useState({
    primaryNominee: '', primaryAllocation: 100,
    secondaryNominee: '', secondaryAllocation: 0,
    triggerCondition: 'Verified death certificate + probate approval',
    disputeAction: 'Temporary freeze',
  });
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const saved = await setInheritancePolicy({
        assetId: Number(assetId),
        primaryNominee: form.primaryNominee,
        primaryAllocation: Number(form.primaryAllocation),
        secondaryNominee: form.secondaryNominee,
        secondaryAllocation: Number(form.secondaryAllocation),
        triggerCondition: form.triggerCondition,
        disputeAction: form.disputeAction,
      });
      setPolicy(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLookup() {
    setError('');
    try {
      setPolicy(await getInheritancePolicy(assetId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 style={{ marginTop: 0 }}>Inheritance policy (digital will)</h1>
      <InfoNote>
        Sets who inherits an asset and under what condition. Saved via{' '}
        <code>POST /customer/inheritance</code>.
      </InfoNote>

      <div className="lb-card" style={{ marginBottom: 16 }}>
        <label className="lb-label">Asset ID</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="lb-input" type="number" value={assetId} onChange={(e) => setAssetId(e.target.value)} />
          <button type="button" className="lb-btn outline" onClick={handleLookup}>Look up existing policy</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lb-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="lb-label">Primary nominee</label>
            <input className="lb-input" value={form.primaryNominee} onChange={(e) => update('primaryNominee', e.target.value)} />
          </div>
          <div style={{ width: 140 }}>
            <label className="lb-label">Allocation %</label>
            <input className="lb-input" type="number" value={form.primaryAllocation} onChange={(e) => update('primaryAllocation', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="lb-label">Secondary nominee (optional)</label>
            <input className="lb-input" value={form.secondaryNominee} onChange={(e) => update('secondaryNominee', e.target.value)} />
          </div>
          <div style={{ width: 140 }}>
            <label className="lb-label">Allocation %</label>
            <input className="lb-input" type="number" value={form.secondaryAllocation} onChange={(e) => update('secondaryAllocation', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="lb-label">Trigger condition</label>
          <input className="lb-input" value={form.triggerCondition} onChange={(e) => update('triggerCondition', e.target.value)} />
        </div>
        <div>
          <label className="lb-label">Dispute action (informational)</label>
          <input className="lb-input" value={form.disputeAction} onChange={(e) => update('disputeAction', e.target.value)} />
        </div>

        {error && <div className="lb-error-banner">{error}</div>}
        <button className="lb-btn" disabled={busy || !assetId}>{busy ? 'Saving…' : 'Save policy'}</button>
      </form>

      {policy && (
        <div className="lb-success-banner" style={{ marginTop: 16 }}>
          Policy status: <strong>{policy.status}</strong> — primary: {policy.primaryNominee} ({policy.primaryAllocation}%)
        </div>
      )}
    </div>
  );
}
