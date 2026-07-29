package com.example.bankchain.service.ledger;

import com.example.bankchain.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ============================================================================
 *  MOCK — Google Cloud Universal Ledger (GCUL) adapter
 * ============================================================================
 *
 *  Real GCUL access requires a private-preview environment (gculpyc + ul-cli
 *  + a Universal Ledger network, see smart-contracts/gcul/). This class
 *  stands in end-to-end for local dev / anyone without that environment set
 *  up. Active whenever the "gcul" Spring profile is NOT set - GculLedgerAdapter
 *  (same package) takes over when it is. Postgres (Asset/AssetHolding/Kyc)
 *  stays the source of truth in this mode; nothing here actually simulates
 *  balances or KYC per-contract the way the real ledger does.
 *
 *  Every call here still writes a real AuditEvent row, so the Audit Trail
 *  screen behaves identically whether the ledger is mocked or real.
 * ============================================================================
 */
@Service
@Profile("!gcul")
@RequiredArgsConstructor
public class MockGCULAdapter implements LedgerService {

    private final AuditService auditService;

    // tokenId -> state (in-memory ledger simulation - replace with real GCUL state lookups)
    private final Map<String, String> tokenStates = new ConcurrentHashMap<>();

    private String fakeTxHash() {
        // MOCK: a real GCUL mint/transfer call would return an actual on-ledger tx hash here
        return "0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    @Override
    public String issue(Long assetId, String assetType, Integer ownershipPercent, Integer totalUnits,
                         boolean hasProof, String issuerLedgerAlias) {
        String tokenId = fakeTxHash();
        tokenStates.put(tokenId, "ACTIVE");
        auditService.log("Asset issued", "Smart contract + ledger (MOCK GCUL)", "Recorded",
                "Tx: " + tokenId + " - minted to " + issuerLedgerAlias);
        return tokenId;
    }

    @Override
    public void setKycStatus(String tokenId, String participantLedgerAlias, boolean approved) {
        auditService.log("KYC attested on-ledger", "Smart contract + ledger (MOCK GCUL)", "Recorded",
                "Tx: " + tokenId + " - " + participantLedgerAlias + " -> " + approved);
    }

    @Override
    public void transfer(String tokenId, String sellerLedgerAlias, String buyerLedgerAlias, Integer units) {
        auditService.log("DvP transfer", "Settlement layer (MOCK GCUL)", "Recorded",
                "Tx: " + tokenId + " - " + units + " unit(s) " + sellerLedgerAlias + " -> " + buyerLedgerAlias);
    }

    @Override
    public void freeze(String tokenId) {
        tokenStates.put(tokenId, "FROZEN");
        auditService.log("Asset frozen", "Smart contract + ledger (MOCK GCUL)", "Recorded", "Tx: " + tokenId);
    }

    @Override
    public void unfreeze(String tokenId) {
        tokenStates.put(tokenId, "ACTIVE");
        auditService.log("Asset unfrozen", "Smart contract + ledger (MOCK GCUL)", "Recorded", "Tx: " + tokenId);
    }

    @Override
    public void burn(String tokenId) {
        tokenStates.put(tokenId, "BURNED");
        auditService.log("Asset burned", "Smart contract + ledger (MOCK GCUL)", "Recorded", "Tx: " + tokenId);
    }

    @Override
    public void raiseDispute(String tokenId) {
        tokenStates.put(tokenId, "FROZEN");
        auditService.log("Dispute raised - auto-freeze", "Smart contract + ledger (MOCK GCUL)", "Recorded", "Tx: " + tokenId);
    }

    @Override
    public void approveDeathClaim(String tokenId, String deceasedLedgerAlias, String claimantLedgerAlias, String relation) {
        auditService.log("Death claim approved on-ledger", "Smart contract + ledger (MOCK GCUL)", "Recorded",
                "Tx: " + tokenId + " - " + deceasedLedgerAlias + " -> " + claimantLedgerAlias + " (" + relation + ")");
    }

    @Override
    public String getState(String tokenId) {
        return tokenStates.getOrDefault(tokenId, "UNKNOWN");
    }

    @Override
    public String provisionAccount(String desiredAlias) {
        auditService.log("Ledger account provisioned (MOCK)", "Smart contract + ledger (MOCK GCUL)", "Recorded",
                "Alias: " + desiredAlias);
        return desiredAlias;
    }
}
