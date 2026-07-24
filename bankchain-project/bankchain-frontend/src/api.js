/**
 * api.js
 * ----------------------------------------------------------------------
 * THE ONLY FILE IN THIS FRONTEND THAT TALKS TO THE JAVA BACKEND.
 *
 * Every function here maps 1:1 to one real endpoint in the Spring Boot
 * backend (bankchain-backend). Nothing in this file is mocked — if the
 * backend isn't running, these calls will fail with a network error,
 * which the UI surfaces to you.
 *
 * Base URL comes from VITE_API_BASE_URL (see .env.example). Backend
 * default port is 8081.
 *
 * The backend wraps every response in ApiResponse<T>:
 *   { success: boolean, message: string, data: T }
 * so `request()` below unwraps `.data` for you and throws a JS Error
 * with the backend's `message` if `success` is false (this is how a
 * BusinessRuleException from a smart-contract rule — e.g. "Asset is
 * FROZEN" — reaches the UI).
 * ----------------------------------------------------------------------
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (networkErr) {
    throw new Error(
      `Could not reach the backend at ${BASE_URL}. Is bankchain-backend running? (${networkErr.message})`
    );
  }

  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  // GlobalExceptionHandler.java returns ApiResponse.error(...) with a
  // non-2xx HTTP status for BusinessRuleException / ResourceNotFoundException.
  if (!res.ok || (body && body.success === false)) {
    const message = body?.message || `Request failed (HTTP ${res.status})`;
    throw new Error(message);
  }

  return body?.data;
}

/* ============================== AUTH ============================== */
// POST /auth/login  -> AuthController.login()
// Mocked login: username + role only, no password. If the username
// doesn't exist yet, UserService.login() auto-creates it.
export function login(username, role) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, role }),
  });
}

/* ============================ CUSTOMER ============================= */
// GET /customer/dashboard/{userId} -> CustomerController.dashboard()
export function getCustomerDashboard(userId) {
  return request(`/customer/dashboard/${userId}`);
}

// POST /customer/assets/issue -> AssetService.issueAsset()
// Triggers LedgerService.mint() under the hood (MockGCULAdapter).
export function issueAsset(payload) {
  return request('/customer/assets/issue', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// GET /customer/assets/{userId} -> AssetService.getAssetsForOwner()
export function getMyAssets(userId) {
  return request(`/customer/assets/${userId}`);
}

// GET /customer/assets/details/{assetId}
export function getAssetDetails(assetId) {
  return request(`/customer/assets/details/${assetId}`);
}

// POST /customer/transfer -> TransferService.initiateTransfer()
// Backend calls the Python smart contract Rule 1 (check_transfer_allowed)
// before locking the transfer. Throws BusinessRuleException if FROZEN.
export function initiateTransfer(payload) {
  return request('/customer/transfer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// POST /customer/inheritance -> InheritanceService.setPolicy()
export function setInheritancePolicy(payload) {
  return request('/customer/inheritance', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// GET /customer/inheritance/{assetId}
export function getInheritancePolicy(assetId) {
  return request(`/customer/inheritance/${assetId}`);
}

// POST /customer/recovery -> RecoveryService.submitRequest()
export function submitRecovery(payload) {
  return request('/customer/recovery', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// GET /customer/recovery/{userId}
export function getRecoveryRequests(userId) {
  return request(`/customer/recovery/${userId}`);
}

// POST /customer/kyc -> KycService.submit()
export function submitKyc(payload) {
  return request('/customer/kyc', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// GET /customer/kyc/{userId}
export function getKyc(userId) {
  return request(`/customer/kyc/${userId}`);
}

/* ================================ RM ================================ */
// GET /rm/approval-queue -> TransferService.getPendingTransfers() (status=LOCKED)
export function getApprovalQueue() {
  return request('/rm/approval-queue');
}

// POST /rm/transfer/{id}/approve -> TransferService.approveTransfer()
// Backend re-checks Rule 1, then checks Rule 2 (check_approval_allowed)
// against the buyer's KYC status before settling.
export function approveTransfer(id) {
  return request(`/rm/transfer/${id}/approve`, { method: 'POST' });
}

// POST /rm/transfer/{id}/reject
export function rejectTransfer(id) {
  return request(`/rm/transfer/${id}/reject`, { method: 'POST' });
}

// GET /rm/assets -> AssetService.getAllAssets() (oversight view, all customers)
export function getAllAssets() {
  return request('/rm/assets');
}

// POST /rm/assets/{id}/freeze -> AssetService.freezeAsset() -> LedgerService.freeze()
export function freezeAsset(id) {
  return request(`/rm/assets/${id}/freeze`, { method: 'POST' });
}

// POST /rm/assets/{id}/unfreeze
export function unfreezeAsset(id) {
  return request(`/rm/assets/${id}/unfreeze`, { method: 'POST' });
}

// POST /rm/recovery/{id}/advance?status=...
export function advanceRecovery(id, status) {
  return request(`/rm/recovery/${id}/advance?status=${encodeURIComponent(status)}`, {
    method: 'POST',
  });
}

// GET /rm/audit-trail -> AuditService.getAllEvents()
export function getAuditTrail() {
  return request('/rm/audit-trail');
}

// POST /rm/kyc/{userId}/approve -> KycService.approve()
export function approveKyc(userId) {
  return request(`/rm/kyc/${userId}/approve`, { method: 'POST' });
}

// POST /rm/inheritance/{assetId}/dispute -> InheritanceService.raiseDispute()
// Calls the Python smart contract Rule 3 (evaluate_dispute), which always
// returns action=FREEZE; Java then actually freezes the asset.
export function raiseDispute(assetId) {
  return request(`/rm/inheritance/${assetId}/dispute`, { method: 'POST' });
}

/* =============================== MOCK =============================== */
// These back the LEGAL / COMPLIANCE roles, which are intentionally
// mocked in the backend (see MockController.java) — not built out yet.
export function getLegalClaims() {
  return request('/mock/legal/claims');
}
export function getComplianceMonitoring() {
  return request('/mock/compliance/monitoring');
}
