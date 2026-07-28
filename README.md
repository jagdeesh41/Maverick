# BankChain Asset Fabric

Team Maverick · Problem Statement #24 (Digital Asset Tokenization)

Install → run → what every API does → what every frontend screen does → the smart contract rules → the ledger.

---

## Install (one-time)

* PostgreSQL, Python 3, Java 17 + Maven, and Node.js need to be on your machine
* Create the database: `psql -U postgres -c "CREATE DATABASE bankchain_db;"`
* Smart contracts: `cd bankchain-backend/smart-contracts && pip install -r requirements.txt --break-system-packages`
* Backend: `cd bankchain-backend && mvn clean package spring-boot:repackage`
* Frontend: `cd bankchain-frontend && npm install`

## Run (every time)

* Terminal 1: `cd bankchain-backend/smart-contracts && python app.py` → `localhost:5000`
* Terminal 2: `cd bankchain-backend && java -jar target/bankchain-backend-1.0-SNAPSHOT.jar` → `localhost:8081`
* Terminal 3: `cd bankchain-frontend && npm run dev` → `localhost:5173`
* Open `localhost:5173` → Lloyds login → pick **Customer** or **Relationship Manager** → **Continue** → click **Open Digital Assets**

Start Python before Java. If Python isn't up yet, Java falls back to evaluating the same rules itself, so nothing breaks.

---

## Full endpoint list — what each one does, in one line

**Login**

* `POST /auth/login` — pretend-login, no password, just picks a role

**Customer**

* `GET /customer/dashboard/{userId}` — summary: how many assets, total value
* `POST /customer/assets/issue` — create a new tokenized asset
* `GET /customer/assets/{userId}` — list my assets
* `GET /customer/assets/details/{assetId}` — details of one asset
* `POST /customer/transfer` — start sending an asset to someone
* `POST /customer/inheritance` — set who inherits this asset
* `POST /customer/recovery` — "I lost access, help me"
* `POST /customer/kyc` — submit ID documents for verification

**RM (Relationship Manager / Ops)**

* `GET /rm/approval-queue` — see pending transfers
* `POST /rm/transfer/{id}/approve` — approve a transfer (calls Rule 2)
* `POST /rm/transfer/{id}/reject` — reject it
* `POST /rm/assets/{id}/freeze` / `unfreeze` — lock/unlock an asset
* `POST /rm/kyc/{userId}/approve` — approve someone's identity check
* `POST /rm/inheritance/{assetId}/dispute` — raise a dispute (calls Rule 3)
* `GET /rm/audit-trail` — see every logged event, newest first

---

## Frontend — what each screen does

**Login page** — pick Customer or RM, hit Continue, real call to `POST /auth/login`

**Lloyds dashboard** — static, decorative. Only "Open Digital Assets" is live — it's the door into the real app

**Customer side**

* Dashboard — lands here first, shows total assets + portfolio value + compliance status
* Issue Asset — person fills a form and adds a new asset; this mints a token and saves it
* My Assets — every asset this person owns, click into any one for full detail
* Transfer / DvP — send an asset to someone else; goes through Rule 1 before it's even allowed to start
* Inheritance — customer sets who the asset passes down to (a nominee, or a primary/secondary split) if something happens to them — this is the "hand it down the hierarchy" step
* Recovery — "I lost access" request, tracked until an RM resolves it
* KYC — submit ID documents; has to be approved before this person can buy anything

**RM side**

* Approval Queue — every transfer waiting for sign-off, Approve or Reject in one click
* All Assets — oversight across every customer, Freeze / Raise Dispute from here
* KYC Approvals — look up a person, approve their documents
* Audit Trail — full history of everything that's happened, newest first

---

## Smart contract — 3 rules

Lives in `smart-contracts/contracts.py`. Java asks Python these 3 questions and obeys the answer — it doesn't decide on its own.

* **Rule 1 — can this asset move?** If it's frozen → no, blocked, no exceptions
* **Rule 2 — can this buyer receive it?** If their KYC isn't approved → no, blocked (this is the anti-money-laundering check)
* **Rule 3 — someone raised a dispute, what now?** Asset gets frozen automatically, immediately, no one has to click anything

Proof it's real: freeze an asset as RM, then try to transfer it as customer — the error you see is Rule 1's answer, word for word.

---

## GCUL — the ledger layer

GCUL (Google Cloud Universal Ledger) is the permissioned ledger this system is built to run on — where minting, transferring, freezing, and burning a tokenized asset are real operations on a shared record, not just a row in one bank's own database.

* Everything in the app talks to the ledger through one interface — `LedgerService.java` — never to a specific implementation directly
* That interface defines 5 operations: mint, transfer, freeze, unfreeze, getState
* Every one of those calls writes a real, timestamped row to the audit trail, regardless of what's behind the interface
* Right now the implementation behind that interface generates its own token IDs and tracks state internally, so the full asset lifecycle can be shown end-to-end without waiting on external ledger access
* Wiring up real GCUL access is one contained change: a new class implementing `LedgerService` that calls Google's real API, plus flipping one `@Primary` annotation to point at it
* Nothing else changes — no controller, no service, no smart contract call — because they were all written against the interface, not the implementation
