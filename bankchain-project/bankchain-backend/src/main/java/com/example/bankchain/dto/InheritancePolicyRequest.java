package com.example.bankchain.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InheritancePolicyRequest {

    @NotNull
    private Long assetId;

    private String primaryNominee;
    private Integer primaryAllocation;

    private String secondaryNominee;
    private Integer secondaryAllocation;

    private String triggerCondition;
    private String disputeAction;
}
