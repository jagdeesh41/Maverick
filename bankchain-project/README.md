# BankChain Asset Fabric — Full Project

Team Maverick, Problem Statement #24 (Digital Asset Tokenization). Two
folders, run separately, connected over HTTP:

```
bankchain-project/
  bankchain-backend/   <- unchanged from what you uploaded. Java/Spring
                           Boot + Postgres + Python smart contracts +
                           mocked GCUL ledger. See its own README.md.
  bankchain-frontend/  <- React (Vite), Lloyds-themed. See its own
                           README.md for a full, detailed walkthrough.
```

## Run order

```bash
# 1. Database (one-time)
psql -U postgres -c "CREATE DATABASE bankchain_db;"

# 2. Smart contract engine (Python)
cd bankchain-backend/smart-contracts
pip install -r requirements.txt --break-system-packages
python app.py                      # http://localhost:5000

# 3. Backend (Java) — new terminal
cd bankchain-backend
mvn clean package spring-boot:repackage
java -jar target/bankchain-backend-1.0-SNAPSHOT.jar   # http://localhost:8081

# 4. Frontend (React) — new terminal
cd bankchain-frontend
npm install
cp .env.example .env
npm run dev                         # http://localhost:5173
```

Open `http://localhost:5173`. Lloyds-style login → pick **Customer** or
**Relationship Manager** → **Continue** → on the accounts dashboard,
click **Open Digital Assets**. That drops you into the real,
backend-connected app, now with a persistent sidebar shell.

## What changed in this pass (judge-facing polish)

- **Layout:** top nav → left sidebar (`fabric-shell` in `theme.css`),
  so the real app reads as its own purpose-built platform rather than
  more Lloyds pages.
- **Naming:** kept "Digital Asset Fabric" everywhere — it's the same
  phrase used on the Lloyds banner ("Explore Digital Asset
  Tokenization"), so the story stays consistent from the marketing page
  through to the product name.
- **Eyebrow line:** "Permissioned · Programmable · Regulator-ready" —
  states the value prop in three words before a judge reads anything else.
- **Currency bug fixed:** `formatGBP()` (`src/format.js`) replaces every
  ad-hoc `£{Number(x).toLocaleString()}` call, which previously rendered
  differently depending on the demo machine's locale (was showing `₹`
  and lakh-grouping on at least one screenshot). Now always `£1,250,000`
  regardless of machine locale.
- **Endpoint debug text hidden by default:** the "Live from GET ..."
  explanations are now behind a collapsed "ⓘ How this works" toggle
  (`src/components/InfoNote.jsx`) on every screen — clean product view
  by default, technical proof one click away for judges who ask.

## What's real vs static

| Layer | Status |
|---|---|
| Lloyds login page (`/`) | Static UI, but **Continue** really calls `POST /auth/login` |
| Lloyds accounts dashboard (`/dashboard`) | Fully static. Only "Open Digital Assets" is live (route change) |
| Everything under `/digital-assets/*` | Fully real — every screen calls a real backend endpoint |
| Customer + RM flows in the backend | Fully built, real Postgres + real Python smart contract rules |
| GCUL (ledger) | Mocked via `MockGCULAdapter` — swap point documented in `bankchain-backend/README.md` |
| Legal / Compliance roles | Backend has mocked endpoints (`/mock/**`); not wired into this frontend's login, per scope |

For the line-by-line customer/RM flow tables and full API mapping, see
**`bankchain-frontend/README.md`**.
