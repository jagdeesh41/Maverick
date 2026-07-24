import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAssetDetails, freezeAsset, unfreezeAsset } from '../../api.js';
import { formatGBP } from '../../format.js';
import InfoNote from '../../components/InfoNote.jsx';

// GET /customer/assets/details/{assetId} -> AssetService.getAssetDetails()
// Note: this same read endpoint is reused for the RM view — the backend
// doesn't distinguish; only the freeze/unfreeze buttons below are gated
// to the RM role on the frontend (the backend endpoints for those live
// under /rm/** regardless).
export default function AssetDetail() {
  const { assetId } = useParams();
  const { user } = useAuth();
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    getAssetDetails(assetId).then(setAsset).catch((e) => setError(e.message));
  }

  useEffect(load, [assetId]);

  async function handleFreeze(freeze) {
    setBusy(true);
    setError('');
    try {
      if (freeze) await freezeAsset(assetId);
      else await unfreezeAsset(assetId);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="lb-error-banner">{error}</div>;
  if (!asset) return <p>Loading…</p>;

  return (
    <div>
      <Link to="..">← Back</Link>
      <h1 style={{ marginTop: 8 }}>{asset.assetType} <span style={{ color: 'var(--lb-ink-soft)', fontWeight: 400 }}>#{asset.id}</span></h1>
      <InfoNote>
        Live from <code>GET /customer/assets/details/{assetId}</code>.
      </InfoNote>

      <div className="lb-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <Field label="Owner" value={asset.ownerName} />
        <Field label="Value" value={formatGBP(asset.assetValue)} />
        <Field label="Ownership units" value={asset.ownershipUnits} />
        <Field label="Status" value={<span className={`lb-status ${asset.status.toLowerCase()}`}>{asset.status}</span>} />
        <Field label="Nominee" value={asset.nominee || '—'} />
        <Field label="Policy template" value={asset.policyTemplate || '—'} />
        <Field label="Ledger token ID (GCUL, mocked)" value={<code>{asset.ledgerTokenId}</code>} />
        <Field label="Evidence hash" value={<code>{asset.evidenceHash}</code>} />
        <Field label="Created" value={new Date(asset.createdAt).toLocaleString('en-GB')} />
      </div>

      {user.role === 'RM' && (
        <div className="lb-card" style={{ marginTop: 20 }}>
          <strong>RM actions</strong>
          <InfoNote>
            Freeze calls <code>POST /rm/assets/{assetId}/freeze</code>, which sets the
            asset status and calls <code>LedgerService.freeze()</code> on the (mocked)
            ledger. A frozen asset will then fail smart contract Rule 1 on any transfer attempt.
          </InfoNote>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="lb-btn" disabled={busy || asset.status === 'FROZEN'} onClick={() => handleFreeze(true)}>
              Freeze asset
            </button>
            <button className="lb-btn outline" disabled={busy || asset.status !== 'FROZEN'} onClick={() => handleFreeze(false)}>
              Unfreeze asset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--lb-ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: 4 }}>{value}</div>
    </div>
  );
}
