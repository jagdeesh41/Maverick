# BankChain Asset Fabric — Backend + Smart Contracts

Backend for the Digital Asset Tokenization prototype (Team Maverick,
Problem Statement #24). Spring Boot + PostgreSQL backend, a real Python
smart-contract engine, and a mocked Google Cloud Universal Ledger (GCUL)
adapter standing in for the real blockchain layer until testnet access
is available.

### The three pieces, and how they connect

```
 Customer / RM (Swagger, or your frontend UI)
        │
        ▼
 Spring Boot backend  (Java)
   - entities, validation, orchestration
   - AssetService / TransferService / InheritanceService
        │
        │  HTTP call for every rule decision
        ▼
 Smart Contract Engine  (Python, smart-contracts/app.py)
   - contracts.py = the actual rules
   - returns {"allowed": true/false, "reason": "..."}
        │
        │  (Java also calls this for token lifecycle ops)
        ▼
 Ledger Adapter  (MockGCULAdapter.java)
   - mint / transfer / freeze / unfreeze / burn
   - MOCKED — clearly marked, one class to swap for real GCUL later
```

This mirrors the reference architecture exactly: **Orchestration &
Business Services → Smart Contract Adapter → Blockchain & Tokenization
Layer**. We didn't skip the smart contract layer to save time — we
separated it into its own Python service on purpose, because **GCUL
executes Python-based smart contracts**, so this is what a real
deployment would look like, not just a simulation of one.

## Why Python for the rules, and why that matters for judging

Anyone can put an `if` statement in a Java service and call it a "smart
contract." We didn't do that. The 3 business rules below live in
`smart-contracts/contracts.py` as standalone, independently-callable,
independently-testable functions — the same shape GCUL expects a real
contract to be in. The Java backend never makes these decisions itself;
it asks the contract engine and obeys the answer, with a reason string
logged to the immutable audit trail every single time. That's the
difference between "we wrote validation logic" and "we wrote a
contract layer" — and it's the difference a judge evaluating a
blockchain-themed submission will actually notice.

## The 3 smart contract rules (live in `contracts.py`)

| Rule | What it stops | Where it's enforced |
|---|---|---|
| 1 | Transferring a `FROZEN` asset | `check_transfer_allowed()` |
| 2 | Settling a transfer for a buyer with no `APPROVED` KYC | `check_approval_allowed()` |
| 3 | An inheritance dispute not automatically freezing the asset | `evaluate_dispute()` |

If the Python engine isn't running, `SmartContractClient.java` falls
back to evaluating the same rules locally and logs that it did — so a
demo never hard-fails just because one process isn't up, but the
audit trail still shows exactly which path made the decision.

## Run it (3 things, in order)

**1. Database** (one-time):
```sql
CREATE DATABASE bankchain_db;
```

**2. Smart contract engine** (Python):
```bash
cd smart-contracts
pip install -r requirements.txt --break-system-packages
python app.py
```
Runs on `http://localhost:5000`. Check it's up: `http://localhost:5000/health`

**3. Backend** (Java):
```bash
mvn clean package spring-boot:repackage
java -jar target/bankchain-backend-1.0-SNAPSHOT.jar
```
Runs on `http://localhost:8081`. Swagger: `http://localhost:8081/swagger-ui.html`

Start the Python service **before** the Java one for the cleanest
first-run logs, but it's not required — the fallback handles either order.

## Connecting the real GCUL later

Everything routes through `LedgerService` (interface) and
`MockGCULAdapter` (its only implementation, marked `@Primary`). To go
live:
1. Add a new class implementing `LedgerService` (e.g. `GculLedgerAdapter`) using real GCUL credentials/API calls
2. Move `@Primary` to it
3. Nothing else in the codebase changes — no controller, service, or DTO touches `LedgerService` implementation details directly

## Seed data

On first run, `DataSeeder` creates 4 users and 1 demo asset:
- `priyal` (CUSTOMER), `rm.admin` (RM), `legal.exec` (LEGAL, mocked), `compliance.audit` (COMPLIANCE, mocked)
- 1 Fixed Deposit asset owned by `priyal`

## Key endpoints

**Auth** — `POST /auth/login` — `{ "username": "priyal", "role": "CUSTOMER" }`

**Customer** (`/customer/**`) — dashboard, issue asset, my assets, asset
details, transfer, inheritance, recovery, KYC submit

**RM** (`/rm/**`) — approval queue, approve/reject transfer, freeze/unfreeze,
KYC approve, raise inheritance dispute, audit trail

**Mocked** (`/mock/**`) — Legal/Executor and Compliance/Audit static views
(kept mocked intentionally — see conversation notes; can be built out later
without touching the architecture)

## What's built vs mocked (full picture)

| Area | Status |
|---|---|
| Customer + RM flows | Fully built |
| Smart contract rules | Fully built, real Python service |
| Legal/Executor, Compliance/Audit | Mocked — same architecture extends to them directly |
| Authentication | Mocked — `/auth/login` resolves/creates a user by username+role, no password |
| GCUL (ledger) | Mocked via `MockGCULAdapter` — swap point clearly marked, see above |
