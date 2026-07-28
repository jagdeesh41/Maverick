import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { issueAsset } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';
import FileUpload from '../../components/FileUpload.jsx';

export default function IssueAsset() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    assetType: 'Fixed Deposit',
    assetValue: '',
    ownershipUnits: '',
    policyTemplate: 'Maturity lock + nominee + payout',
    nominee: '',
    relationType: 'FAMILY',
    ownershipPercent: 100,
    proofDocumentBase64: '',
  });

  // Only Real Estate is ever partially owned in this demo (e.g. mortgage still
  // outstanding) - everything else is fully owned the moment it's issued.
  const partialOwnershipAllowed = form.assetType === 'Real Estate';
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(null); // holds the created asset once minted

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'assetType' && value !== 'Real Estate') {
        next.ownershipPercent = 100; // fully-owned instruments always lock back to 100%
      }
      return next;
    });
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
        ownershipPercent: Number(form.ownershipPercent),
        policyTemplate: form.policyTemplate,
        nominee: form.nominee,
        relationType: form.relationType,
        proofDocumentBase64: form.proofDocumentBase64,
      });
      setSubmitted(asset);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Confirmation screen shown right after minting - explicit, not a silent redirect.
  if (submitted) {
    return (
      <div style={{ maxWidth: 560 }}>
        <div className="lb-success-banner" style={{ fontSize: '1rem' }}>
          ✅ Token minted for asset <strong>#{submitted.id}</strong>. Your request is now
          <strong> waiting for Relationship Manager approval</strong> in their Issuance Queue.
          You'll see the status update on your dashboard once it's reviewed.
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button className="lb-btn" onClick={() => navigate(`../assets/${submitted.id}`)}>View asset</button>
          <button className="lb-btn outline" onClick={() => navigate('..')}>Back to dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>Issue a new tokenized asset</h1>
      <InfoNote>
        Calls <code>POST /customer/assets/issue</code>, which mints a token on
        the ledger and saves the asset. It starts <strong>PENDING CONFIRMATION</strong>
        — an RM has to confirm it in their Issuance Queue before it can be
        transferred to anyone.
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
          <label className="lb-label">
            Ownership % {!partialOwnershipAllowed && <span style={{ color: 'var(--lb-ink-soft)', fontWeight: 400 }}>(fully owned)</span>}
          </label>
          {partialOwnershipAllowed ? (
            <input
              className="lb-input" type="number" min="1" max="100"
              value={form.ownershipPercent}
              onChange={(e) => update('ownershipPercent', e.target.value)}
            />
          ) : (
            <div className="lb-input" style={{ background: '#f2f4f2', color: 'var(--lb-ink-soft)', display: 'flex', alignItems: 'center' }}>
              100% — this asset type is always fully owned at issuance
            </div>
          )}
          {partialOwnershipAllowed && (
            <p style={{ fontSize: '0.8rem', color: 'var(--lb-ink-soft)', marginTop: 6 }}>
              Real Estate can be partially owned (e.g. still paying a mortgage) - enter what % of the property you actually own.
            </p>
          )}
        </div>

        <div>
          <label className="lb-label">Policy template</label>
          <select className="lb-input" value={form.policyTemplate} onChange={(e) => update('policyTemplate', e.target.value)}>
            <option>Maturity lock + nominee + payout</option>
            <option>Immediate transfer on approval</option>
            <option>Death benefit only</option>
            <option>Age-based release (70+)</option>
            <option>Custom — set in Inheritance screen</option>
          </select>
        </div>

        <div>
          <label className="lb-label">Nominee</label>
          <input className="lb-input" placeholder="e.g. Rahul Sharma"
            value={form.nominee} onChange={(e) => update('nominee', e.target.value)} />
        </div>

        <div>
          <label className="lb-label">Nominee's relation to you</label>
          <select className="lb-input" value={form.relationType} onChange={(e) => update('relationType', e.target.value)}>
            <option value="SELF">Self</option>
            <option value="FAMILY">Family</option>
            <option value="FRIEND">Friend</option>
            <option value="FAMILY_FRIEND">Family friend</option>
            <option value="RELATIVE">Relative</option>
          </select>
        </div>

        <FileUpload
          label="Asset proof (photo/document)"
          value={form.proofDocumentBase64}
          onChange={(v) => update('proofDocumentBase64', v)}
        />

        {error && <div className="lb-error-banner">{error}</div>}

        <button className="lb-btn" disabled={busy}>{busy ? 'Minting…' : 'Mint token (sends for RM confirmation)'}</button>
      </form>
    </div>
  );
}
