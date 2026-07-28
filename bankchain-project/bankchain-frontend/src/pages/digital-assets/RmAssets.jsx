import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllAssets, raiseDispute } from '../../api.js';
import { formatGBP } from '../../format.js';
import InfoNote from '../../components/InfoNote.jsx';

// GET /rm/assets -> oversight view. Each asset now shows its holder
// count (from the cap table) since one asset can be split across
// multiple people after partial transfers settle.
export default function RmAssets() {
  const [assets, setAssets] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  function load() {
    getAllAssets().then(setAssets).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function handleDispute(assetId) {
    setBusyId(assetId);
    setError('');
    try {
      await raiseDispute(assetId);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>All Assets (oversight)</h1>
      <InfoNote>
        Live from <code>GET /rm/assets</code>. "Raise dispute" calls{' '}
        <code>POST /rm/inheritance/&#123;assetId&#125;/dispute</code> — only works if
        the asset already has an inheritance policy set.
      </InfoNote>

      {error && <div className="lb-error-banner">{error}</div>}
      {!assets && !error && <p>Loading…</p>}

      {assets && (
        <table className="lb-table">
          <thead>
            <tr><th>ID</th><th>Issuer</th><th>Type</th><th>Value</th><th>Holders</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td>#{a.id}</td>
                <td>{a.issuerName}</td>
                <td>{a.assetType}</td>
                <td>{formatGBP(a.assetValue)}</td>
                <td>{a.holders?.length ?? 0}</td>
                <td><span className={`lb-status ${a.status.toLowerCase()}`}>{a.status.replace('_', ' ')}</span></td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <Link to={`${a.id}`}>Details / freeze →</Link>
                  <button className="lb-btn outline" style={{ padding: '4px 10px' }} disabled={busyId === a.id} onClick={() => handleDispute(a.id)}>
                    Raise dispute
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
