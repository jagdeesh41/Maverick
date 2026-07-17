import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AccountOverview from './pages/AccountOverview';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import MyAssets from './pages/customer/MyAssets';
import TransferAsset from './pages/customer/TransferAsset';
import TransactionHistory from './pages/customer/TransactionHistory';
import DigitalWill from './pages/customer/DigitalWill';

import RMDashboard from './pages/rm/RMDashboard';
import ClientList from './pages/rm/ClientList';
import ApprovalQueue from './pages/rm/ApprovalQueue';
import RiskMonitoring from './pages/rm/RiskMonitoring';
import AuditTrail from './pages/rm/AuditTrail';

// Customers land on the traditional Account Overview page after login;
// the RM console has no account overview and goes straight to the dashboard.
function landingPathFor(role) {
  return role === 'customer' ? '/accounts' : '/rm';
}

function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={landingPathFor(user.role)} replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={landingPathFor(user.role)} replace /> : <Login />} />

      <Route
        path="/accounts"
        element={<RequireRole role="customer"><AccountOverview /></RequireRole>}
      />

      <Route
        path="/customer"
        element={<RequireRole role="customer"><Layout role="customer" /></RequireRole>}
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="assets" element={<MyAssets />} />
        <Route path="transfer" element={<TransferAsset />} />
        <Route path="history" element={<TransactionHistory />} />
        <Route path="will" element={<DigitalWill />} />
      </Route>

      <Route
        path="/rm"
        element={<RequireRole role="rm"><Layout role="rm" /></RequireRole>}
      >
        <Route index element={<RMDashboard />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="approvals" element={<ApprovalQueue />} />
        <Route path="risk" element={<RiskMonitoring />} />
        <Route path="audit" element={<AuditTrail />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? landingPathFor(user.role) : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
