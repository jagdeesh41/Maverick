import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { issueAsset } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';

// POST /customer/assets/issue -> AssetService.issueAsset()
// Behind the scenes this calls LedgerService.mint(...) (MockGCULAdapter),
// which fabricates a ledger token id and logs an AuditEvent — this is the
// "Mint Token" step in the reference architecture.
export default function IssueAsset() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    assetType: 'Fixed Deposit',
    assetValue: '',
    ownershipUnits: '',
    policyTemplate: 'Maturity lock + nominee + payout',
    nominee: '',
  });
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
      const asset = await issueAsset({
        ownerId: user.userId,
        assetType: form.assetType,
        assetValue: Number(form.assetValue),
        ownershipUnits: Number(form.ownershipUnits),
        policyTemplate: form.policyTemplate,
        nominee: form.nominee,
      });
      navigate(`../assets/${asset.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>Issue a new tokenized asset</h1>
      <InfoNote>
        Calls <code>POST /customer/assets/issue</code>, which mints a token on
        the (mocked) GCUL ledger and saves the asset row to Postgres.
      </InfoNote>

      <form onSubmit={handleSubmit} className="lb-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="lb-label">Asset type</label>
          <select className="lb-input" value={form.assetType} onChange={(e) => update('assetType', e.target.value)}>
            <option>Fixed Deposit</option>
            <option>Real Estate</option>
            <option>Corporate Bond</option>
            <option>Equity</option>
            <option>Commodity</option>
          </select>
        </div>

        <div>
          <label className="lb-label">Asset value (£)</label>
          <input className="lb-input" type="number" min="1" step="0.01" required
            value={form.assetValue} onChange={(e) => update('assetValue', e.target.value)} />
        </div>

        <div>
          <label className="lb-label">Ownership units</label>
          <input className="lb-input" type="number" min="1" step="1" required
            value={form.ownershipUnits} onChange={(e) => update('ownershipUnits', e.target.value)} />
        </div>

        <div>
          <label className="lb-label">Policy template</label>
          <input className="lb-input" value={form.policyTemplate} onChange={(e) => update('policyTemplate', e.target.value)} />
        </div>

        <div>
          <label className="lb-label">Nominee</label>
          <input className="lb-input" placeholder="e.g. Rahul Sharma"
            value={form.nominee} onChange={(e) => update('nominee', e.target.value)} />
        </div>

        {error && <div className="lb-error-banner">{error}</div>}

        <button className="lb-btn" disabled={busy}>{busy ? 'Minting…' : 'Mint token'}</button>
      </form>
    </div>
  );
}
