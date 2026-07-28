package com.example.bankchain.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class InheritancePolicyRequest {

    @NotNull
    private Long assetId;

    // AFTER_DEATH, AFTER_AGE_70, AFTER_MATURITY
    private String triggerCondition;

    // As many nominees as needed - validated server-side to sum to <= 100%
    private List<NomineeDto> nominees;

    private String proofDocumentBase64;
    private String disputeAction;
}
