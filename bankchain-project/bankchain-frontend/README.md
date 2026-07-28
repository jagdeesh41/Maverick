# BankChain Asset Fabric — Frontend

A React (Vite) frontend with two layers, matching what you asked for:

1. **Static Lloyds Internet Banking chrome** — login page + accounts
   dashboard, styled to match the real Lloyds IB screens you shared.
   Nothing on these two pages talks to a backend except login
2. **The real app** ("Digital Assets") — fully wired to
   `bankchain-backend`. Every button, form, and table here calls a real
   endpoint. This is the part you can actually demo end-to-end

The single entry point from layer 1 into layer 2 is the **"Open Digital
Assets"** button / **"DIGITAL ASSETS"** nav item on the dashboard —
exactly like you highlighted in your screenshot.

**The backend was not touched.** This frontend only calls endpoints that
already exist in `bankchain-backend` as you uploaded it.

---

## 1. Run it

```bash
cd bankchain-frontend
npm install
cp .env.example .env      # only edit this if your backend isn't on localhost:8081
npm run dev
```

Opens on `http://localhost:5173`. Your backend (Postgres + Python smart
contracts + Spring Boot) needs to already be running per
`bankchain-backend/README.md` — this frontend doesn't start or replace
any of those three processes, it just calls the Java backend over HTTP.

## 2. Folder structure

```
bankchain-frontend/
  .env.example          <- the ONLY place the backend URL is set
  src/
    api.js              <- THE ONLY file that calls the backend. Every
                            function = one real endpoint. Read this file
                            top to bottom to see every API call the app
                            makes, in one place.
    theme.css            <- Lloyds colors (green header, orange "Digital
                            Assets" accent) pulled from your screenshots
    context/AuthContext.jsx  <- holds { userId, username, role } after login
    App.jsx              <- routing: / -> /dashboard -> /digital-assets/*
    pages/
      LoginPage.jsx        <- static Lloyds login, real POST /auth/login
      DashboardPage.jsx    <- static Lloyds accounts page, "Open Digital
                              Assets" button is the only live element
      digital-assets/
        DigitalAssetsApp.jsx  <- layout + role-based nav for the real app
        CustomerDashboard.jsx, MyAssets.jsx, AssetDetail.jsx,
        IssueAsset.jsx, Transfer.jsx, Inheritance.jsx, Recovery.jsx, Kyc.jsx
        ApprovalQueue.jsx, RmAssets.jsx, RmKycApprove.jsx, AuditTrail.jsx
```

## 3. How login decides what you see

`POST /auth/login` (mocked — any password, `UserService.login()` looks up
the username or auto-creates it with the role you picked) returns
`{ userId, username, fullName, role }`. That object is stored in
`AuthContext` for the tab's lifetime (no localStorage — refresh logs you
out, which is intentional since there's no real session). Every later API
call uses `user.userId` from that object; `user.role` decides whether
`DigitalAssetsApp` shows you the **Customer** nav or the **RM** nav.

Seeded logins that work immediately (from `DataSeeder.java`):
- Customer: `priyal`
- RM: `rm.admin`

Type any other username and role — the backend creates it on the spot.

## 4. Customer flow — what they should do, and what fires

| Step | Screen | Calls | What happens on the backend |
|---|---|---|---|
| 1 | Login, pick **Customer** | `POST /auth/login` | Resolves/creates the user |
| 2 | Dashboard → **Open Digital Assets** | *(navigation only)* | — |
| 3 | **Dashboard** (inside Digital Assets) | `GET /customer/dashboard/{userId}` | Aggregates asset count, portfolio value |
| 4 | **Issue Asset** | `POST /customer/assets/issue` | `AssetService.issueAsset()` → calls `LedgerService.mint()` (MockGCULAdapter fabricates a token ID) → saves to Postgres |
| 5 | **My Assets** / **Asset detail** | `GET /customer/assets/{userId}`, `GET /customer/assets/details/{assetId}` | Plain reads |
| 6 | **Transfer** | `POST /customer/transfer` | Calls Python **Rule 1** (`check_transfer_allowed`) — rejects if the asset is `FROZEN`. If allowed, creates a `Transfer` row (`status=LOCKED`) and calls `LedgerService.transfer()` (escrow lock, mocked) |
| 7 | **Inheritance** | `POST /customer/inheritance` | Saves nominee + allocation split |
| 8 | **Recovery** | `POST /customer/recovery` | "I lost access" request, starts at `REQUESTED` |
| 9 | **KYC** | `POST /customer/kyc` | Starts `PENDING` — must be `APPROVED` by an RM before this user can be a **buyer** in step 6 |

A transfer a customer initiates does **not** settle by itself — it sits
at `LOCKED` until an RM approves it (next section).

## 5. RM flow — what they should do, and what fires

| Step | Screen | Calls | What happens on the backend |
|---|---|---|---|
| 1 | Login, pick **Relationship Manager** | `POST /auth/login` | — |
| 2 | **Approval Queue** | `GET /rm/approval-queue` | Lists all `LOCKED` transfers |
| 3 | **Approve** | `POST /rm/transfer/{id}/approve` | Re-checks **Rule 1**, then checks **Rule 2** (`check_approval_allowed`) against the buyer's KYC status. Both must return `allowed: true` or it throws and the UI shows the exact reason string from `contracts.py`. On success: `status → SETTLED` |
| 4 | **Reject** | `POST /rm/transfer/{id}/reject` | `status → REJECTED`, no rule check |
| 5 | **All Assets** | `GET /rm/assets` | Oversight view, every customer's assets |
| 6 | **Freeze / Unfreeze** (asset detail) | `POST /rm/assets/{id}/freeze` / `/unfreeze` | Sets asset status, calls `LedgerService.freeze()`/`unfreeze()` — a frozen asset then fails Rule 1 on any transfer |
| 7 | **Raise dispute** | `POST /rm/inheritance/{assetId}/dispute` | Calls Python **Rule 3** (`evaluate_dispute`) — always returns `action: FREEZE`; Java then actually freezes the asset |
| 8 | **KYC Approvals** | `GET /customer/kyc/{userId}` then `POST /rm/kyc/{userId}/approve` | ⚠️ the backend has no "list all pending KYC" endpoint — this screen looks up one `userId` at a time. Get the userId from the buyer field in the Approval Queue, or ask the customer |
| 9 | **Audit Trail** | `GET /rm/audit-trail` | Every event above, newest first — including smart-contract fallback events if Python was down |

## 6. How the smart contract is wired in (frontend's view of it)

The frontend never talks to the Python service directly — only the Java
backend does, through `SmartContractClient.java`. From the frontend's
side, you just see the *result*: either the action succeeds, or `api.js`
throws an `Error` whose message is the exact `reason` string that
`contracts.py` returned (e.g. `"Asset is FROZEN. Transfers are blocked
until it is unfrozen."`). Every form in this app (`Transfer.jsx`,
`ApprovalQueue.jsx`, `RmAssets.jsx`) displays that message verbatim in a
red `lb-error-banner` — so a rejected transfer in the UI is proof the
Python rule engine, not the frontend, made that call.

## 7. GCUL (the ledger) — frontend's view of it

Same idea: the frontend calls `POST /customer/assets/issue`, `POST
/rm/assets/{id}/freeze`, etc., and the Java backend's `LedgerService` /
`MockGCULAdapter` decides what "ledger token ID" comes back. The asset
detail page shows that value as **"Ledger token ID (GCUL, mocked)"** so
it's clearly labeled as coming from the mock, not a real chain. Nothing
in this frontend needs to change when you wire up real GCUL later — the
backend's `LedgerService` interface is the only seam, and the frontend
only ever sees its return values (a token ID string), never how it was
produced.

You mentioned you now have real GCUL access — happy to go through that
in detail (backend `GculLedgerAdapter`, credentials, console) as its own
step whenever you're ready; didn't want to touch the backend as part of
this frontend build per your note.

## 8. Known limitations (by design, because the backend wasn't touched)

- **No KYC list endpoint** — RM approves KYC one `userId` at a time (see §5.8).
- **No list of all recovery requests for RM** — the backend only exposes
  `POST /rm/recovery/{id}/advance?status=...`; there's no screen for it
  in this build since there's no way to discover request IDs without a
  list endpoint. Say the word if you want this added to the backend.
- **Auth is mocked** — no passwords, no sessions, no route guards beyond
  "did you log in this tab."
- **Legal / Compliance roles** aren't in this frontend's login flow —
  the backend's `/mock/**` endpoints exist but only Customer and RM are
  wired up here, matching your ask.
