import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Static Lloyds "Welcome to Internet Banking" login screen — matches the
 * screenshots you sent. The role toggle (Customer / Relationship Manager)
 * and the surrounding chrome (cookie policy, FSCS badge, etc.) are static
 * decoration, exactly like the real Lloyds page.
 *
 * The one real thing on this page: hitting "Continue" calls the ACTUAL
 * POST /auth/login on bankchain-backend with whatever User ID + role you
 * picked. That's what gives the rest of the app a real userId to work
 * with — the mocked username field on your seeded users is prefilled
 * ("priyal" for Customer, "rm.admin" for RM) but you can type any
 * username; the backend auto-creates it if it doesn't exist yet
 * (see UserService.login()).
 */
export default function LoginPage() {
  const [role, setRole] = useState('CUSTOMER');
  const [userId, setUserId] = useState('priyal');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  function handleRoleClick(nextRole) {
    setRole(nextRole);
    setUserId(nextRole === 'CUSTOMER' ? 'priyal' : 'rm.admin');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(userId.trim(), role, password);
      setUser(result); // { userId, username, fullName, role, verifiedCustomer, token }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="lb-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span className="brand">LLOYDS BANK</span>
          <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Mobile</span>
          <span style={{ fontSize: '0.85rem', opacity: 0.9, textDecoration: 'underline' }}>Cookie policy</span>
        </div>
        <div className="lb-secure-badge">
          🔒 You're logging into a secure site<br />
          <span style={{ opacity: 0.85 }}>How can I tell that this site is secure?</span>
        </div>
      </header>

      <div className="lb-page" style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 480px' }}>
          <h1 style={{ fontSize: '2.2rem', margin: '8px 0 20px' }}>Welcome to Internet Banking</h1>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button
              type="button"
              className={`lb-pill-toggle ${role === 'CUSTOMER' ? 'active' : ''}`}
              onClick={() => handleRoleClick('CUSTOMER')}
            >
              👤 Customer
            </button>
            <button
              type="button"
              className={`lb-pill-toggle ${role === 'RM' ? 'active' : ''}`}
              onClick={() => handleRoleClick('RM')}
            >
              💼 Relationship Manager
            </button>
          </div>

          <p style={{ marginBottom: 24 }}>
            If you don't already use Internet Banking, it's simple to{' '}
            <a href="#" onClick={(e) => e.preventDefault()}><strong>register online</strong></a>.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label className="lb-label" htmlFor="userId">User ID:</label>
              <input
                id="userId"
                className="lb-input"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="lb-label" htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                className="lb-input"
                placeholder="Demo password: Passw0rd1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', marginBottom: 6 }}>
              <input type="checkbox" defaultChecked readOnly />
              Remember my User ID
            </label>
            <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>
              <strong>Warning:</strong> Don't tick this box if you're using a public or shared computer
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid var(--lb-border)', margin: '16px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ fontWeight: 700 }}>
                Forgotten your logon details?
              </a>
              <button type="submit" className="lb-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Continue'}
              </button>
            </div>
          </form>

          {error && (
            <div className="lb-error-banner" style={{ marginTop: 20 }}>
              {error}
            </div>
          )}

          <div className="lb-card" style={{ marginTop: 24, background: 'var(--lb-green-50)', borderColor: '#b6e2cc' }}>
            <strong>Prototype demo</strong> — MFA/KYC are mocked, but the
            password is real and checked against a stored (BCrypt-hashed)
            value. Seeded demo accounts (priyal, rahul, ananya, rm.admin,
            legal.exec, compliance.audit) use password <code>Passw0rd1</code>.
            Typing a brand-new User ID provisions it with whatever password
            you enter — every login after that must match it.
          </div>

          <div style={{ marginTop: 32, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--lb-green-50)', borderRadius: 10, padding: 10 }}>📱</div>
            <div>
              <strong>Why not try our secure Mobile Banking app?</strong>
              <p style={{ margin: '4px 0 0', color: 'var(--lb-ink-soft)' }}>
                With our app you get access to lots of extra features to make banking
                even easier. Things like freeze your card, check your PIN and set your
                own contactless limit.
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="lb-card">Help &amp; Support ⌄</div>
          <div className="lb-card">Contact Us ⌄</div>
          <div className="lb-card" style={{ textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: 'var(--lb-purple)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.5rem'
            }}>🔒</div>
            <strong style={{ color: 'var(--lb-purple)' }}>FSCS PROTECTED</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
