# Deploying `bankchain_asset.py` to Universal Ledger

Command sequence for this specific contract, verified against the real
`gculpyc` / `ul-cli` in a Universal Ledger private preview Cloud Shell
session (`ltc-hack2026-team13`). Requires:

- An account with `ROLE_CONTRACT_CREATOR` for the RM/issuer (`contract-owner` below).
- An account with `ROLE_CONTRACT_PARTICIPANT` for the buyer/holder (`BUYER_ALIAS` below).

## Provisioning a customer ledger account

Confirmed end-to-end recipe for creating the ledger Account a customer
needs before they can hold `balance`/`kyc_approved` on any contract.
`ul-cli` has no key-generation command of its own (checked `ul-cli
config --help` - only manages `api`/`endpoint`/`project_id`/`region`),
so a Cloud KMS asymmetric-signing key is the real path:

```bash
gcloud kms keyrings create bankchain-ledger-keys --location=global   # once per project

gcloud kms keys create CUSTOMER_ALIAS-key \
    --keyring=bankchain-ledger-keys \
    --location=global \
    --purpose=asymmetric-signing \
    --default-algorithm=ec-sign-p256-sha256

gcloud kms keys versions list --key=CUSTOMER_ALIAS-key --keyring=bankchain-ledger-keys --location=global
# → note the version resource name, e.g. .../cryptoKeys/CUSTOMER_ALIAS-key/cryptoKeyVersions/1

ul-cli accounts create account \
    --alias CUSTOMER_ALIAS \
    --sender mavericks-account-manager \
    --roles contract-participant \
    --key-name "projects/ltc-hack2026-team13/locations/global/keyRings/bankchain-ledger-keys/cryptoKeys/CUSTOMER_ALIAS-key/cryptoKeyVersions/1"
```

Two things confirmed the hard way, worth knowing up front:
- `--key-name` needs the specific **CryptoKeyVersion** resource
  (`.../cryptoKeyVersions/1`), not the bare CryptoKey name - the bare
  name fails with `invalid key name`.
- `--sender` for `accounts create account` must be an **account
  manager** type account, not a regular user/contract-owner account -
  `contract-owner` itself fails with `sender type must be "account
  manager"`. This team's environment already has one provisioned and
  locally aliased as `mavericks-account-manager` (confirm with `ul-cli
  accounts list`) - `contract-owner`'s own `describe` output names the
  same account under its `Account manager:` field, which is how this
  was found.

This confirms the earlier open question in "Backend mapping" below:
customer ledger accounts do **not** exist yet and must be provisioned -
one KMS key + one `accounts create account` call per customer, likely
triggered at registration or first KYC submission.

## Alias convention

One contract per issued asset (see "Backend mapping" below) - use
`asset-<Asset.id>` as the contract alias, where `Asset.id` is the
Postgres primary key from `entity/Asset.java`. Example below uses
`asset-123` for an asset whose Postgres row has `id = 123`. This makes
the contract ID returned by `contracts create` trivial to store back
onto that same row (`Asset.ledgerTokenId`).

## 1. Compile

```bash
gculpyc --source_file bankchain_asset.py --output_file bankchain_asset.bin
```

Confirmed working - compiles clean with no errors against the current
`gculpyc:preview` image.

## 2. Deploy (issuance) - repeat per asset

Constructor args map to `__init__`: `asset_type: str, ownership_percent:
int, total_units: int, has_proof: bool`.

`ul-cli contracts create` takes **typed** argument flags (confirmed from
the real `--help` output): `--arg_string`, `--arg_int64`, `--arg_bool`,
`--arg_account_alias`, `--arg_contract_alias`, `--arg_amount`.

```bash
ul-cli contracts create bankchain_asset.bin \
    --alias asset-123 \
    --sender contract-owner \
    --arg_string asset_type="FIXED DEPOSIT" \
    --arg_int64 ownership_percent=100 \
    --arg_int64 total_units=1000 \
    --arg_bool has_proof=true
```

`contract-owner`'s account becomes the contract owner. The output line
`Contract created: 1:CTR:...` is the value to store in
`Asset.ledgerTokenId` for row 123.

## 3. Grant permissions

Both the owner and any participant must grant storage permission to the
contract **before** any method can write into their `balance` /
`kyc_approved` entries. The owner must do this before calling `mint`;
each buyer must do this before `set_kyc_status` or `transfer` can touch
their balance.

Real subcommand is `grant` (not `grant-permissions`), confirmed from
`ul-cli contracts grant --help`. The permission value
`CONTRACT_PERMISSION_STORAGE` comes straight from the language
reference's own raw-transaction example (`permissions:
CONTRACT_PERMISSION_STORAGE`), not a guess.

```bash
ul-cli contracts grant --alias asset-123 --sender contract-owner --permissions CONTRACT_PERMISSION_STORAGE
ul-cli contracts grant --alias asset-123 --sender BUYER_ALIAS --permissions CONTRACT_PERMISSION_STORAGE
```

## 4. Mint

`mint(beneficiary: gcul.Account)` - credits `total_units` to
`beneficiary`, the actual issuing customer, NOT necessarily
`contract-owner`. Contract ownership (bank/RM, can freeze/burn/attest
KYC/approve claims) and balance ownership (the customer) are
deliberately different accounts. The beneficiary must have already
`grant`-ed storage permission on this contract before mint can credit
them (same precondition as any other account-field write).

```bash
ul-cli contracts grant --alias asset-123 --sender ISSUER_ALIAS --permissions CONTRACT_PERMISSION_STORAGE
ul-cli contracts invoke --alias asset-123 --method-name mint --sender contract-owner --arg_account_alias beneficiary=ISSUER_ALIAS
```

Confirmed against a real deploy (`bankchain-v3`): `contract-owner` (the
bank/RM, unchanged as contract owner) signed the `mint` call, and
`test-customer-1` ended up with `balance: 1000` on that contract - the
bank mints, the customer holds.

## 5. Attest buyer KYC (owner-only)

`set_kyc_status(participant: gcul.Account, approved: bool)` - the
account-typed argument uses `--arg_account_alias key=LOCAL_ALIAS`, which
resolves a **locally registered CLI alias** to an account ID, not a raw
account ID string.

```bash
ul-cli contracts invoke --alias asset-123 --method-name set_kyc_status \
    --sender contract-owner \
    --arg_account_alias participant=BUYER_ALIAS \
    --arg_bool approved=true
```

## 6. Transfer

```bash
ul-cli contracts invoke --alias asset-123 --method-name transfer \
    --sender contract-owner \
    --arg_account_alias buyer=BUYER_ALIAS \
    --arg_int64 units=20
```

## 7. Read state

Contract-level fields (`asset_type`, `ownership_percent`, `total_units`,
`status`, `minted`, `last_action`) are on the contract's own account:

```bash
ul-cli accounts describe --alias asset-123
```

Per-participant fields (`balance`, `kyc_approved`) are a different
story: confirmed by a real run - a participant's `balance` for THIS
contract lives on **that participant's own ledger account**, not on the
contract's account. To read a buyer's balance, query the buyer's own
account and look for this contract's fields there:

```bash
ul-cli accounts describe --alias BUYER_ALIAS
```

Real confirmed output shape (from `ul-cli accounts describe --alias
contract-owner` after minting):

```
User account details:
  ...
  Account fields:
    Contract 1:CTR:002nJvsF1isAgea5iVUHHaZgvWsAnCwYaseZNniJkBkb5:
      balance: int64_value:1000
      kyc_approved: bool_value:false
```

i.e. account-field values are grouped under `Contract <contract-id>:`
on the participant's own account record. No `get_balance()`-style query
methods are defined on the contract on purpose: every public method
call is a signed `InvokeContractMethod` *transaction*
(consensus/finality cost), so a getter would be a strictly worse way to
read a value that `accounts describe` already returns for free.

## Other lifecycle calls

```bash
ul-cli contracts invoke --alias asset-123 --method-name freeze --sender contract-owner
ul-cli contracts invoke --alias asset-123 --method-name unfreeze --sender contract-owner
ul-cli contracts invoke --alias asset-123 --method-name burn --sender contract-owner
ul-cli contracts invoke --alias asset-123 --method-name raise_dispute --sender ANY_PARTICIPANT_ALIAS

ul-cli contracts invoke --alias asset-123 --method-name approve_death_claim \
    --sender contract-owner \
    --arg_account_alias deceased=HOLDER_ALIAS \
    --arg_account_alias claimant=CLAIMANT_ALIAS \
    --arg_string relation="CHILD"
```

`approve_death_claim` requires the asset to be `ACTIVE` and the
claimant to already be KYC-approved, so the claimant must first run
`contracts grant` and be KYC-attested (steps 3 and 5, with
`participant=CLAIMANT_ALIAS`) before this call will succeed.

## Backend mapping

How this contract's fields/calls line up with the existing Spring
backend, so wiring a real `GculLedgerAdapter` (replacing
`MockGCULAdapter`) is a matter of filling in these correspondences
rather than redesigning anything:

| Ledger side | Backend side | Notes |
|---|---|---|
| `contracts create` args (`asset_type`, `ownership_percent`, `total_units`, `has_proof`) | `IssueAssetRequest` fields `assetType`, `ownershipPercent`, `ownershipUnits`, `proofDocumentBase64 != null` | `assetType` must be upper-cased in Java first - the contract compares literal strings, `.upper()` in GCULpy is unconfirmed |
| Contract ID returned (`1:CTR:...`) | `Asset.ledgerTokenId` (`entity/Asset.java:58`) | Replaces the mock's fake `0x...` tx hash |
| `asset-<id>` alias | `Asset.id` (`entity/Asset.java:19`) | 1:1, see "Alias convention" above |
| `status` field (`ACTIVE`/`FROZEN`/`BURNED`) | `Asset.status` (`entity/Asset.java:51`, currently `PENDING_CONFIRMATION`/`ON_HOLD`/`ACTIVE`/`FROZEN`) | Value sets don't match exactly today - Postgres has extra pre-issuance states the ledger contract doesn't need to know about (issuance only happens once RM confirms, i.e. once the contract is even created) |
| `balance[account]` per participant | `AssetHolding` rows (`entity/AssetHolding.java`) - one row per `(asset, holder)` with `unitsHeld` | This is the part with a real gap - see below |
| `kyc_approved[account]` | `KycService` / `Kyc` entity's approval state | Today KYC lives entirely off-ledger in Postgres; `set_kyc_status` would need to be called whenever KYC flips to APPROVED |

**The gap that has to be closed first**: `entity/User.java` has no field
for a Universal Ledger account ID or alias at all - there is currently
no mapping from "which bank customer" to "which ledger account".
Before any of the above can be wired for real, `User` needs something
like `ledgerAccountAlias` (or ID), and a process for creating/registering
a Universal Ledger account per user (out of scope for this contract
file - it's an account-provisioning step, not a contract concern).

**No confirmed Java/gRPC client exists yet** for Universal Ledger in
this private preview - only `gculpyc` (compiler) and `ul-cli` (CLI) have
been shown working. So the concrete implementation path for a real
`GculLedgerAdapter implements LedgerService` today is to shell out to
`ul-cli` as a subprocess (`ProcessBuilder`, parsing stdout the way this
doc's examples show) rather than a native client call - revisit this if
Google ships a proper client library before you build it.

## Verified end-to-end

Full lifecycle proven against two separate real contract deployments
(`bankchain` and `bankchain-v2`) and two separate real accounts
(`contract-owner`, provisioned via Cloud KMS as `test-customer-1`):

- `create` → `grant` → `invoke mint` → `invoke set_kyc_status` →
  `invoke transfer` → `accounts describe`, every flag type the contract
  uses (`--arg_string`, `--arg_int64`, `--arg_bool`,
  `--arg_account_alias`) on both `create` and `invoke`.
- **Genuine two-account transfer + balance conservation**: after
  transferring 20 of 1000 units from `contract-owner` to a real second
  account, `contract-owner` reads `980` and `test-customer-1` reads
  `20` on that contract - both confirmed via `accounts describe` on
  each account.
- **`kyc_approved` is correctly scoped per contract instance, not
  global**: `test-customer-1` shows `kyc_approved: true` on both
  contracts it was attested on; `contract-owner` shows `true` on one
  contract and `false` on the other, exactly matching which contract
  `set_kyc_status` was actually called against.
- **Assert messages surface verbatim to the CLI caller.** Triggered for
  real by an accidental `burn` call on `bankchain` (unrelated stray
  command, not a bug) - the subsequent `transfer` attempt failed with
  `FAILED_PRECONDITION: Asset is not ACTIVE - transfer blocked`, which
  is the exact string from the `assert` in `transfer()`. Confirms
  `BusinessRuleException`-style reason strings can be surfaced to the
  frontend from a real ledger rejection, not just a generic failure.
- **`burn` is confirmed genuinely terminal** - a burned contract
  permanently rejects `transfer` (by design, via the `status == "ACTIVE"`
  guard), matching the docstring's stated intent.

`freeze` / `unfreeze` / `raise_dispute` / `approve_death_claim` haven't
been independently run, but use the exact same confirmed flag patterns
and the `assert`-message behavior above gives good confidence they'll
behave as written.
