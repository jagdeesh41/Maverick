"""
test_contracts.py

Unit tests for the smart contract rules in contracts.py. These are the
same rules the deck calls "smart contracts as source of truth" - pure
functions, deterministic, no Flask/HTTP needed to exercise them.

Run:
    pip install -r requirements.txt -r requirements-dev.txt
    pytest
"""

import contracts


# ---- Rule 1: FROZEN assets can never be transferred ----

def test_transfer_blocked_when_frozen():
    result = contracts.check_transfer_allowed("FROZEN")
    assert result["allowed"] is False


def test_transfer_allowed_when_active():
    result = contracts.check_transfer_allowed("ACTIVE")
    assert result["allowed"] is True


def test_transfer_blocked_when_status_unknown():
    result = contracts.check_transfer_allowed(None)
    assert result["allowed"] is False


# ---- Rule 2: settlement requires APPROVED KYC ----

def test_approval_blocked_without_kyc():
    result = contracts.check_approval_allowed(None)
    assert result["allowed"] is False


def test_approval_blocked_when_pending():
    result = contracts.check_approval_allowed("PENDING")
    assert result["allowed"] is False


def test_approval_allowed_when_approved():
    result = contracts.check_approval_allowed("APPROVED")
    assert result["allowed"] is True


# ---- Rule 4: can't transfer more units than held ----

def test_units_blocked_when_over_available():
    result = contracts.check_units_available(100, 150)
    assert result["allowed"] is False


def test_units_blocked_when_zero_or_negative():
    result = contracts.check_units_available(100, 0)
    assert result["allowed"] is False


def test_units_allowed_for_partial_transfer():
    result = contracts.check_units_available(100, 20)
    assert result["allowed"] is True


def test_units_blocked_on_non_numeric_input():
    result = contracts.check_units_available("abc", 20)
    assert result["allowed"] is False


# ---- Rule 7: issuance eligibility depends on asset type + ownership % ----

def test_issuance_blocked_without_proof():
    result = contracts.evaluate_issuance("Real Estate", 60, False)
    assert result["allowed"] is False


def test_issuance_blocked_for_fully_owned_type_under_100_percent():
    result = contracts.evaluate_issuance("Fixed Deposit", 90, True)
    assert result["allowed"] is False


def test_issuance_allowed_for_fully_owned_type_at_100_percent():
    result = contracts.evaluate_issuance("Corporate Bond", 100, True)
    assert result["allowed"] is True


def test_issuance_allowed_for_partial_real_estate():
    result = contracts.evaluate_issuance("Real Estate", 60, True)
    assert result["allowed"] is True


def test_issuance_blocked_for_out_of_range_percent():
    result = contracts.evaluate_issuance("Real Estate", 150, True)
    assert result["allowed"] is False


# ---- Rule 6: proof/account-number validation ----

def test_proof_blocked_when_empty():
    result = contracts.validate_proof("")
    assert result["allowed"] is False


def test_proof_blocked_when_all_zeros():
    result = contracts.validate_proof("0000000")
    assert result["allowed"] is False


def test_proof_allowed_for_real_value():
    result = contracts.validate_proof("400123456789")
    assert result["allowed"] is True


# ---- Rule 5: death claims need a recognised blood relation + certificate ----

def test_death_claim_blocked_for_non_blood_relation():
    result = contracts.evaluate_death_claim("FRIEND", True)
    assert result["allowed"] is False


def test_death_claim_blocked_without_certificate():
    result = contracts.evaluate_death_claim("CHILD", False)
    assert result["allowed"] is False


def test_death_claim_allowed_for_blood_relation_with_certificate():
    result = contracts.evaluate_death_claim("SPOUSE", True)
    assert result["allowed"] is True


# ---- Rule 3: a dispute always triggers an auto-freeze ----

def test_dispute_always_returns_freeze_action():
    result = contracts.evaluate_dispute(42, "ACTIVE")
    assert result["allowed"] is True
    assert result["action"] == "FREEZE"


# ---- Rule 8: recovery can't advance without proof + phone + email ----

def test_recovery_advance_blocked_when_missing_everything():
    result = contracts.evaluate_recovery_advance(False, False, False)
    assert result["allowed"] is False


def test_recovery_advance_blocked_when_missing_phone_only():
    result = contracts.evaluate_recovery_advance(True, False, True)
    assert result["allowed"] is False


def test_recovery_advance_allowed_when_all_present():
    result = contracts.evaluate_recovery_advance(True, True, True)
    assert result["allowed"] is True
