import { useEffect, useState } from 'react';
import { getAuditTrail } from '../../api.js';
import InfoNote from '../../components/InfoNote.jsx';

// GET /rm/audit-trail -> AuditService.getAllEvents(), newest first.
// Every service call in the backend writes here — logins, mints,
// freezes, transfers, dispute rules, and even smart-contract fallbacks
// when the Python engine is unreachable.
export default function AuditTrail() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAuditTrail().then(setEvents).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Audit Trail</h1>
      <InfoNote>
        Live from <code>GET /rm/audit-trail</code>. Every service call in the
        backend writes here — logins, mints, freezes, transfers, dispute
        rules, and even smart-contract fallbacks if Python is unreachable.
      </InfoNote>

      {error && <div className="lb-error-banner">{error}</div>}
      {!events && !error && <p>Loading…</p>}

      {events && (
        <table className="lb-table">
          <thead>
            <tr><th>Time</th><th>Event</th><th>Source</th><th>Status</th><th>Evidence</th></tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.timestamp).toLocaleString('en-GB')}</td>
                <td>{e.eventType}</td>
                <td>{e.source}</td>
                <td><span className={`lb-status ${e.status.toLowerCase()}`}>{e.status}</span></td>
                <td><code style={{ fontSize: '0.8rem' }}>{e.evidence}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
