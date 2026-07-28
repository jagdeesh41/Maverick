import { useEffect, useState } from 'react';
import { getAllClaims, approveClaim, rejectClaim, holdClaim } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';
import ProofViewer from '../../components/ProofViewer.jsx';

const RELATIONS = { SPOUSE: 'Spouse', CHILD: 'Child', PARENT: 'Parent', SIBLING: 'Sibling', OTHER: 'Other' };

// GET /rm/claims -> every property claim filed by any customer, on any
// asset. Approving calls the smart contract's evaluate_death_claim rule
// (blood relation + certificate required). If a second claimant is
// later approved on the same asset, the holding auto-splits equally.
export default function RmClaims() {
  const [claims, setClaims] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [holdNotes, setHoldNotes] = useState({});

  function load() {
    getAllClaims()
      .then((list) => setClaims([...list].sort((a, b) => (b.priority - a.priority))))
      .catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function handle(id, action) {
    setBusyId(id);
    setError('');
    try {
      if (action === 'approve') await approveClaim(id);
      else if (action === 'reject') await rejectClaim(id);
      else await holdClaim(id, holdNotes[id] || '');
      load();
    } catch (e) {
      setError(`Claim #${id}: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Property Claims</h1>
      <InfoNote>
        Live from <code>GET /rm/claims</code>. Not exclusively death claims —
        any inheritance-style claim on a tokenized asset lands here.
        Approving checks the smart contract: only Spouse/Child/Parent/Sibling
        with a certificate on file are eligible.
      </InfoNote>

      {error && <div className="lb-error-banner">{error}</div>}
      {!claims && !error && <p>Loading…</p>}
      {claims && claims.length === 0 && <p>No claims filed.</p>}

      {claims && claims.map((c) => (
        <div key={c.id} className="lb-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong>Claim #{c.id}</strong> {c.priority && <span style={{ color: 'var(--lb-orange-700)', fontWeight: 700, fontSize: '0.7rem' }}>PRIORITY</span>} — Asset #{c.asset?.id} ({c.asset?.assetType})
              <div style={{ color: 'var(--lb-ink-soft)', marginTop: 4 }}>
                {c.claimant?.fullName} ({c.claimant?.username}) claims to be the {RELATIONS[c.claimantRelation] || c.claimantRelation}
              </div>
              {c.rmNote && <div style={{ marginTop: 6, fontSize: '0.85rem' }}><strong>Your note:</strong> {c.rmNote}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`lb-status ${c.status.toLowerCase()}`}>{c.status.replace('_', ' ')}</span>
              <div style={{ marginTop: 8 }}><ProofViewer value={c.certificateProofBase64} /></div>
            </div>
          </div>

          {(c.status === 'SUBMITTED' || c.status === 'ON_HOLD') && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="lb-btn" disabled={busyId === c.id} onClick={() => handle(c.id, 'approve')}>Approve</button>
              <button className="lb-btn outline" disabled={busyId === c.id} onClick={() => handle(c.id, 'reject')}>Reject</button>
              <input
                className="lb-input" style={{ maxWidth: 240 }} placeholder="Note if holding…"
                aria-label="Hold note"
                value={holdNotes[c.id] || ''}
                onChange={(e) => setHoldNotes((n) => ({ ...n, [c.id]: e.target.value }))}
              />
              <button className="lb-btn outline" disabled={busyId === c.id} onClick={() => handle(c.id, 'hold')}>
                Hold — ask for more documents
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
