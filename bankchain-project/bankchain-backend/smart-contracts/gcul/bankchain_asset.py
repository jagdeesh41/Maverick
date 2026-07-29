"""
bankchain_asset.py

Real GCULpy programmable contract for BankChain Asset Fabric, written
against Google Cloud Universal Ledger's Private Preview language spec
(gculpyc compiler / GCULpy - a strict statically typed subset of Python).

This is the ledger-native counterpart to smart-contracts/contracts.py.
contracts.py's rule functions are pure business logic evaluated off-chain
by app.py; THIS file is the contract that actually gets compiled and
deployed to a Universal Ledger network, and it OWNS the state those
rules protect - not just the yes/no decision.

Deployment model: one BankChainAsset contract instance is deployed PER
issued asset, the same way the GCULpy ERC20Token reference sample is
deployed once per token symbol. The RM/back-office account that submits
the CreateContract transaction becomes the contract owner (ROLE_CONTRACT_
CREATOR) and is the only account that can mint, attest KYC, freeze/
unfreeze, burn, or approve a death claim. Customers only ever hold a
participant balance (ROLE_CONTRACT_PARTICIPANT).

Rule mapping to contracts.py:
    Rule 1 (check_transfer_allowed)  -> transfer(): status == "ACTIVE" check
    Rule 2 (check_approval_allowed)  -> set_kyc_status() + transfer() check
    Rule 3 (evaluate_dispute)        -> raise_dispute()
    Rule 4 (check_units_available)   -> transfer(): balance check
    Rule 5 (evaluate_death_claim)    -> approve_death_claim()
    Rule 7 (evaluate_issuance)       -> __init__()

Deliberately NOT on-ledger:
    Rule 6 (validate_proof) and Rule 8 (recovery-advance) are generic
    identity/back-office workflow checks (account number shape, contact
    details on file) with no token-custody meaning - they stay off-chain
    in contracts.py/app.py exactly as they are today.

Design note - trust boundary:
    kyc_approved and the death-claim relation check are gated behind
    `is_owner(gcul.sender)`, i.e. only the bank/RM account can attest
    them on-ledger. An earlier draft of this contract took approved/
    has_certificate as plain method arguments (mirroring contracts.py's
    signatures exactly) but that would let ANY participant assert their
    own KYC was approved - the contract must only trust ledger-resident
    state it wrote itself, never a caller-supplied claim about a fact
    the caller benefits from being true.

Open items to verify once full GCULpy docs/emulator access is available
(flagged rather than guessed, since this is a Pre-GA, actively-changing
language):
  - Whether str methods such as .upper()/.strip() are available. Not
    confirmed by the language reference supplied, so this contract
    assumes callers (the Java backend) submit already-normalised,
    upper-case values for asset_type / relation, and does NOT rely on
    str.upper() anywhere below.
  - Whether bool is accepted as a CreateContract/InvokeContractMethod
    argument value today (bool is listed as a supported core type, but
    the only worked transaction example in the reference uses str_value
    and int_value).

Compile:
    gculpyc --source_file bankchain_asset.py --output_file bankchain_asset.bin

Deploy / operate: see DEPLOY.md in this directory for the full
CreateContract -> GrantContractPermissions -> InvokeContractMethod
command sequence for this specific contract.
"""

import gcul


class BankChainAsset(gcul.Contract):
    """One tokenized BankChain asset. Deployed once per issuance."""

    asset_type: str
    ownership_percent: int
    total_units: int
    status: str          # "ACTIVE" | "FROZEN" | "BURNED"
    minted: bool

    balance: dict[gcul.Account, int]        # units held, per participant
    kyc_approved: dict[gcul.Account, bool]  # RM-attested buyer KYC, per participant
    last_action: str                        # most recent method invoked, for a quick-glance read

    # NOTE on dict entry initialization: per the reference, an account
    # field entry (e.g. balance[X]) does not exist until account X submits
    # a GrantContractPermissions transaction for this contract - at which
    # point ALL of the contract's account fields are populated with
    # default values (0 for int, False for bool) for that account. This
    # is NOT something this contract's code can control or defend with a
    # try/except (not supported by GCULpy) - it is purely an operational
    # precondition. DEPLOY.md sequences grant-permissions before mint and
    # before any transfer/set_kyc_status call for exactly this reason:
    # self.balance[gcul.sender] += ... below will fail the transaction if
    # gcul.sender has not yet granted permission.

    def __init__(self, asset_type: str, ownership_percent: int, total_units: int, has_proof: bool) -> None:
        """
        Rule 7 (issuance eligibility), enforced once at deploy time:
          - proof of ownership must have been attached
          - ownership % must be a real value between 1 and 100
          - "fully owned" instrument types must be exactly 100% owned
        asset_type is expected pre-normalised to upper case by the caller.
        """
        assert has_proof, "No proof document was attached at issuance"
        assert ownership_percent >= 1, "Ownership percent must be at least 1"
        assert ownership_percent <= 100, "Ownership percent must be at most 100"
        assert total_units >= 1, "Total units must be at least 1"

        requires_full_ownership = (
            asset_type == "FIXED DEPOSIT"
            or asset_type == "CORPORATE BOND"
            or asset_type == "EQUITY"
            or asset_type == "COMMODITY"
        )
        assert (not requires_full_ownership) or ownership_percent == 100, \
            "Fully-owned instrument types must be 100% owned"

        self.asset_type = asset_type
        self.ownership_percent = ownership_percent
        self.total_units = total_units
        self.status = "ACTIVE"
        self.minted = False
        self.last_action = "ISSUED"

    def mint(self, beneficiary: gcul.Account) -> None:
        """
        Owner-only, one-time credit of total_units to `beneficiary` -
        the customer who issued/owns this real-world asset, NOT
        necessarily the contract owner (the bank/RM). Contract ownership
        (who can freeze/burn/attest KYC/approve claims) and initial
        balance ownership (who actually holds the units) are
        deliberately different things: the bank stays the supervisory
        owner, the customer holds the balance. `beneficiary` must have
        already submitted a GrantContractPermissions transaction for
        themselves before this can succeed (see DEPLOY.md).
        """
        assert self.is_owner(gcul.sender), "Only the contract owner can mint"
        assert not self.minted, "Asset has already been minted"
        self.balance[beneficiary] += self.total_units
        self.minted = True
        self.last_action = "MINT"

    def set_kyc_status(self, participant: gcul.Account, approved: bool) -> None:
        """
        Rule 2: owner (RM/back-office) attests a participant's KYC state
        on-ledger after verifying it off-chain. transfer() trusts this
        stored value - never a caller-supplied argument - so a buyer can
        never claim their own KYC is approved.
        """
        assert self.is_owner(gcul.sender), "Only the contract owner can set KYC status"
        self.kyc_approved[participant] = approved
        self.last_action = "KYC_SET"

    def transfer(self, buyer: gcul.Account, units: int) -> int:
        """
        Rule 1: blocked while the asset is not ACTIVE (e.g. FROZEN).
        Rule 2: buyer must already be KYC-approved on this ledger.
        Rule 4: sender can never move more units than they hold - the
        balance dict itself is what makes this safe for partial
        transfers, the same way it does in the GCULpy ERC20 reference.
        """
        assert self.status == "ACTIVE", "Asset is not ACTIVE - transfer blocked"
        assert units >= 1, "Requested units must be greater than zero"
        assert units <= self.balance[gcul.sender], "Requested units exceed current holding"
        assert self.kyc_approved[buyer], "Buyer KYC is not approved"

        self.balance[gcul.sender] -= units
        self.balance[buyer] += units
        self.last_action = "TRANSFER"
        return units

    def freeze(self) -> None:
        """
        Owner-only compliance hold (lien, recovery lockdown, manual
        freeze). Only valid from ACTIVE - a BURNED asset is terminal and
        should never re-enter the active/frozen lifecycle.
        """
        assert self.is_owner(gcul.sender), "Only the contract owner can freeze"
        assert self.status == "ACTIVE", "Only an ACTIVE asset can be frozen"
        self.status = "FROZEN"
        self.last_action = "FREEZE"

    def raise_dispute(self) -> None:
        """
        Rule 3: raising an inheritance dispute always results in an
        automatic freeze, regardless of asset state or who raised it -
        deliberately no is_owner check here, any participant can trigger
        this precautionary hold. Unlike freeze(), this intentionally has
        no status guard: the original rule is "no matter what state the
        asset is in", including re-freezing an already-FROZEN asset.
        """
        self.status = "FROZEN"
        self.last_action = "DISPUTE_FREEZE"

    def unfreeze(self) -> None:
        """Owner-only: lift a freeze once compliance/legal review clears it."""
        assert self.is_owner(gcul.sender), "Only the contract owner can unfreeze"
        assert self.status == "FROZEN", "Asset is not currently FROZEN"
        self.status = "ACTIVE"
        self.last_action = "UNFREEZE"

    def burn(self) -> None:
        """
        Owner-only: permanently retire the asset (redeemed / matured /
        closed). Balances are deliberately left untouched - burn marks
        the asset's lifecycle state, it is not a balance-clearing
        operation, so historical holding amounts remain readable for
        audit after burn.
        """
        assert self.is_owner(gcul.sender), "Only the contract owner can burn"
        assert self.status != "BURNED", "Asset is already BURNED"
        self.status = "BURNED"
        self.last_action = "BURN"

    def approve_death_claim(self, deceased: gcul.Account, claimant: gcul.Account, relation: str) -> None:
        """
        Rule 5: owner-only - the RM attests that a death certificate and
        the claimant's relationship were verified off-chain. Only
        recognised blood relations are eligible; on approval the
        deceased holder's full balance moves to the claimant.
        relation is expected pre-normalised to upper case by the caller.

        Two guards go beyond the original off-chain contracts.py rule,
        deliberately, now that this method actually moves custody:
          - the asset must be ACTIVE (not FROZEN under an unresolved
            dispute, not already BURNED) before ownership can move.
          - the claimant must already be KYC-approved on this ledger,
            same bar as any other new holder via transfer(). Drop this
            line if your compliance process wants claims processed ahead
            of KYC.
        """
        assert self.is_owner(gcul.sender), "Only the contract owner can approve a death claim"
        assert self.status == "ACTIVE", "Asset is not ACTIVE - cannot process a claim while FROZEN or BURNED"
        assert self.kyc_approved[claimant], "Claimant KYC is not approved"
        is_blood_relation = (
            relation == "SPOUSE"
            or relation == "CHILD"
            or relation == "PARENT"
            or relation == "SIBLING"
        )
        assert is_blood_relation, "Claimant relation is not a recognised blood relation"

        moved_units = self.balance[deceased]
        self.balance[deceased] = 0
        self.balance[claimant] += moved_units
        self.last_action = "DEATH_CLAIM"
