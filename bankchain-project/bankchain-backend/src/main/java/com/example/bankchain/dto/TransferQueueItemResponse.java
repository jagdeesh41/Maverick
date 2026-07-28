package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A transfer, flattened with everything an RM (or the customer's own
 * dashboard) needs to see at a glance without extra lookups - including
 * the buyer's KYC status inline, so RM doesn't have to jump screens
 * mid-approval.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferQueueItemResponse {
    private Long id;
    private Long assetId;
    private String assetType;
    private Long sellerId;
    private String sellerName;
    private String buyerUsername;
    private String buyerKycStatus; // null if buyer has no KYC record at all yet
    private Integer units;
    private String status;
    private String rmNote;
    private boolean priority;
    private String contractHash;
    private LocalDateTime createdAt;
}
