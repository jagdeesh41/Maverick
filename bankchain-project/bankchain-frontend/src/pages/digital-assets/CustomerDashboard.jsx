import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getCustomerDashboard } from '../../api.js';
import { formatGBP } from '../../format.js';
import InfoNote from '../../components/InfoNote.jsx';

// GET /customer/dashboard/{userId} -> CustomerController.dashboard()
// Combines: user's full name, count + total value of their assets, and
// a "pending approvals" count (assets with status PLEDGED), all computed
// server-side in DashboardResponse.
export default function CustomerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerDashboard(user.userId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user.userId]);

  if (loading) return <p>Loading dashboard…</p>;
  if (error) return <div className="lb-error-banner">{error}</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Welcome back, {data.customerName}</h1>
      <InfoNote>
        This page is live data from <code>GET /customer/dashboard/{user.userId}</code>,
        which aggregates your asset count and total value server-side.
      </InfoNote>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
        <Stat label="Total assets" value={data.totalAssets} />
        <Stat label="Portfolio value" value={formatGBP(data.portfolioValue)} />
        <Stat label="Pending approvals" value={data.pendingApprovals} />
        <Stat label="Compliance status" value={data.complianceStatus} />
      </div>

      <h3 style={{ marginTop: 32 }}>Your assets</h3>
      {data.assets.length === 0 ? (
        <p>No assets yet — <Link to="../issue">issue your first tokenized asset</Link>.</p>
      ) : (
        <table className="lb-table">
          <thead>
            <tr><th>Type</th><th>Value</th><th>Status</th><th>Ledger token</th><th></th></tr>
          </thead>
          <tbody>
            {data.assets.map((a) => (
              <tr key={a.id}>
                <td>{a.assetType}</td>
                <td>{formatGBP(a.assetValue)}</td>
                <td><span className={`lb-status ${a.status.toLowerCase()}`}>{a.status}</span></td>
                <td><code>{a.ledgerTokenId}</code></td>
                <td><Link to={`../assets/${a.id}`}>View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="lb-card">
      <div style={{ fontSize: '0.78rem', color: 'var(--lb-ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}
