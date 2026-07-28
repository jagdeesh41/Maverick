package com.example.bankchain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class IssueAssetRequest {

    @NotNull
    private Long ownerId;

    @NotBlank
    private String assetType;

    @NotNull @Positive
    private BigDecimal assetValue;

    @NotNull @Positive
    private Integer ownershipUnits;

    // 100 for fully-owned instruments; less than 100 if e.g. Real Estate
    // still has an outstanding mortgage. Frontend defaults/locks this per
    // asset type; backend just stores whatever is sent (defaults to 100).
    private Integer ownershipPercent;

    private String policyTemplate;

    private String nominee;

    // SELF, FAMILY, FRIEND, FAMILY_FRIEND, RELATIVE
    private String relationType;

    // base64 photo/document proving the asset's existence/ownership
    private String proofDocumentBase64;
}
