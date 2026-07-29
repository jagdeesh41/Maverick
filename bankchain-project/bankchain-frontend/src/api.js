/**
 * api.js
 * ----------------------------------------------------------------------
 * THE ONLY FILE IN THIS FRONTEND THAT TALKS TO THE JAVA BACKEND.
 * Every function maps 1:1 to one real endpoint. Base URL from
 * VITE_API_BASE_URL (.env). Backend wraps responses in ApiResponse<T>
 * { success, message, data } - request() unwraps .data and throws a JS
 * Error with the backend's message on failure (this is how a rejected
 * smart-contract rule reaches the UI as an error banner).
 * ----------------------------------------------------------------------
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Bearer token issued by POST /auth/login, kept in module memory. AuthContext
// sets this on login/page-load and clears it on logout - see setAuthToken/clearAuthToken.
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

async function request(path, options = {}) {
  let res;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
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

  if (!res.ok || (body && body.success === false)) {
    const message = body?.message || `Request failed (HTTP ${res.status})`;
    throw new Error(message);
  }

  return body?.data;
}

// Every FileUpload.jsx picker calls this the moment a file is chosen - the
// returned key is what the actual form later submits, never the file bytes
// again. Deliberately bypasses request(): a multipart body needs the browser
// to set its own Content-Type boundary, not the fixed 'application/json' header.
export async function uploadProofFile(file, category) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const headers = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}/customer/files/upload`, { method: 'POST', headers, body: formData });
  } catch (networkErr) {
    throw new Error(`Could not reach the backend at ${BASE_URL}. Is bankchain-backend running? (${networkErr.message})`);
  }

  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok || (body && body.success === false)) {
    throw new Error(body?.message || `Upload failed (HTTP ${res.status})`);
  }

  return body?.data?.key;
}

/* ============================== AUTH ============================== */
export function login(username, role, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, role, password }),
  });
}

export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

/* ============================ CUSTOMER ============================= */
// GET /customer/dashboard/{userId} -> totals + a real "pendingTransfers" list
export function getCustomerDashboard(userId) {
  return request(`/customer/dashboard/${userId}`);
}

// POST /customer/assets/issue -> mints on the (mocked) ledger, starts
// PENDING_CONFIRMATION until an RM confirms it in the Issuance Queue.
export function issueAsset(payload) {
  return request('/customer/assets/issue', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// GET /customer/assets/{userId} -> this customer's HOLDINGS (unitsHeld,
// totalUnits, valueShare) - not raw asset rows. An asset held by 3
// people shows up 3 times, once per holder, with each one's own amount.
export function getMyAssets(userId) {
  return request(`/customer/assets/${userId}`);
}

// GET /customer/assets/details/{assetId} -> the instrument + its full
// cap table (every holder and how much they each hold).
export function getAssetDetails(assetId) {
  return request(`/customer/assets/details/${assetId}`);
}

// GET /customer/transfers/{userId} -> every transfer this user is in,
// either side, any status. This is what "waiting on RM" is sourced from.
export function getMyTransfers(userId) {
  return request(`/customer/transfers/${userId}`);
}

// POST /customer/transfer -> sellerId is required now (the logged-in
// customer). Backend checks: asset ACTIVE (Rule 1), then requested
// units <= what the seller currently holds (Rule 4).
export function initiateTransfer(payload) {
  return request('/customer/transfer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function setInheritancePolicy(payload) {
  return request('/customer/inheritance', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export function getInheritancePolicy(assetId) {
  return request(`/customer/inheritance/${assetId}`);
}

export function submitRecovery(payload) {
  return request('/customer/recovery', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export function getRecoveryRequests(userId) {
  return request(`/customer/recovery/${userId}`);
}

export function submitKyc(payload) {
  return request('/customer/kyc', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export function getKyc(userId) {
  return request(`/customer/kyc/${userId}`);
}

/* ================================ RM ================================ */
// Queue 1: Asset Issuance Confirmations
export function getPendingConfirmationAssets() {
  return request('/rm/assets/pending-confirmation');
}
export function confirmAsset(id) {
  return request(`/rm/assets/${id}/confirm`, { method: 'POST' });
}
export function holdAsset(id, note) {
  return request(`/rm/assets/${id}/hold`, { method: 'POST', body: JSON.stringify({ note }) });
}
// Customer resubmits proof after being placed on hold
export function resubmitAssetProof(assetId, proofDocumentKey) {
  return request(`/customer/assets/${assetId}/resubmit`, {
    method: 'POST',
    body: JSON.stringify({ proofDocumentKey }),
  });
}

// Queue 2: Transfer Confirmations - flat items, buyer KYC status inline
export function getApprovalQueue() {
  return request('/rm/approval-queue');
}
export function approveTransfer(id) {
  return request(`/rm/transfer/${id}/approve`, { method: 'POST' });
}
export function rejectTransfer(id) {
  return request(`/rm/transfer/${id}/reject`, { method: 'POST' });
}
export function holdTransfer(id, note) {
  return request(`/rm/transfer/${id}/hold`, { method: 'POST', body: JSON.stringify({ note }) });
}

/* ========================== PROPERTY CLAIMS ========================== */
// Any inheritance-style claim on a tokenized asset - not exclusively
// "after death", though that's the common case. claimantUserId is
// always the logged-in user filing it, so an approved claim shows up
// straight in their own portal.
export function submitClaim(payload) {
  return request('/customer/claims', { method: 'POST', body: JSON.stringify(payload) });
}
export function getClaimsForAsset(assetId) {
  return request(`/customer/claims/asset/${assetId}`);
}
export function getMyClaims(userId) {
  return request(`/customer/claims/mine/${userId}`);
}
export function getAllClaims() {
  return request('/rm/claims');
}
export function approveClaim(id) {
  return request(`/rm/claims/${id}/approve`, { method: 'POST' });
}
export function rejectClaim(id) {
  return request(`/rm/claims/${id}/reject`, { method: 'POST' });
}
export function holdClaim(id, note) {
  return request(`/rm/claims/${id}/hold`, { method: 'POST', body: JSON.stringify({ note }) });
}

/* ============================ VALIDATION ============================ */
// Live proof/account-number validation (Rule 6) - call on blur as the
// user types a buyer proof, nominee ID, or claim proof value.
export function validateProof(proofValue) {
  return request('/customer/validate-proof', { method: 'POST', body: JSON.stringify({ proofValue }) });
}

/* ============================ RM LOOKUP ============================ */
// One box, any of: userId, username, assetId, or ledger token ID.
export function rmLookup(query) {
  return request(`/rm/lookup?query=${encodeURIComponent(query)}`);
}

// Oversight: every asset + full cap table
export function getAllAssets() {
  return request('/rm/assets');
}
export function freezeAsset(id) {
  return request(`/rm/assets/${id}/freeze`, { method: 'POST' });
}
export function unfreezeAsset(id) {
  return request(`/rm/assets/${id}/unfreeze`, { method: 'POST' });
}

// Queue 3: Recovery requests
export function getAllRecoveryRequests() {
  return request('/rm/recovery');
}
export function advanceRecovery(id, status) {
  return request(`/rm/recovery/${id}/advance?status=${encodeURIComponent(status)}`, {
    method: 'POST',
  });
}

export function getAuditTrail() {
  return request('/rm/audit-trail');
}

// Queue 4: KYC Approvals - a real list now, not lookup-by-id-only
export function getPendingKyc() {
  return request('/rm/kyc/pending');
}
export function approveKyc(userId) {
  return request(`/rm/kyc/${userId}/approve`, { method: 'POST' });
}

export function raiseDispute(assetId) {
  return request(`/rm/inheritance/${assetId}/dispute`, { method: 'POST' });
}

/* =============================== MOCK =============================== */
export function getLegalClaims() {
  return request('/mock/legal/claims');
}
export function getComplianceMonitoring() {
  return request('/mock/compliance/monitoring');
}

/* ======================== REQUESTS & NOTIFICATIONS ======================== */
export function getMyRequests(userId) {
  return request(`/customer/requests/${userId}`);
}
export function getMyNotifications(userId) {
  return request(`/customer/notifications/${userId}`);
}
export function markNotificationRead(id) {
  return request(`/customer/notifications/${id}/read`, { method: 'POST' });
}
export function markAssetPriority(id, priority) {
  return request(`/customer/assets/${id}/priority`, { method: 'POST', body: JSON.stringify({ priority }) });
}
export function markTransferPriority(id, priority) {
  return request(`/customer/transfer/${id}/priority`, { method: 'POST', body: JSON.stringify({ priority }) });
}
export function markClaimPriority(id, priority) {
  return request(`/customer/claims/${id}/priority`, { method: 'POST', body: JSON.stringify({ priority }) });
}

/* ============================ ASSISTANT ============================= */
// POST /assistant/chat -> Gemini-backed "Bank Chain Assistant". history is
// the prior turns in this session, oldest first: [{ sender: 'user'|'assistant', text }].
// Backend falls back to a static message if Gemini isn't configured/reachable.
export function askAssistant(role, message, history) {
  return request('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ role, message, history }),
  });
}
