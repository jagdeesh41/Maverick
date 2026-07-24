package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetResponse {
    private Long id;
    private String assetType;
    private BigDecimal assetValue;
    private Integer ownershipUnits;
    private String policyTemplate;
    private String nominee;
    private String status;
    private String ledgerTokenId;
    private String evidenceHash;
    private String ownerName;
    private LocalDateTime createdAt;
}
