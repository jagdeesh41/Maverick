import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LloydsTopBar from '../../components/LloydsTopBar.jsx';

import CustomerDashboard from './CustomerDashboard.jsx';
import MyAssets from './MyAssets.jsx';
import AssetDetail from './AssetDetail.jsx';
import IssueAsset from './IssueAsset.jsx';
import Transfer from './Transfer.jsx';
import Inheritance from './Inheritance.jsx';
import Recovery from './Recovery.jsx';
import Kyc from './Kyc.jsx';
import ClaimProperty from './ClaimProperty.jsx';

import IssuanceQueue from './IssuanceQueue.jsx';
import ApprovalQueue from './ApprovalQueue.jsx';
import RmAssets from './RmAssets.jsx';
import RmKycApprove from './RmKycApprove.jsx';
import RmRecovery from './RmRecovery.jsx';
import RmClaims from './RmClaims.jsx';
import RmLookup from './RmLookup.jsx';
import AuditTrail from './AuditTrail.jsx';

const navClass = ({ isActive }) => `fabric-nav-link${isActive ? ' active' : ''}`;

export default function DigitalAssetsApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <div>
      <LloydsTopBar />
      <div className="fabric-shell">
        <aside className="fabric-sidebar">
          <div className="fabric-brand">BankChain</div>
          <div className="fabric-brand-sub">Digital Asset Fabric</div>

          <nav className="fabric-nav" style={{ marginTop: 18 }}>
            {isCustomer ? (
              <>
                <NavLink to="" end className={navClass}>Dashboard</NavLink>
                <NavLink to="assets" className={navClass}>My Assets</NavLink>
                <NavLink to="issue" className={navClass}>Issue Asset</NavLink>
                <NavLink to="transfer" className={navClass}>Transfer / DvP</NavLink>
                <NavLink to="inheritance" className={navClass}>Inheritance</NavLink>
                <NavLink to="claim" className={navClass}>Claim a Property</NavLink>
                <NavLink to="recovery" className={navClass}>Recovery</NavLink>
                <NavLink to="kyc" className={navClass}>KYC</NavLink>
              </>
            ) : (
              <>
                <NavLink to="" end className={navClass}>Issuance Queue</NavLink>
                <NavLink to="approvals" className={navClass}>Transfer Confirmations</NavLink>
                <NavLink to="assets" className={navClass}>All Assets</NavLink>
                <NavLink to="claims" className={navClass}>Property Claims</NavLink>
                <NavLink to="kyc" className={navClass}>KYC Approvals</NavLink>
                <NavLink to="recovery" className={navClass}>Recovery</NavLink>
                <NavLink to="lookup" className={navClass}>Look Up a Customer</NavLink>
                <NavLink to="audit" className={navClass}>Audit Trail</NavLink>
              </>
            )}
          </nav>

          <button className="fabric-back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Lloyds banking
          </button>

          <div className="fabric-footer">
            {user?.role} · userId {user?.userId}
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
                <Route path="claim" element={<ClaimProperty />} />
                <Route path="recovery" element={<Recovery />} />
                <Route path="kyc" element={<Kyc />} />
              </>
            ) : (
              <>
                <Route index element={<IssuanceQueue />} />
                <Route path="approvals" element={<ApprovalQueue />} />
                <Route path="assets" element={<RmAssets />} />
                <Route path="assets/:assetId" element={<AssetDetail />} />
                <Route path="claims" element={<RmClaims />} />
                <Route path="kyc" element={<RmKycApprove />} />
                <Route path="recovery" element={<RmRecovery />} />
                <Route path="lookup" element={<RmLookup />} />
                <Route path="audit" element={<AuditTrail />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
}
