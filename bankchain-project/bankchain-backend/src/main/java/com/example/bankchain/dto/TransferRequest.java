package com.example.bankchain.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TransferRequest {

    @NotNull
    private Long sellerId;

    @NotNull
    private Long assetId;

    @NotNull
    private String buyerCustomerId;

    @NotNull
    private Integer units;

    private String settlementRail;

    // ID proof of the person receiving, kept for later verification
    private String transfereeProofBase64;

    private String buyerProofType;  // ACCOUNT_NUMBER or ID_NUMBER
    private String buyerProofValue;

    @jakarta.validation.constraints.AssertTrue(message = "You must confirm you willingly authorise this transfer.")
    private boolean consentGiven;
}
