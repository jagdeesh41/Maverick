import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getCustomerDashboard, getMyNotifications, getMyRequests, markAssetPriority, markTransferPriority, markClaimPriority } from '../../api.js';
import { formatGBP } from '../../format.js';
import InfoNote from '../../components/InfoNote.jsx';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function loadAll() {
    Promise.all([
      getCustomerDashboard(user.userId),
      getMyNotifications(user.userId).catch(() => []),
      getMyRequests(user.userId).catch(() => []),
    ]).then(([dash, notes, reqs]) => {
      setData(dash);
      setNotifications(notes);
      setRequests(reqs);
    }).catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, [user.userId]);

  async function raisePriority(type, id) {
    const fn = { ASSET: markAssetPriority, TRANSFER: markTransferPriority, CLAIM: markClaimPriority }[type];
    if (!fn) return;
    try {
      await fn(id, true);
      loadAll();
    } catch (e) {
      window.alert(e.message);
    }
  }

  if (loading) return <p>Loading dashboard…</p>;
  if (error) return <div className="lb-error-banner">{error}</div>;
  if (!data || !Array.isArray(data.assets)) {
    return <div className="lb-error-banner">No dashboard data came back from the backend. Try refreshing, or check the backend logs.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Welcome back, {data.customerName}</h1>
        <button className="lb-btn outline" onClick={loadAll}>Refresh</button>
      </div>
      <InfoNote>
        Live from <code>GET /customer/dashboard/{user.userId}</code>.
      </InfoNote>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
        <Stat label="Total holdings" value={data.totalAssets} />
        <Stat label="Portfolio value" value={formatGBP(data.portfolioValue)} />
        <Stat label="Waiting on RM" value={data.pendingApprovals} accent={data.pendingApprovals > 0} />
        <Stat label="Compliance status" value={data.complianceStatus} />
      </div>

      {/* ---- Recent Updates: every notification fired by any action affecting this user ---- */}
      <h3 style={{ marginTop: 28 }}>Recent Updates</h3>
      {notifications.length === 0 ? (
        <p style={{ color: 'var(--lb-ink-soft)' }}>Nothing yet — updates appear here the moment RM acts on any of your requests.</p>
      ) : (
        <div className="lb-card" style={{ padding: 0 }}>
          {notifications.slice(0, 8).map((n, i) => (
            <div key={n.id} style={{
              display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 16px',
              borderBottom: i < notifications.slice(0, 8).length - 1 ? '1px solid var(--lb-border)' : 'none',
            }}>
              <span>{n.message}</span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                <span className={`lb-status ${n.status.toLowerCase()}`}>{n.status}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--lb-ink-soft)' }}>{new Date(n.createdAt).toLocaleString('en-GB')}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ---- Raised Requests: every request type this user has made, one table ---- */}
      <h3 style={{ marginTop: 28 }}>Raised Requests</h3>
      {requests.length === 0 ? (
        <p style={{ color: 'var(--lb-ink-soft)' }}>You haven't raised any requests yet.</p>
      ) : (
        <table className="lb-table">
          <thead><tr><th>Type</th><th>Details</th><th>Status</th><th></th><th>Date</th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={`${r.type}-${r.id}`}>
                <td>{r.type}</td>
                <td>{r.description}</td>
                <td><span className={`lb-status ${r.status.toLowerCase()}`}>{r.status}</span></td>
                <td>
                  {r.priority ? (
                    <span style={{ color: 'var(--lb-orange-700)', fontWeight: 700, fontSize: '0.78rem' }}>PRIORITY</span>
                  ) : (
                    ['ASSET', 'TRANSFER', 'CLAIM'].includes(r.type) && ['PENDING', 'ON_HOLD', 'PENDING_CONFIRMATION', 'LOCKED', 'SUBMITTED'].includes(r.status) && (
                      <button className="lb-btn outline" style={{ padding: '3px 10px', fontSize: '0.72rem' }} onClick={() => raisePriority(r.type, r.id)}>
                        Mark urgent
                      </button>
                    )
                  )}
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--lb-ink-soft)' }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data.pendingTransfers.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3>Waiting on RM</h3>
          <table className="lb-table">
            <thead><tr><th>Transfer</th><th>Asset</th><th>Units</th><th>Direction</th><th>Status</th><th>RM note</th></tr></thead>
            <tbody>
              {data.pendingTransfers.map((t) => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td>{t.assetType} <span style={{ color: 'var(--lb-ink-soft)' }}>#{t.assetId}</span></td>
                  <td>{t.units}</td>
                  <td>{t.sellerId === user.userId ? `Sending to ${t.buyerUsername}` : `Receiving from ${t.sellerName}`}</td>
                  <td><span className={`lb-status ${t.status.toLowerCase()}`}>{t.status.replace('_', ' ')}</span></td>
                  <td>{t.rmNote || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ marginTop: 28 }}>Your holdings</h3>
      {data.assets.length === 0 ? (
        <p>No assets yet — <Link to="issue">issue your first tokenized asset</Link>.</p>
      ) : (
        <table className="lb-table">
          <thead><tr><th>Type</th><th>Units held</th><th>Your value</th><th>Status</th><th>RM note</th><th></th></tr></thead>
          <tbody>
            {data.assets.map((a) => (
              <tr key={a.assetId}>
                <td>{a.assetType}</td>
                <td>{a.unitsHeld} / {a.totalUnits}</td>
                <td>{formatGBP(a.valueShare)}</td>
                <td><span className={`lb-status ${a.status.toLowerCase()}`}>{a.status.replace('_', ' ')}</span></td>
                <td>{a.rmNote || '—'}</td>
                <td><Link to={`assets/${a.assetId}`}>View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="lb-card" style={accent ? { borderColor: 'var(--lb-orange-500)' } : undefined}>
      <div style={{ fontSize: '0.78rem', color: 'var(--lb-ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4, color: accent ? 'var(--lb-orange-700)' : 'inherit' }}>{value}</div>
    </div>
  );
}
