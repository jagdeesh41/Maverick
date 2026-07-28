import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPendingConfirmationAssets } from '../../api.js';
import { formatGBP } from '../../format.js';
import InfoNote from '../../components/InfoNote.jsx';

// GET /rm/assets/pending-confirmation -> a quick table. Click into an
// asset to actually verify the proof photo and Approve/Hold - keeps
// this list scannable instead of a wall of cards.
export default function IssuanceQueue() {
  const [assets, setAssets] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getPendingConfirmationAssets()
      .then((list) => setAssets([...list].sort((a, b) => (b.priority - a.priority))))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Asset Issuance Confirmations</h1>
      <InfoNote>
        Live from <code>GET /rm/assets/pending-confirmation</code>. Click into an
        asset to view its proof document and Approve or Hold it — Approve now
        runs through smart contract Rule 7 first (ownership % valid for the
        asset type + proof attached); if it fails, you'll see the contract's
        exact reason instead of the asset going ACTIVE.
      </InfoNote>

      {error && <div className="lb-error-banner">{error}</div>}
      {!assets && !error && <p>Loading…</p>}
      {assets && assets.length === 0 && <p>Nothing waiting on confirmation.</p>}

      {assets && assets.length > 0 && (
        <table className="lb-table">
          <thead>
            <tr><th>ID</th><th>Type</th><th>Issuer</th><th>Value</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td>#{a.id} {a.priority && <span style={{ color: 'var(--lb-orange-700)', fontWeight: 700, fontSize: '0.7rem' }}>PRIORITY</span>}</td>
                <td>{a.assetType}</td>
                <td>{a.issuerName}</td>
                <td>{formatGBP(a.assetValue)}</td>
                <td><span className={`lb-status ${a.status.toLowerCase()}`}>{a.status.replace('_', ' ')}</span></td>
                <td><Link to={`assets/${a.id}`}>Verify & decide →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
