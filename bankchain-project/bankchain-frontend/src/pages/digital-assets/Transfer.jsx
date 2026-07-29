import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyAssets, initiateTransfer } from '../../api.js';
import { formatGBP } from '../../format.js';
import InfoNote from '../../components/InfoNote.jsx';
import FileUpload from '../../components/FileUpload.jsx';
import ProofInput from '../../components/ProofInput.jsx';

export default function Transfer() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [holdings, setHoldings] = useState(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const [assetId, setAssetId] = useState(searchParams.get('assetId') || '');
  const [buyerCustomerId, setBuyerCustomerId] = useState('');
  const [units, setUnits] = useState('');
  const [settlementRail, setSettlementRail] = useState('');
  const [transfereeProofKey, setTransfereeProofKey] = useState('');
  const [buyerProofType, setBuyerProofType] = useState('ACCOUNT_NUMBER');
  const [buyerProofValue, setBuyerProofValue] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    getMyAssets(user.userId).then(setHoldings).catch((e) => setLoadError(e.message));
  }, [user.userId]);

  const selected = holdings?.find((h) => String(h.assetId) === String(assetId));
  const transferable = selected && selected.status === 'ACTIVE';
  const unitsNum = Number(units) || 0;
  const remaining = selected ? selected.unitsHeld - unitsNum : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const transfer = await initiateTransfer({
        sellerId: user.userId,
        assetId: Number(assetId),
        buyerCustomerId,
        units: unitsNum,
        settlementRail: settlementRail || undefined,
        transfereeProofKey,
        buyerProofType,
        buyerProofValue,
        consentGiven,
      });
      setResult(transfer);
      setUnits('');
      setConsentGiven(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <div className="lb-error-banner">{loadError}</div>;
  if (!holdings) return <p>Loading your holdings…</p>;

  if (holdings.length === 0) {
    return (
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ marginTop: 0 }}>Transfer / DvP</h1>
        <p>You don't hold any assets yet, so there's nothing to transfer.</p>
        <Link to="../issue" className="lb-btn">Issue your first asset</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>Transfer / DvP settlement</h1>
      <InfoNote>
        Calls <code>POST /customer/transfer</code>. Checks the asset is ACTIVE
        (Rule 1), you hold enough units (Rule 4), and the buyer's proof number
        passes validation (Rule 6) before locking it for RM approval.
      </InfoNote>

      <form onSubmit={handleSubmit} className="lb-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="lb-label">Which asset are you sending?</label>
          <select className="lb-input" required value={assetId} onChange={(e) => { setAssetId(e.target.value); setUnits(''); }}>
            <option value="">Select an asset you hold…</option>
            {holdings.map((h) => (
              <option key={h.assetId} value={h.assetId} disabled={h.status !== 'ACTIVE'}>
                #{h.assetId} — {h.assetType} — you hold {h.unitsHeld} unit(s)
                {h.status !== 'ACTIVE' ? ` (${h.status.replace('_', ' ')})` : ''}
              </option>
            ))}
          </select>
        </div>

        {selected && !transferable && (
          <div className="lb-error-banner" style={{ background: '#fff4e0', borderColor: '#f0d9a3', color: 'var(--lb-orange-700)' }}>
            This asset is {selected.status.replace('_', ' ').toLowerCase()} and can't be transferred right now.
          </div>
        )}

        <div>
          <label className="lb-label">Buyer's username</label>
          <input className="lb-input" required value={buyerCustomerId} onChange={(e) => setBuyerCustomerId(e.target.value)} />
        </div>

        <div>
          <label className="lb-label">Units to send {selected ? `(you hold ${selected.unitsHeld})` : ''}</label>
          <input
            className="lb-input" type="number" min="1"
            max={selected ? selected.unitsHeld : undefined}
            required disabled={!transferable}
            value={units}
            onChange={(e) => setUnits(e.target.value)}
          />
        </div>

        {selected && unitsNum > 0 && (
          <div className="lb-card" style={{ background: 'var(--lb-green-50)', borderColor: '#b6e2cc', fontSize: '0.9rem' }}>
            Sending <strong>{unitsNum}</strong> of your {selected.unitsHeld} units to <strong>{buyerCustomerId || '…'}</strong>.
            {' '}You'll keep <strong>{remaining >= 0 ? remaining : 0}</strong> unit(s)
            {' '}(≈ {formatGBP((remaining >= 0 ? remaining : 0) * (selected.valueShare / selected.unitsHeld))}) once this settles.
          </div>
        )}

        <ProofInput
          label="Proof of the buyer's identity"
          typeValue={buyerProofType} onTypeChange={setBuyerProofType}
          valueValue={buyerProofValue} onValueChange={setBuyerProofValue}
        />

        <FileUpload
          label="Photo/document of the buyer's ID (kept for later verification)"
          category="transfer-proof"
          value={transfereeProofKey}
          onChange={setTransfereeProofKey}
        />

        <div>
          <label className="lb-label">Settlement rail</label>
          <input
            className="lb-input" placeholder="e.g. Tokenised deposit rail, RTGS, SWIFT…"
            value={settlementRail} onChange={(e) => setSettlementRail(e.target.value)}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.9rem' }}>
          <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} style={{ marginTop: 3 }} />
          I confirm I willingly authorise this transfer.
        </label>

        {error && <div className="lb-error-banner">{error}</div>}
        {result && (
          <div className="lb-success-banner">
            Transfer #{result.id} created with status <strong>{result.status}</strong> — waiting for RM approval. Nothing moves until then.
          </div>
        )}

        <button className="lb-btn" disabled={busy || !transferable || !consentGiven}>{busy ? 'Submitting…' : 'Initiate transfer'}</button>
      </form>
    </div>
  );
}
