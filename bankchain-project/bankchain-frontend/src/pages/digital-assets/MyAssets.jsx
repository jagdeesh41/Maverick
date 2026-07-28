import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyAssets } from '../../api.js';
import { formatGBP } from '../../format.js';
import InfoNote from '../../components/InfoNote.jsx';

// GET /customer/assets/{userId} -> your holdings (not raw asset rows).
export default function MyAssets() {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyAssets(user.userId).then(setHoldings).catch((e) => setError(e.message));
  }, [user.userId]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>My Assets</h1>
        <Link to="../issue" className="lb-btn">+ Issue new asset</Link>
      </div>
      <InfoNote>
        Live from <code>GET /customer/assets/{user.userId}</code>. Each row is
        a holding you own — if you later hold part of an asset someone
        transferred to you, it shows up here the same way.
      </InfoNote>

      {error && <div className="lb-error-banner">{error}</div>}
      {!holdings && !error && <p>Loading…</p>}
      {holdings && holdings.length === 0 && (
        <p>You don't hold any tokenized assets yet — <Link to="../issue">issue one</Link> to get started.</p>
      )}

      {holdings && holdings.length > 0 && (
        <table className="lb-table">
          <thead>
            <tr><th>ID</th><th>Type</th><th>You hold</th><th>Your value</th><th>Status</th><th>Nominee</th><th></th></tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.assetId}>
                <td>#{h.assetId}</td>
                <td>{h.assetType}</td>
                <td>{h.unitsHeld} / {h.totalUnits}</td>
                <td>{formatGBP(h.valueShare)}</td>
                <td><span className={`lb-status ${h.status.toLowerCase()}`}>{h.status.replace('_', ' ')}</span></td>
                <td>{h.nominee || '—'}</td>
                <td><Link to={`${h.assetId}`}>Details →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
