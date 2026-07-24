import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

import CustomerDashboard from './CustomerDashboard.jsx';
import MyAssets from './MyAssets.jsx';
import AssetDetail from './AssetDetail.jsx';
import IssueAsset from './IssueAsset.jsx';
import Transfer from './Transfer.jsx';
import Inheritance from './Inheritance.jsx';
import Recovery from './Recovery.jsx';
import Kyc from './Kyc.jsx';

import ApprovalQueue from './ApprovalQueue.jsx';
import RmAssets from './RmAssets.jsx';
import RmKycApprove from './RmKycApprove.jsx';
import AuditTrail from './AuditTrail.jsx';

const navClass = ({ isActive }) => `fabric-nav-link${isActive ? ' active' : ''}`;

/**
 * This is where the "real project" starts — everything below this
 * component talks to the actual Spring Boot backend via src/api.js.
 * Nothing here is mocked (aside from the Legal/Compliance mock
 * endpoints, which are intentionally mocked in the backend itself).
 *
 * Layout: a persistent dark sidebar (distinct from the light Lloyds IB
 * chrome) so entering this app reads as "a purpose-built platform",
 * not more pages tacked onto internet banking.
 */
export default function DigitalAssetsApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <div className="fabric-shell">
      <aside className="fabric-sidebar">
        <div className="fabric-brand">💎 BankChain</div>
        <div className="fabric-brand-sub">Digital Asset Fabric</div>

        <button className="fabric-back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Lloyds banking
        </button>

        <nav className="fabric-nav">
          {isCustomer ? (
            <>
              <NavLink to="" end className={navClass}>🏠 Dashboard</NavLink>
              <NavLink to="assets" className={navClass}>💼 My Assets</NavLink>
              <NavLink to="issue" className={navClass}>➕ Issue Asset</NavLink>
              <NavLink to="transfer" className={navClass}>🔄 Transfer / DvP</NavLink>
              <NavLink to="inheritance" className={navClass}>🧬 Inheritance</NavLink>
              <NavLink to="recovery" className={navClass}>🛟 Recovery</NavLink>
              <NavLink to="kyc" className={navClass}>🪪 KYC</NavLink>
            </>
          ) : (
            <>
              <NavLink to="" end className={navClass}>✅ Approval Queue</NavLink>
              <NavLink to="assets" className={navClass}>💼 All Assets</NavLink>
              <NavLink to="kyc" className={navClass}>🪪 KYC Approvals</NavLink>
              <NavLink to="audit" className={navClass}>📒 Audit Trail</NavLink>
            </>
          )}
        </nav>

        <div className="fabric-footer">
          Logged in as
          <strong>{user?.fullName} ({user?.role})</strong>
          userId {user?.userId}
        </div>
      </aside>

      <main className="fabric-main">
        <div className="fabric-eyebrow">Permissioned · Programmable · Regulator-ready</div>

        <Routes>
          {isCustomer ? (
            <>
              <Route index element={<CustomerDashboard />} />
              <Route path="assets" element={<MyAssets />} />
              <Route path="assets/:assetId" element={<AssetDetail />} />
              <Route path="issue" element={<IssueAsset />} />
              <Route path="transfer" element={<Transfer />} />
              <Route path="inheritance" element={<Inheritance />} />
              <Route path="recovery" element={<Recovery />} />
              <Route path="kyc" element={<Kyc />} />
            </>
          ) : (
            <>
              <Route index element={<ApprovalQueue />} />
              <Route path="assets" element={<RmAssets />} />
              <Route path="assets/:assetId" element={<AssetDetail />} />
              <Route path="kyc" element={<RmKycApprove />} />
              <Route path="audit" element={<AuditTrail />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}
