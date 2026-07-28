"""
contracts.py

These functions ARE the smart contract rules for BankChain Asset Fabric.
Written in Python deliberately, because Google Cloud Universal Ledger
(GCUL) - the real ledger this project targets - executes Python-based
smart contracts. This file is what a real GCUL contract deployment
would contain; app.py just exposes it over HTTP so the Java backend
(standing in for the "Smart Contract Adapter" in the architecture
diagram) can call it the same way it would call GCUL's API.

Each function returns a dict: {"allowed": bool, "reason": str}
so the caller always gets a clear, auditable answer - never a silent
pass/fail. This mirrors a contract "revert" with a reason string.
"""


def check_transfer_allowed(asset_status: str) -> dict:
    """
    Rule 1: A FROZEN asset can never be transferred, no matter who is
    asking. This is enforced here, not in the calling application, so
    it can't be bypassed by any client.
    """
    if asset_status is None:
        return {"allowed": False, "reason": "Asset status unknown - cannot validate transfer."}

    if asset_status.upper() == "FROZEN":
        return {"allowed": False, "reason": "Asset is FROZEN. Transfers are blocked until it is unfrozen."}

    return {"allowed": True, "reason": "Asset is transferable."}


def check_approval_allowed(kyc_status: str) -> dict:
    """
    Rule 2: A transfer can only be approved (settled) if the buyer has
    an APPROVED KYC record. PENDING, REJECTED, or missing KYC all block
    settlement.
    """
    if kyc_status is None:
        return {"allowed": False, "reason": "Buyer has no KYC record on file. Submit and approve KYC first."}

    if kyc_status.upper() != "APPROVED":
        return {"allowed": False, "reason": f"Buyer KYC status is '{kyc_status}', not APPROVED."}

    return {"allowed": True, "reason": "Buyer KYC verified. Settlement may proceed."}


def check_units_available(available_units, requested_units) -> dict:
    """
    Rule 4: A holder can never transfer more units of an asset than they
    actually currently hold. This is what makes partial transfers safe -
    e.g. holding 100 units, sending 20 to a buyer, keeping 80 - the
    contract is what guarantees the 20 can't exceed what's really held.
    """
    try:
        available = int(available_units)
        requested = int(requested_units)
    except (TypeError, ValueError):
        return {"allowed": False, "reason": "Could not read holding/requested units."}

    if requested <= 0:
        return {"allowed": False, "reason": "Requested units must be greater than zero."}

    if requested > available:
        return {
            "allowed": False,
            "reason": f"You only hold {available} unit(s) of this asset - cannot transfer {requested}.",
        }

    return {"allowed": True, "reason": f"{requested} of {available} held unit(s) available to transfer."}


BLOOD_RELATIONS = {"SPOUSE", "CHILD", "PARENT", "SIBLING"}


FULLY_OWNED_TYPES = {"FIXED DEPOSIT", "CORPORATE BOND", "EQUITY", "COMMODITY"}


def evaluate_issuance(asset_type: str, ownership_percent, has_proof: bool) -> dict:
    """
    Rule 7: an asset can only be confirmed by RM if the smart contract
    says it's eligible - RM's Approve button doesn't decide this on its
    own, same as every other rule in the system:
      - proof of ownership must actually be attached
      - ownership % must be a real value between 1 and 100
      - "fully owned" instrument types (Fixed Deposit, Bond, Equity,
        Commodity) must be exactly 100% - partial ownership is only
        valid for types like Real Estate that genuinely support it
    """
    if not has_proof:
        return {"allowed": False, "reason": "No proof document was attached at issuance - cannot confirm without it."}

    try:
        percent = int(ownership_percent)
    except (TypeError, ValueError):
        return {"allowed": False, "reason": "Ownership % is missing or invalid."}

    if percent < 1 or percent > 100:
        return {"allowed": False, "reason": f"Ownership % ({percent}) must be between 1 and 100."}

    type_upper = (asset_type or "").strip().upper()
    if type_upper in FULLY_OWNED_TYPES and percent != 100:
        return {"allowed": False, "reason": f"{asset_type} must be 100% owned to be confirmed - got {percent}%."}

    return {"allowed": True, "reason": f"{asset_type} at {percent}% ownership with proof attached - eligible for confirmation."}


def validate_proof(proof_value: str) -> dict:
    """
    Rule 6: mock validation for any account number / ID number entered
    as proof (buyer identity on a transfer, nominee ID, claimant ID).
    A value made up entirely of zeros is treated as invalid - anything
    else passes. This stands in for a real KYC/account-lookup service.
    """
    value = (proof_value or "").strip()

    if not value:
        return {"allowed": False, "reason": "No proof value was entered."}

    digits_only = "".join(ch for ch in value if ch.isdigit())
    if digits_only and digits_only == "0" * len(digits_only):
        return {"allowed": False, "reason": f"'{value}' looks like an invalid number (all zeros). Please enter a valid account/ID number."}

    return {"allowed": True, "reason": f"'{value}' passed validation."}


def evaluate_death_claim(claimant_relation: str, has_certificate: bool) -> dict:
    """
    Rule 5: A death claim on a tokenized asset is only allowed through if
    the claimant is a recognised blood relation (spouse, child, parent,
    sibling - not "OTHER") AND a certificate/proof document was actually
    provided. Both conditions are required; either failing blocks the
    claim outright, before an RM ever has to look at it.
    """
    relation = (claimant_relation or "").upper()

    if relation not in BLOOD_RELATIONS:
        return {
            "allowed": False,
            "reason": f"Claimant relation '{claimant_relation}' is not a recognised blood relation "
                      f"(spouse, child, parent, sibling). Claim cannot proceed.",
        }

    if not has_certificate:
        return {
            "allowed": False,
            "reason": "No death certificate / relationship proof was provided. Claim cannot proceed.",
        }

    return {
        "allowed": True,
        "reason": f"Claimant relation '{relation}' verified as a blood relation with proof on file. "
                  f"Eligible for RM approval.",
    }


def evaluate_dispute(asset_id, current_status: str) -> dict:
    """
    Rule 3: Raising an inheritance dispute always results in an
    automatic freeze action, regardless of asset state, as a
    precautionary hold pending legal review. The contract *decides*
    the action here; the caller (Java backend) is responsible for
    actually applying it to the ledger/asset record.
    """
    return {
        "allowed": True,
        "action": "FREEZE",
        "reason": f"Dispute raised on asset #{asset_id} (was {current_status}). "
                  f"Auto-freezing pending legal/compliance review."
    }


FULLY_OWNED_TYPES = {"FIXED DEPOSIT", "CORPORATE BOND", "EQUITY", "COMMODITY"}


def evaluate_issuance(asset_type: str, ownership_percent, has_proof: bool) -> dict:
    """
    Rule 7: RM's issuance confirmation isn't a free judgment call - the
    contract decides eligibility first:
      - Fixed Deposit / Corporate Bond / Equity / Commodity must be
        exactly 100% owned - partial ownership on these is invalid.
      - Real Estate may be 1-100% owned (e.g. mortgage still outstanding).
      - A proof document must be attached regardless of type.
    RM can still only Approve if this returns allowed=True.
    """
    try:
        percent = int(ownership_percent)
    except (TypeError, ValueError):
        return {"allowed": False, "reason": "Ownership percent is missing or not a number."}

    type_key = (asset_type or "").strip().upper()

    if type_key in FULLY_OWNED_TYPES and percent != 100:
        return {
            "allowed": False,
            "reason": f"{asset_type} must be 100% owned at issuance - got {percent}%.",
        }

    if percent < 1 or percent > 100:
        return {"allowed": False, "reason": f"Ownership percent must be between 1 and 100 - got {percent}%."}

    if not has_proof:
        return {"allowed": False, "reason": "No proof document was attached to this asset. Cannot confirm issuance."}

    return {"allowed": True, "reason": f"{asset_type} at {percent}% ownership with proof on file - eligible for confirmation."}


def evaluate_recovery_advance(has_proof: bool, has_phone: bool, has_email: bool) -> dict:
    """
    Rule 8: An RM can't advance a recovery request past REQUESTED
    unless identity proof, a phone number, and an email are all on
    file - the contract enforces the minimum bar before any human
    judgment gets applied.
    """
    missing = []
    if not has_phone:
        missing.append("phone number")
    if not has_email:
        missing.append("email")
    if not has_proof:
        missing.append("identity proof document")

    if missing:
        return {"allowed": False, "reason": "Missing required info before this can advance: " + ", ".join(missing) + "."}

    return {"allowed": True, "reason": "Phone, email, and identity proof all on file - eligible to advance."}
