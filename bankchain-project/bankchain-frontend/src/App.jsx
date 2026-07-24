import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DigitalAssetsApp from './pages/digital-assets/DigitalAssetsApp.jsx';
import { useAuth } from './context/AuthContext.jsx';

function RequireLogin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Static Lloyds Internet Banking login — 2-role picker, backed by the
          real POST /auth/login so the userId it gets back is real and usable
          later, even though the surrounding banking chrome is static. */}
      <Route path="/" element={<LoginPage />} />

      {/* Static Lloyds Internet Banking "home" screen (matches your 3
          screenshots). The only live thing on this page is the
          "Open Digital Assets" button — the single entry point into the
          real, backend-connected app. */}
      <Route
        path="/dashboard"
        element={
          <RequireLogin>
            <DashboardPage />
          </RequireLogin>
        }
      />

      {/* Everything under here is the real BankChain Asset Fabric app,
          fully wired to bankchain-backend. */}
      <Route
        path="/digital-assets/*"
        element={
          <RequireLogin>
            <DigitalAssetsApp />
          </RequireLogin>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
