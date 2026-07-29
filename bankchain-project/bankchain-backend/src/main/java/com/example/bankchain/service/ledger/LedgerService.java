package com.example.bankchain.service.ledger;

/**
 * Contract that mirrors the real BankChainAsset GCULpy contract's method
 * surface (smart-contracts/gcul/bankchain_asset.py) - one contract instance
 * per issued asset, mint/transfer/freeze/burn/dispute/death-claim lifecycle,
 * exposed as a single interface so a real GCUL adapter can be swapped in
 * without touching any calling service.
 *
 * Account arguments are ledger account aliases (User.ledgerAccountAlias /
 * the bank's own operator alias), not raw customer IDs - see
 * UserService.ensureLedgerAccount for how a user gets one.
 */
public interface LedgerService {

    /**
     * Deploys a new contract for this asset (constructor enforces Rule 7 -
     * proof attached, ownership % 1-100, fully-owned types must be 100%),
     * grants the issuer's own storage permission, then mints the full unit
     * supply directly to the issuer. Returns the contract id to store as
     * Asset.ledgerTokenId.
     */
    String issue(Long assetId, String assetType, Integer ownershipPercent, Integer totalUnits,
                 boolean hasProof, String issuerLedgerAlias);

    /**
     * Grants ledger storage for the participant on this contract if not
     * already granted, then attests their KYC state (owner-only on-ledger -
     * the participant can never claim their own KYC is approved).
     */
    void setKycStatus(String tokenId, String participantLedgerAlias, boolean approved);

    /**
     * Grants ledger storage for the buyer on this contract if not already
     * granted, then moves units from seller to buyer. Seller must sign as
     * themselves (transfer debits gcul.sender); buyer must already be
     * KYC-approved on this contract (see setKycStatus).
     */
    void transfer(String tokenId, String sellerLedgerAlias, String buyerLedgerAlias, Integer units);

    /** Freezes a contract (compliance hold, lien, recovery lockdown) - owner-only. */
    void freeze(String tokenId);

    /** Unfreezes a previously frozen contract - owner-only. */
    void unfreeze(String tokenId);

    /** Burns a contract permanently (asset redeemed / matured / closed) - owner-only. */
    void burn(String tokenId);

    /**
     * Raises an inheritance dispute - always freezes, regardless of current
     * state or who called it (no owner check on-ledger, matches Rule 3).
     */
    void raiseDispute(String tokenId);

    /**
     * Owner-only: attests a death certificate + blood-relation check
     * verified off-chain, then moves the deceased holder's full balance to
     * the claimant. Single-claimant only - see PropertyClaimService for why
     * multi-claimant equal-split redistribution stays Postgres-only.
     */
    void approveDeathClaim(String tokenId, String deceasedLedgerAlias, String claimantLedgerAlias, String relation);

    /** Returns the current on-ledger status field of a contract ("ACTIVE"/"FROZEN"/"BURNED"). */
    String getState(String tokenId);

    /**
     * Provisions a brand-new ledger Account for a customer who doesn't have
     * one yet (Cloud KMS asymmetric-signing key + accounts create, granted
     * ROLE_CONTRACT_PARTICIPANT). Returns the ledger alias to store on
     * User.ledgerAccountAlias.
     */
    String provisionAccount(String desiredAlias);
}
