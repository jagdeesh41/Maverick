package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoldingResponse {
    private Long assetId;
    private String assetType;
    private Integer unitsHeld;
    private Integer totalUnits;
    private Integer ownershipPercent;
    private BigDecimal valueShare;
    private String status;
    private String rmNote;
    private String ledgerTokenId;
    private String nominee;
    private String policyTemplate;
}
