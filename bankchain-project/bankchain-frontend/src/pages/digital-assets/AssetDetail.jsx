import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAssetDetails, freezeAsset, unfreezeAsset, confirmAsset, holdAsset, resubmitAssetProof } from '../../api.js';
import { formatGBP } from '../../format.js';
import InfoNote from '../../components/InfoNote.jsx';
import ProofViewer from '../../components/ProofViewer.jsx';
import FileUpload from '../../components/FileUpload.jsx';

const RELATION_LABELS = { SELF: 'Self', FAMILY: 'Family', FRIEND: 'Friend', FAMILY_FRIEND: 'Family friend', RELATIVE: 'Relative' };

export default function AssetDetail() {
  const { assetId } = useParams();
  const { user } = useAuth();
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [holdNote, setHoldNote] = useState('');
  const [showHoldForm, setShowHoldForm] = useState(false);
  const [resubmitProof, setResubmitProof] = useState('');

  function load() {
    getAssetDetails(assetId).then(setAsset).catch((e) => setError(e.message));
  }
  useEffect(load, [assetId]);

  async function runAction(fn) {
    setBusy(true);
    setError('');
    try {
      await fn();
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="lb-error-banner">{error}</div>;
  if (!asset) return <p>Loading…</p>;

  const myHolding = asset.holders?.find((h) => h.holderId === user.userId);
  const isIssuer = asset.issuerId === user.userId;

  return (
    <div>
      <Link to="..">← Back</Link>
      <h1 style={{ marginTop: 8 }}>{asset.assetType} <span style={{ color: 'var(--lb-ink-soft)', fontWeight: 400 }}>#{asset.id}</span></h1>
      <InfoNote>
        Live from <code>GET /customer/assets/details/{assetId}</code>.
      </InfoNote>

      {asset.status === 'PENDING_CONFIRMATION' && (
        <div className="lb-error-banner" style={{ background: '#fff4e0', borderColor: '#f0d9a3', color: 'var(--lb-orange-700)' }}>
          This asset is awaiting RM confirmation and can't be transferred yet.
        </div>
      )}
      {asset.status === 'ON_HOLD' && (
        <div className="lb-error-banner">
          <strong>On hold from RM:</strong> {asset.rmNote}
        </div>
      )}

      <div className="lb-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <Field label="Issuer" value={asset.issuerName} />
        <Field label="Total value" value={formatGBP(asset.assetValue)} />
        <Field label="Total units" value={asset.ownershipUnits} />
        <Field label="Ownership %" value={`${asset.ownershipPercent}%${asset.ownershipPercent < 100 ? " (partial)" : ""}`} />
        <Field label="Status" value={<span className={`lb-status ${asset.status.toLowerCase()}`}>{asset.status.replace('_', ' ')}</span>} />
        <Field label="Nominee" value={asset.nominee || '—'} />
        <Field label="Nominee relation" value={RELATION_LABELS[asset.relationType] || asset.relationType || '—'} />
        <Field label="Policy template" value={asset.policyTemplate || '—'} />
        <Field label="Ledger token ID" value={<code>{asset.ledgerTokenId}</code>} />
        <Field label="Created" value={new Date(asset.createdAt).toLocaleString('en-GB')} />
      </div>

      <div className="lb-card" style={{ marginTop: 16 }}>
        <ProofViewer label="Asset proof on file" value={asset.proofDocumentBase64} />
      </div>

      <h3 style={{ marginTop: 24 }}>Cap table — who holds this asset</h3>
      <table className="lb-table">
        <thead><tr><th>Holder</th><th>Units held</th><th>Value share</th></tr></thead>
        <tbody>
          {asset.holders.map((h) => (
            <tr key={h.holderId}>
              <td>{h.holderName}{h.holderId === user.userId ? ' (you)' : ''}</td>
              <td>{h.unitsHeld}</td>
              <td>{formatGBP(h.valueShare)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {isIssuer && asset.status === 'ON_HOLD' && (
        <div className="lb-card" style={{ marginTop: 20 }}>
          <strong>Resubmit proof</strong>
          <p style={{ color: 'var(--lb-ink-soft)', margin: '4px 0 12px' }}>
            The RM has asked for more documentation (see note above). Upload a new
            document and resubmit — it'll go straight back into their queue.
          </p>
          <FileUpload label="New proof document" value={resubmitProof} onChange={setResubmitProof} />
          <button
            className="lb-btn" style={{ marginTop: 12 }}
            disabled={busy || !resubmitProof}
            onClick={() => runAction(() => resubmitAssetProof(assetId, resubmitProof))}
          >
            {busy ? 'Resubmitting…' : 'Resubmit for confirmation'}
          </button>
        </div>
      )}

      {myHolding && asset.status === 'ACTIVE' && (
        <div className="lb-card" style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to={`../transfer?assetId=${asset.id}`} className="lb-btn">Transfer some of my {myHolding.unitsHeld} units</Link>
          <Link to={`../inheritance?assetId=${asset.id}`} className="lb-btn outline">Set up inheritance</Link>
        </div>
      )}

      {user.role === 'RM' && (
        <div className="lb-card" style={{ marginTop: 20 }}>
          <strong>RM actions</strong>
          <InfoNote>
            Freeze calls <code>POST /rm/assets/{assetId}/freeze</code>. Hold sends this
            back to the customer with a note asking for more documents.
          </InfoNote>

          {(asset.status === 'PENDING_CONFIRMATION' || asset.status === 'ON_HOLD') && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <button className="lb-btn" disabled={busy} onClick={() => runAction(() => confirmAsset(assetId))}>
                Confirm / Approve
              </button>
              <button className="lb-btn outline" disabled={busy} onClick={() => setShowHoldForm((s) => !s)}>
                Hold — ask for more proof
              </button>
            </div>
          )}

          {showHoldForm && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="lb-input" placeholder="Note to the customer (what's missing?)"
                aria-label="Note to the customer"
                value={holdNote} onChange={(e) => setHoldNote(e.target.value)} />
              <button className="lb-btn" disabled={busy} onClick={() => runAction(() => holdAsset(assetId, holdNote))}>
                Send hold
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="lb-btn" disabled={busy || asset.status === 'FROZEN'} onClick={() => runAction(() => freezeAsset(assetId))}>
              Freeze asset
            </button>
            <button className="lb-btn outline" disabled={busy || asset.status !== 'FROZEN'} onClick={() => runAction(() => unfreezeAsset(assetId))}>
              Unfreeze asset
            </button>
          </div>
        </div>
      )}

      {!myHolding && !isIssuer && user.role === 'CUSTOMER' && (
        <div className="lb-card" style={{ marginTop: 20 }}>
          <strong>Not your asset?</strong>
          <p style={{ color: 'var(--lb-ink-soft)', margin: '4px 0 12px' }}>
            If you believe you're entitled to this asset (e.g. the holder has
            passed away and never transferred or inherited it), you can file
            a claim for RM review.
          </p>
          <Link to={`../claim?assetId=${asset.id}`} className="lb-btn outline">Claim this property</Link>
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
