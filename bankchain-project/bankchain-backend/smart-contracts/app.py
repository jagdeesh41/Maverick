"""
app.py

Tiny HTTP wrapper around contracts.py, so the Java backend can call
these Python smart contract rules the same way it will eventually call
the real GCUL smart contract execution API - one HTTP call in, one
allowed/reason decision out.

Run:
    pip install -r requirements.txt --break-system-packages
    python app.py

Runs on http://localhost:5000
"""

from flask import Flask, request, jsonify
import contracts

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "UP", "service": "smart-contract-engine"})


@app.route("/rules/check-transfer", methods=["POST"])
def check_transfer():
    body = request.get_json(force=True)
    result = contracts.check_transfer_allowed(body.get("assetStatus"))
    return jsonify(result)


@app.route("/rules/check-approval", methods=["POST"])
def check_approval():
    body = request.get_json(force=True)
    result = contracts.check_approval_allowed(body.get("kycStatus"))
    return jsonify(result)


@app.route("/rules/check-units", methods=["POST"])
def check_units():
    body = request.get_json(force=True)
    result = contracts.check_units_available(body.get("availableUnits"), body.get("requestedUnits"))
    return jsonify(result)


@app.route("/rules/validate-proof", methods=["POST"])
def validate_proof_route():
    body = request.get_json(force=True)
    result = contracts.validate_proof(body.get("proofValue"))
    return jsonify(result)


@app.route("/rules/death-claim", methods=["POST"])
def death_claim():
    body = request.get_json(force=True)
    result = contracts.evaluate_death_claim(body.get("claimantRelation"), bool(body.get("hasCertificate")))
    return jsonify(result)


@app.route("/rules/dispute", methods=["POST"])
def dispute():
    body = request.get_json(force=True)
    result = contracts.evaluate_dispute(body.get("assetId"), body.get("currentStatus"))
    return jsonify(result)


@app.route("/rules/issuance", methods=["POST"])
def issuance():
    body = request.get_json(force=True)
    result = contracts.evaluate_issuance(body.get("assetType"), body.get("ownershipPercent"), bool(body.get("hasProof")))
    return jsonify(result)


@app.route("/rules/recovery-advance", methods=["POST"])
def recovery_advance():
    body = request.get_json(force=True)
    result = contracts.evaluate_recovery_advance(
        bool(body.get("hasProof")), bool(body.get("hasPhone")), bool(body.get("hasEmail")))
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
