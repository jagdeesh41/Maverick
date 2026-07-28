package com.example.bankchain.service.ledger;

import com.example.bankchain.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ============================================================================
 *  MOCK — Google Cloud Universal Ledger (GCUL) adapter
 * ============================================================================
 *
 *  GCUL is a permissioned Layer-1 ledger, exposed to institutions through a
 *  single API, supporting a mint -> update -> transfer -> freeze -> burn
 *  token lifecycle with atomic settlement. Access is currently restricted
 *  (private testnet), so this class stands in for it end-to-end.
 *
 *  It implements the exact same contract (LedgerService) a real GCUL
 *  adapter would. THIS is the only class that needs to change when real
 *  GCUL access is available:
 *
 *    1. Rename this class (or add a new one) e.g. GculLedgerAdapter
 *    2. Replace the fakeTxHash()/in-memory Map logic below with real calls
 *       to the GCUL API (mint/transfer/freeze/burn endpoints + credentials)
 *    3. Move the @Primary annotation to the new class
 *    4. Nothing in AssetService / TransferService / InheritanceService
 *       changes AT ALL — they only ever talk to the LedgerService interface
 *
 *  Every call here still writes a real AuditEvent row, so the Audit Trail
 *  screen behaves identically whether the ledger is mocked or real.
 * ============================================================================
 */
@Service
@Primary
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
    public String mint(Long assetId, BigDecimal value, Integer units) {
        // MOCK GCUL CALL — replace with: gculClient.mint(assetId, value, units)
        String tokenId = fakeTxHash();
        tokenStates.put(tokenId, "MINTED");
        auditService.log("Asset issued", "Smart contract + ledger (MOCK GCUL)", "Recorded", "Tx: " + tokenId);
        return tokenId;
    }

    @Override
    public void transfer(String tokenId, Integer units, String buyerCustomerId) {
        // MOCK GCUL CALL — replace with: gculClient.transfer(tokenId, units, buyerCustomerId)
        tokenStates.put(tokenId, "TRANSFER_LOCKED");
        auditService.log("DvP transfer", "Settlement layer (MOCK GCUL)", "Pending", "Escrow lock active - Tx: " + tokenId);
    }

    @Override
    public void freeze(String tokenId) {
        // MOCK GCUL CALL — replace with: gculClient.freeze(tokenId)
        tokenStates.put(tokenId, "FROZEN");
        auditService.log("Asset frozen", "Smart contract + ledger (MOCK GCUL)", "Recorded", "Tx: " + tokenId);
    }

    @Override
    public void unfreeze(String tokenId) {
        // MOCK GCUL CALL — replace with: gculClient.unfreeze(tokenId)
        tokenStates.put(tokenId, "ACTIVE");
        auditService.log("Asset unfrozen", "Smart contract + ledger (MOCK GCUL)", "Recorded", "Tx: " + tokenId);
    }

    @Override
    public void burn(String tokenId) {
        // MOCK GCUL CALL — replace with: gculClient.burn(tokenId)
        tokenStates.put(tokenId, "BURNED");
        auditService.log("Asset burned", "Smart contract + ledger (MOCK GCUL)", "Recorded", "Tx: " + tokenId);
    }

    @Override
    public String getState(String tokenId) {
        // MOCK GCUL CALL — replace with: gculClient.getState(tokenId)
        return tokenStates.getOrDefault(tokenId, "UNKNOWN");
    }
}
