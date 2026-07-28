import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Shown on every authenticated screen (Dashboard + the whole Digital
 * Asset Fabric app) so it never disappears while navigating. Matches
 * the real Lloyds IB header. Only "Log off" is a real action - the
 * rest (Your Accounts, Your Profile, etc.) is the same decorative
 * chrome the rest of the site already uses.
 */
export default function LloydsTopBar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  function logOff() {
    setUser(null);
    navigate('/');
  }

  return (
    <header className="lb-topbar">
      <div className="lb-topbar-brand-row">
        <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>LLOYDS BANK</span>
        <span style={{ fontSize: '0.8rem', opacity: 0.9, textDecoration: 'underline' }}>Cookie Policy</span>
      </div>
      <div className="lb-topbar-user-row">
        <div>
          <strong>{user?.fullName || user?.username}</strong>
          <span style={{ opacity: 0.8, marginLeft: 10, fontSize: '0.8rem' }}>🔒 Last logged on today</span>
        </div>
        <nav className="lb-topbar-nav">
          <span>Your Accounts</span>
          <span>Your Profile</span>
          <span>Your Security</span>
          <span>Help &amp; Support</span>
        </nav>
        <button className="lb-topbar-logoff" onClick={logOff}>Log off</button>
      </div>
    </header>
  );
}
