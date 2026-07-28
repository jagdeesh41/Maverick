package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One row in a user's unified "Raised Requests" view - every request
 * type (asset issuance, transfer, inheritance, claim, recovery, KYC)
 * flattened into the same shape so they can all be shown in one table.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestSummary {
    private String type;        // ASSET, TRANSFER, INHERITANCE, CLAIM, RECOVERY, KYC
    private Long id;
    private String description;
    private String status;      // PENDING, APPROVED, REJECTED, ON_HOLD, INFO
    private boolean priority;
    private LocalDateTime createdAt;
}
