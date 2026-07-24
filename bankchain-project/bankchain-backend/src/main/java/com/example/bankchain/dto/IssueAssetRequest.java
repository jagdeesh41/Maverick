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

    private String policyTemplate;

    private String nominee;
}
