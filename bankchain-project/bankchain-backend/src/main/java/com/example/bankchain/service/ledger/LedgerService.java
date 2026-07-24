package com.example.bankchain.service.ledger;

import java.math.BigDecimal;

/**
 * Contract that mirrors the Google Cloud Universal Ledger (GCUL) API surface:
 * mint / transfer / freeze / burn token lifecycle operations, exposed as a
 * single interface so a real GCUL adapter can be swapped in later without
 * touching any calling service.
 */
public interface LedgerService {

    /** Mints a new token representing a tokenised asset. Returns the ledger token id. */
    String mint(Long assetId, BigDecimal value, Integer units);

    /** Transfers units of a token to a buyer, simulating atomic DvP settlement. */
    void transfer(String tokenId, Integer units, String buyerCustomerId);

    /** Freezes a token (compliance hold, lien, dispute, recovery lockdown). */
    void freeze(String tokenId);

    /** Unfreezes a previously frozen token. */
    void unfreeze(String tokenId);

    /** Burns a token permanently (asset redeemed / matured / closed). */
    void burn(String tokenId);

    /** Returns the current on-ledger state of a token. */
    String getState(String tokenId);
}
