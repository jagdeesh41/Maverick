import { useEffect, useState } from 'react';
import { getApprovalQueue, approveTransfer, rejectTransfer, holdTransfer } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';

export default function ApprovalQueue() {
  const [transfers, setTransfers] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [holdNotes, setHoldNotes] = useState({});

  function load() {
    getApprovalQueue()
      .then((list) => setTransfers([...list].sort((a, b) => (b.priority - a.priority))))
      .catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function handle(id, action) {
    setBusyId(id);
    setError('');
    try {
      if (action === 'approve') await approveTransfer(id);
      else if (action === 'reject') await rejectTransfer(id);
      else await holdTransfer(id, holdNotes[id] || '');
      load();
    } catch (e) {
      setError(`Transfer #${id}: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Transfer Confirmations</h1>
      <InfoNote>
        Live from <code>GET /rm/approval-queue</code> (LOCKED and ON_HOLD). Approving
        re-checks the asset (Rule 1) and seller's holding (Rule 4), then buyer KYC
        (Rule 2). If anything looks fishy, hold and ask for reverification instead.
      </InfoNote>

      {error && <div className="lb-error-banner">{error}</div>}
      {!transfers && !error && <p>Loading…</p>}
      {transfers && transfers.length === 0 && <p>Nothing pending.</p>}

      {transfers && transfers.map((t) => (
        <div key={t.id} className="lb-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong>Transfer #{t.id}</strong> — Asset #{t.assetId} ({t.assetType}), {t.units} unit(s)
              <div style={{ color: 'var(--lb-ink-soft)', marginTop: 4 }}>
                {t.sellerName} → {t.buyerUsername}
              </div>
              {t.rmNote && <div style={{ marginTop: 6, fontSize: '0.85rem' }}><strong>Your note:</strong> {t.rmNote}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`lb-status ${t.status.toLowerCase()}`}>{t.status.replace('_', ' ')}</span>
              <div style={{ marginTop: 6 }}>
                Buyer KYC: <span className={`lb-status ${(t.buyerKycStatus || 'pending').toLowerCase()}`}>{t.buyerKycStatus || 'NO RECORD'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="lb-btn" disabled={busyId === t.id} onClick={() => handle(t.id, 'approve')}>Approve</button>
            <button className="lb-btn outline" disabled={busyId === t.id} onClick={() => handle(t.id, 'reject')}>Reject</button>
            <input
              className="lb-input" style={{ maxWidth: 240 }} placeholder="Note if holding…"
              value={holdNotes[t.id] || ''}
              onChange={(e) => setHoldNotes((n) => ({ ...n, [t.id]: e.target.value }))}
            />
            <button className="lb-btn outline" disabled={busyId === t.id} onClick={() => handle(t.id, 'hold')}>
              Hold — reverify
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
