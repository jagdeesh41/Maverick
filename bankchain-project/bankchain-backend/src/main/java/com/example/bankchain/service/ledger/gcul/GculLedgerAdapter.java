package com.example.bankchain.service.ledger.gcul;

import com.example.bankchain.exception.BusinessRuleException;
import com.example.bankchain.service.ledger.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Real Universal Ledger adapter - shells out to `ul-cli` (and `gcloud` for
 * account provisioning) via GculProcessRunner. Active only under the "gcul"
 * Spring profile; MockGCULAdapter (same package one level up) is the default
 * everywhere else. See smart-contracts/gcul/bankchain_asset.py for the
 * contract this drives and DEPLOY.md for every command sequence below,
 * confirmed against a real Universal Ledger network before being wired here.
 *
 * tokenId throughout is the contract's local ul-cli alias (e.g. "asset-123"),
 * not the raw "1:CTR:..." id - see DEPLOY.md's "Alias convention". Account
 * arguments are ledger account aliases (User.ledgerAccountAlias / the
 * configured operator aliases), resolved to real account IDs by ul-cli
 * itself via --arg_account_alias.
 */
@Service
@Profile("gcul")
@RequiredArgsConstructor
public class GculLedgerAdapter implements LedgerService {

    private static final String PERMISSION_STORAGE = "CONTRACT_PERMISSION_STORAGE";
    private static final Pattern STATUS_PATTERN = Pattern.compile("status: string_value:\"([A-Z_]+)\"");

    private final GculProcessRunner runner;

    @Value("${gcul.contract.owner-alias}")
    private String ownerAlias;

    @Value("${gcul.contract.bin-path}")
    private String contractBinPath;

    @Value("${gcul.account-manager.alias}")
    private String accountManagerAlias;

    @Value("${gcul.gcp.project-id}")
    private String gcpProjectId;

    @Value("${gcul.kms.keyring}")
    private String kmsKeyring;

    @Value("${gcul.kms.location:global}")
    private String kmsLocation;

    @Override
    public String issue(Long assetId, String assetType, Integer ownershipPercent, Integer totalUnits,
                         boolean hasProof, String issuerLedgerAlias) {
        String tokenId = "asset-" + assetId;

        requireSuccess(runner.runUlCli(
                "contracts", "create", contractBinPath,
                "--alias", tokenId,
                "--sender", ownerAlias,
                "--arg_string", "asset_type=" + assetType.toUpperCase(),
                "--arg_int64", "ownership_percent=" + ownershipPercent,
                "--arg_int64", "total_units=" + totalUnits,
                "--arg_bool", "has_proof=" + hasProof));

        requireSuccessOrAlreadyGranted(runner.runUlCli(
                "contracts", "grant", "--alias", tokenId,
                "--sender", issuerLedgerAlias,
                "--permissions", PERMISSION_STORAGE));

        requireSuccess(runner.runUlCli(
                "contracts", "invoke", "--alias", tokenId,
                "--method-name", "mint",
                "--sender", ownerAlias,
                "--arg_account_alias", "beneficiary=" + issuerLedgerAlias));

        return tokenId;
    }

    @Override
    public void setKycStatus(String tokenId, String participantLedgerAlias, boolean approved) {
        requireSuccessOrAlreadyGranted(runner.runUlCli(
                "contracts", "grant", "--alias", tokenId,
                "--sender", participantLedgerAlias,
                "--permissions", PERMISSION_STORAGE));

        requireSuccess(runner.runUlCli(
                "contracts", "invoke", "--alias", tokenId,
                "--method-name", "set_kyc_status",
                "--sender", ownerAlias,
                "--arg_account_alias", "participant=" + participantLedgerAlias,
                "--arg_bool", "approved=" + approved));
    }

    @Override
    public void transfer(String tokenId, String sellerLedgerAlias, String buyerLedgerAlias, Integer units) {
        requireSuccessOrAlreadyGranted(runner.runUlCli(
                "contracts", "grant", "--alias", tokenId,
                "--sender", buyerLedgerAlias,
                "--permissions", PERMISSION_STORAGE));

        requireSuccess(runner.runUlCli(
                "contracts", "invoke", "--alias", tokenId,
                "--method-name", "transfer",
                "--sender", sellerLedgerAlias,
                "--arg_account_alias", "buyer=" + buyerLedgerAlias,
                "--arg_int64", "units=" + units));
    }

    @Override
    public void freeze(String tokenId) {
        requireSuccess(runner.runUlCli(
                "contracts", "invoke", "--alias", tokenId,
                "--method-name", "freeze",
                "--sender", ownerAlias));
    }

    @Override
    public void unfreeze(String tokenId) {
        requireSuccess(runner.runUlCli(
                "contracts", "invoke", "--alias", tokenId,
                "--method-name", "unfreeze",
                "--sender", ownerAlias));
    }

    @Override
    public void burn(String tokenId) {
        requireSuccess(runner.runUlCli(
                "contracts", "invoke", "--alias", tokenId,
                "--method-name", "burn",
                "--sender", ownerAlias));
    }

    @Override
    public void raiseDispute(String tokenId) {
        // No owner check on-ledger by design (Rule 3: any participant, any
        // state) - signing as the bank operator is still valid, since the
        // contract never restricts this call, and the app doesn't currently
        // track which specific ledger account triggered a dispute.
        requireSuccess(runner.runUlCli(
                "contracts", "invoke", "--alias", tokenId,
                "--method-name", "raise_dispute",
                "--sender", ownerAlias));
    }

    @Override
    public void approveDeathClaim(String tokenId, String deceasedLedgerAlias, String claimantLedgerAlias, String relation) {
        requireSuccessOrAlreadyGranted(runner.runUlCli(
                "contracts", "grant", "--alias", tokenId,
                "--sender", claimantLedgerAlias,
                "--permissions", PERMISSION_STORAGE));

        requireSuccess(runner.runUlCli(
                "contracts", "invoke", "--alias", tokenId,
                "--method-name", "approve_death_claim",
                "--sender", ownerAlias,
                "--arg_account_alias", "deceased=" + deceasedLedgerAlias,
                "--arg_account_alias", "claimant=" + claimantLedgerAlias,
                "--arg_string", "relation=" + relation.toUpperCase()));
    }

    @Override
    public String getState(String tokenId) {
        GculCliResult result = runner.runUlCli("accounts", "describe", "--alias", tokenId);
        if (!result.success()) {
            throw new LedgerCommandException("Could not read ledger state for " + tokenId + ": " + result.extractReason());
        }
        Matcher matcher = STATUS_PATTERN.matcher(result.output());
        if (!matcher.find()) {
            throw new LedgerCommandException("Could not find status field in ledger output for " + tokenId + ":\n" + result.output());
        }
        return matcher.group(1);
    }

    @Override
    public String provisionAccount(String desiredAlias) {
        String keyName = desiredAlias + "-key";

        GculCliResult keyResult = runner.runGcloud(
                "kms", "keys", "create", keyName,
                "--project", gcpProjectId,
                "--keyring", kmsKeyring,
                "--location", kmsLocation,
                "--purpose", "asymmetric-signing",
                "--default-algorithm", "ec-sign-p256-sha256");
        // A retry after a partial failure (e.g. the ul-cli step below failing
        // on a first attempt) will find this key already created - reuse it
        // rather than erroring, same idempotency treatment as contracts grant.
        if (!keyResult.success() && !keyResult.output().contains("ALREADY_EXISTS")) {
            throw new LedgerCommandException("Failed to create KMS key for " + desiredAlias + ":\n" + keyResult.output());
        }

        // A freshly created Cloud KMS key always starts at version 1 - avoids
        // parsing `gcloud kms keys versions list`'s tabular output.
        String keyVersionName = "projects/" + gcpProjectId + "/locations/" + kmsLocation
                + "/keyRings/" + kmsKeyring + "/cryptoKeys/" + keyName + "/cryptoKeyVersions/1";

        GculCliResult accountResult = runner.runUlCli(
                "accounts", "create", "account",
                "--alias", desiredAlias,
                "--sender", accountManagerAlias,
                "--roles", "contract-participant",
                "--key-name", keyVersionName);
        // Same reasoning as the KMS key above: this account may already be
        // real on the ledger from a previous run even though Postgres (H2,
        // wiped on every restart) has forgotten User.ledgerAccountAlias and
        // is asking to provision it "again" for the same customer - reuse
        // the existing account rather than erroring, since it's genuinely
        // the same customer's identity, not a namespace collision between
        // two different things.
        if (!accountResult.success() && !accountResult.output().contains("already exists")) {
            throw new LedgerCommandException("Failed to create ledger account " + desiredAlias + ":\n" + accountResult.output());
        }

        return desiredAlias;
    }

    private void requireSuccess(GculCliResult result) {
        if (!result.success()) {
            throw new BusinessRuleException(result.extractReason());
        }
    }

    private void requireSuccessOrAlreadyGranted(GculCliResult result) {
        if (!result.success() && !result.alreadyGranted()) {
            throw new BusinessRuleException(result.extractReason());
        }
    }
}
