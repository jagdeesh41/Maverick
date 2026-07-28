import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { submitClaim } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';
import FileUpload from '../../components/FileUpload.jsx';

const RELATIONS = { SPOUSE: 'Spouse', CHILD: 'Child', PARENT: 'Parent', SIBLING: 'Sibling', OTHER: 'Other' };

// POST /customer/claims -> claim any tokenized asset you believe you're
// entitled to (most commonly because the original holder has died and
// never transferred or set up inheritance for it - but this isn't
// exclusively a "death claim" flow). The smart contract (Rule 5) only
// lets an RM approve it if your relation is a recognised blood relation
// AND you've attached a certificate/proof.
export default function ClaimProperty() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    assetId: searchParams.get('assetId') || '',
    claimantRelation: 'CHILD',
    certificateProofBase64: '',
  });
  const [result, setResult] = useState(null);
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
      const claim = await submitClaim({
        assetId: Number(form.assetId),
        claimantUserId: user.userId,
        claimantRelation: form.claimantRelation,
        certificateProofBase64: form.certificateProofBase64,
      });
      setResult(claim);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>Claim a property</h1>
      <InfoNote>
        Calls <code>POST /customer/claims</code>, filed as you ({user?.fullName}).
        An RM reviews it against the smart contract's eligibility check
        (blood relation + certificate on file). If approved, this asset
        appears directly in your own "My Assets" — no separate step needed.
      </InfoNote>

      <form onSubmit={handleSubmit} className="lb-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="lb-label">Asset ID being claimed</label>
          <input className="lb-input" type="number" required value={form.assetId} onChange={(e) => update('assetId', e.target.value)} />
        </div>
        <div>
          <label className="lb-label">Your relation to the original holder</label>
          <select className="lb-input" value={form.claimantRelation} onChange={(e) => update('claimantRelation', e.target.value)}>
            {Object.entries(RELATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <p style={{ fontSize: '0.8rem', color: 'var(--lb-ink-soft)', marginTop: 6 }}>
            Only Spouse, Child, Parent, or Sibling are eligible for approval — "Other" will be blocked by the smart contract.
          </p>
        </div>
        <FileUpload
          label="Certificate / relationship proof (e.g. death certificate + your ID)"
          value={form.certificateProofBase64}
          onChange={(v) => update('certificateProofBase64', v)}
          required
        />

        {error && <div className="lb-error-banner">{error}</div>}
        {result && (
          <div className="lb-success-banner">
            Claim #{result.id} submitted with status <strong>{result.status}</strong> — an RM will review it.
            If two or more claimants are approved on the same asset, it's split equally between them.
          </div>
        )}

        <button className="lb-btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit claim'}</button>
      </form>
    </div>
  );
}
