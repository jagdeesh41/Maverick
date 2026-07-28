import { useState } from 'react';
import { Link } from 'react-router-dom';
import { rmLookup } from '../../api.js';
import { formatGBP } from '../../format.js';
import InfoNote from '../../components/InfoNote.jsx';

// GET /rm/lookup?query=... -> one box, any of: user ID, username, asset
// ID, or ledger token ID. Returns whatever matched, fully bundled -
// holdings, transfers, KYC, recovery requests, and claims filed.
export default function RmLookup() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await rmLookup(query);
      if (!r.user && !r.asset) setError(`Nothing matched "${query}" - try a user ID, username, asset ID, or token ID.`);
      setResult(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Look Up a Customer</h1>
      <InfoNote>
        Live from <code>GET /rm/lookup</code>. Enter a user ID, username, asset
        ID, or ledger token ID - whatever's tied to it comes back in one view.
      </InfoNote>

      <form onSubmit={handleSearch} className="lb-card" style={{ display: 'flex', gap: 8 }}>
        <input className="lb-input" placeholder="e.g. priyal, 3, or a token ID"
          aria-label="Search by user, asset, or token ID"
          value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="lb-btn" disabled={busy || !query}>{busy ? 'Searching…' : 'Search'}</button>
      </form>

      {error && <div className="lb-error-banner" style={{ marginTop: 16 }}>{error}</div>}

      {result?.user && (
        <div className="lb-card" style={{ marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>{result.user.fullName} <span style={{ color: 'var(--lb-ink-soft)', fontWeight: 400 }}>({result.user.username}, {result.user.role}, userId {result.user.userId})</span></h3>

          <strong>Holdings</strong>
          {result.user.holdings?.length ? (
            <table className="lb-table"><thead><tr><th>Asset</th><th>Units</th><th>Value</th><th>Status</th></tr></thead>
              <tbody>{result.user.holdings.map((h) => (
                <tr key={h.assetId}><td>#{h.assetId} {h.assetType}</td><td>{h.unitsHeld}/{h.totalUnits}</td><td>{formatGBP(h.valueShare)}</td><td>{h.status}</td></tr>
              ))}</tbody>
            </table>
          ) : <p style={{ color: 'var(--lb-ink-soft)' }}>None.</p>}

          <strong>Transfers</strong>
          {result.user.transfers?.length ? (
            <table className="lb-table"><thead><tr><th>ID</th><th>Asset</th><th>Units</th><th>Status</th></tr></thead>
              <tbody>{result.user.transfers.map((t) => (
                <tr key={t.id}><td>#{t.id}</td><td>#{t.assetId} {t.assetType}</td><td>{t.units}</td><td>{t.status}</td></tr>
              ))}</tbody>
            </table>
          ) : <p style={{ color: 'var(--lb-ink-soft)' }}>None.</p>}

          <strong>KYC</strong>
          <p>{result.user.kyc ? `${result.user.kyc.documentType} — ${result.user.kyc.status}` : 'No record'}</p>

          <strong>Recovery requests</strong>
          <p>{result.user.recoveryRequests?.length || 0} on file</p>

          <strong>Claims filed</strong>
          <p>{result.user.claimsFiled?.length || 0} on file</p>
        </div>
      )}

      {result?.asset && (
        <div className="lb-card" style={{ marginTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>
            Asset #{result.asset.id} — {result.asset.assetType}
            {' '}<Link to={`../assets/${result.asset.id}`} style={{ fontSize: '0.85rem' }}>(open full detail →)</Link>
          </h3>
          <p>Issuer: {result.asset.issuerName} · Value: {formatGBP(result.asset.assetValue)} · Status: {result.asset.status}</p>

          <strong>Cap table</strong>
          <table className="lb-table"><thead><tr><th>Holder</th><th>Units</th></tr></thead>
            <tbody>{result.asset.holders?.map((h) => (
              <tr key={h.holderId}><td>{h.holderName}</td><td>{h.unitsHeld}</td></tr>
            ))}</tbody>
          </table>

          <strong>Transfers on this asset</strong>
          <p>{result.assetTransfers?.length || 0} on file</p>

          <strong>Claims on this asset</strong>
          <p>{result.assetClaims?.length || 0} on file</p>
        </div>
      )}
    </div>
  );
}
