package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetResponse {
    private Long id;
    private String assetType;
    private BigDecimal assetValue;
    private Integer ownershipUnits;
    private Integer ownershipPercent;
    private String policyTemplate;
    private String nominee;
    private String relationType;
    private String proofDocumentBase64;
    private String status;
    private String rmNote;
    private boolean priority;
    private String ledgerTokenId;
    private String evidenceHash;
    private String issuerName;
    private Long issuerId;
    private LocalDateTime createdAt;
    private List<HolderSummary> holders;
}
