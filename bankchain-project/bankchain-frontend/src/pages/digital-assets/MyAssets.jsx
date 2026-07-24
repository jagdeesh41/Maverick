import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMyAssets } from '../../api.js';
import { formatGBP } from '../../format.js';
import InfoNote from '../../components/InfoNote.jsx';

// GET /customer/assets/{userId} -> AssetService.getAssetsForOwner()
export default function MyAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyAssets(user.userId).then(setAssets).catch((e) => setError(e.message));
  }, [user.userId]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>My Assets</h1>
        <Link to="../issue" className="lb-btn">+ Issue new asset</Link>
      </div>
      <InfoNote>
        Live from <code>GET /customer/assets/{user.userId}</code>.
      </InfoNote>

      {error && <div className="lb-error-banner">{error}</div>}
      {!assets && !error && <p>Loading…</p>}

      {assets && assets.length === 0 && <p>You don't own any tokenized assets yet.</p>}

      {assets && assets.length > 0 && (
        <table className="lb-table">
          <thead>
            <tr><th>ID</th><th>Type</th><th>Value</th><th>Units</th><th>Status</th><th>Nominee</th><th></th></tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td>#{a.id}</td>
                <td>{a.assetType}</td>
                <td>{formatGBP(a.assetValue)}</td>
                <td>{a.ownershipUnits}</td>
                <td><span className={`lb-status ${a.status.toLowerCase()}`}>{a.status}</span></td>
                <td>{a.nominee || '—'}</td>
                <td><Link to={`${a.id}`}>Details →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
