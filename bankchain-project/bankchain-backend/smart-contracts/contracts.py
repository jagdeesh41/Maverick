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
