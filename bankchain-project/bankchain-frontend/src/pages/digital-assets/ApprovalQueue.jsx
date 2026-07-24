import { useEffect, useState } from 'react';
import { getApprovalQueue, approveTransfer, rejectTransfer } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';

// GET /rm/approval-queue -> transfers with status LOCKED
// POST /rm/transfer/{id}/approve -> re-checks Rule 1 (frozen?) AND
//   Rule 2 (buyer KYC APPROVED?) via the Python smart contract, then
//   settles. Rejecting bypasses both rules and just marks REJECTED.
export default function ApprovalQueue() {
  const [transfers, setTransfers] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  function load() {
    getApprovalQueue().then(setTransfers).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function handle(id, action) {
    setBusyId(id);
    setError('');
    try {
      if (action === 'approve') await approveTransfer(id);
      else await rejectTransfer(id);
      load();
    } catch (e) {
      setError(`Transfer #${id}: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Approval Queue</h1>
      <InfoNote>
        Live from <code>GET /rm/approval-queue</code>. Approving calls the
        Python smart contract engine twice (Rule 1 then Rule 2) — if the
        buyer's KYC isn't APPROVED yet, you'll see the exact rejection
        reason returned by <code>contracts.py</code>.
      </InfoNote>

      {error && <div className="lb-error-banner">{error}</div>}
      {!transfers && !error && <p>Loading…</p>}
      {transfers && transfers.length === 0 && <p>Nothing pending.</p>}

      {transfers && transfers.length > 0 && (
        <table className="lb-table">
          <thead>
            <tr><th>ID</th><th>Asset</th><th>Buyer</th><th>Units</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id}>
                <td>#{t.id}</td>
                <td>#{t.asset?.id} — {t.asset?.assetType}</td>
                <td>{t.buyerCustomerId}</td>
                <td>{t.units}</td>
                <td><span className={`lb-status ${t.status.toLowerCase()}`}>{t.status}</span></td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="lb-btn" disabled={busyId === t.id} onClick={() => handle(t.id, 'approve')}>
                    Approve
                  </button>
                  <button className="lb-btn outline" disabled={busyId === t.id} onClick={() => handle(t.id, 'reject')}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
