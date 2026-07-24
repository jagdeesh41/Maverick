package com.example.bankchain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class TransferRequest {

    @NotNull
    private Long assetId;

    @NotBlank
    private String buyerCustomerId;

    @NotNull @Positive
    private Integer units;

    private String settlementRail; // "Tokenised deposit rail"
}
