package com.example.bankchain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PropertyClaimRequest {

    @NotNull
    private Long assetId;

    @NotNull
    private Long claimantUserId; // the logged-in user filing the claim

    @NotBlank
    private String claimantRelation; // SPOUSE, CHILD, PARENT, SIBLING, OTHER

    private String certificateProofBase64;
}
