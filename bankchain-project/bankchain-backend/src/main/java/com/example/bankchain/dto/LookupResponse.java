package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * One flexible bundle for the RM "look up everything" search - whatever
 * matched the query (a user, an asset, or both) comes back populated;
 * anything that didn't match stays null.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LookupResponse {
    private UserBundle user;
    private AssetResponse asset;
    private List<TransferQueueItemResponse> assetTransfers;
    private List<Object> assetClaims;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserBundle {
        private Long userId;
        private String username;
        private String fullName;
        private String role;
        private List<HoldingResponse> holdings;
        private List<TransferQueueItemResponse> transfers;
        private Object kyc;
        private List<Object> recoveryRequests;
        private List<Object> claimsFiled;
    }
}
