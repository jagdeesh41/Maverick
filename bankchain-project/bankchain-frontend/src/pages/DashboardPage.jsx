import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Static Lloyds Internet Banking "home" screen — matches your 3
 * screenshots (accounts list, "Explore Digital Asset Tokenization"
 * banner, "DIGITAL ASSETS" nav item). Every number here (balances,
 * account numbers) is fake, hardcoded decoration, same as the login
 * page's surrounding chrome.
 *
 * The ONE real entry point is the "Open Digital Assets" button and the
 * "DIGITAL ASSETS" nav link — both route to /digital-assets, which is
 * where the real, backend-connected app starts.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const accounts = [
    { name: 'RESTRICTED CURRENT ACC', number: '77-20-27 46013668', balance: '£ 0.00', tag: 'Primary' },
    { name: 'CLASSIC', number: '77-01-01 75658360', balance: '£ 20,271.78' },
    { name: 'EASY SAVER', number: '77-01-01 75636168', balance: '£ 20,728.22', tag: 'Current balance' },
    { name: 'LLOYDS BANK WORLD ELITE MASTERCARD', number: '5404 40•• •••• 7464', balance: '-£ 1,284.16', negative: true },
  ];

  const nav = [
    'SAVINGS & INVESTMENTS', 'LOANS & CAR FINANCE', 'WEALTH AND RETIREMENT',
    'CREDIT CARDS', 'OVERDRAFTS', 'MORTGAGES', 'HOME INSURANCE', 'INSURANCE',
    'BANK ACCOUNTS', 'UPGRADE BANK ACCOUNT',
  ];

  return (
    <div>
      <header className="lb-header">
        <span className="brand">LLOYDS BANK</span>
        <span style={{ fontSize: '0.85rem', opacity: 0.9, textDecoration: 'underline' }}>Cookie Policy</span>
      </header>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 4px' }}>{user?.fullName || user?.username}</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--lb-ink-soft)' }}>🔒 Last logged on today</span>
          </div>
          <nav style={{ display: 'flex', gap: 24, fontWeight: 700, color: 'var(--lb-green-800)', flexWrap: 'wrap' }}>
            <span>🏠</span>
            <span>Your Accounts ⌄</span>
            <span>Your Profile ⌄</span>
            <span>Your Security</span>
            <span>Help &amp; Support ⌄</span>
            <span>✉️</span>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Log off</span>
          </nav>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '20px auto 0', padding: '0 24px', display: 'flex', gap: 24 }}>
        <aside style={{ width: 260, flexShrink: 0 }}>
          <div style={{
            background: 'var(--lb-green-800)', color: '#fff', borderRadius: '8px 8px 0 0',
            padding: '14px 18px', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.03em'
          }}>
            OUR PRODUCTS AND SERVICES
          </div>
          <div style={{ background: 'var(--lb-green-700)' }}>
            {nav.map((item) => (
              <div key={item} style={{
                padding: '13px 18px', color: '#fff', fontSize: '0.82rem', fontWeight: 600,
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}>
                {item} <span style={{ float: 'right' }}>+</span>
              </div>
            ))}
            <div style={{
              padding: '13px 18px', color: '#fff', fontSize: '0.82rem', fontWeight: 700,
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              OTHER SERVICES <span style={{ float: 'right' }}>+</span>
            </div>
            <div
              onClick={() => navigate('/digital-assets')}
              style={{
                padding: '13px 18px', color: '#fff', fontSize: '0.82rem', fontWeight: 800,
                background: 'var(--lb-orange-600)', cursor: 'pointer', borderRadius: '0 0 8px 8px'
              }}
            >
              💎 DIGITAL ASSETS <span style={{ float: 'right' }}>›</span>
            </div>
          </div>

          <div className="lb-card" style={{ marginTop: 16, fontSize: '0.85rem', fontWeight: 700 }}>GET ADD-ONS</div>
          <div className="lb-card" style={{ marginTop: 12, fontSize: '0.85rem', fontWeight: 700 }}>
            WHAT'S NEW IN INTERNET BANKING
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          <div className="lb-banner">
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', opacity: 0.85 }}>NEW</div>
              <h3 style={{ margin: '6px 0 8px', fontSize: '1.4rem' }}>Explore Digital Asset Tokenization</h3>
              <p style={{ margin: 0, maxWidth: 480, opacity: 0.95 }}>
                View, transfer and manage your tokenized property, bonds, shares and
                commodities — with programmable inheritance and real-time valuation.
              </p>
            </div>
            <button
              className="lb-btn"
              style={{ background: '#fff', color: 'var(--lb-green-800)', fontSize: '1rem' }}
              onClick={() => navigate('/digital-assets')}
            >
              Open Digital Assets →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            {accounts.map((acc) => (
              <div key={acc.number} className="lb-card" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {acc.name} <span style={{ color: 'var(--lb-ink-soft)', fontWeight: 500 }}>{acc.number}</span>
                  </div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: acc.negative ? 'var(--lb-danger)' : 'var(--lb-ink)', marginTop: 6 }}>
                    {acc.balance}
                  </div>
                  {acc.tag && <div style={{ fontSize: '0.8rem', color: 'var(--lb-ink-soft)', marginTop: 4 }}>{acc.tag}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: '0.85rem', fontWeight: 700 }}>View statement ›</a>
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: '0.85rem', fontWeight: 700 }}>Payments and transfers ›</a>
                  <button className="lb-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>More actions ›</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
