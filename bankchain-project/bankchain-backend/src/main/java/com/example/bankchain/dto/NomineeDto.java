package com.example.bankchain.dto;

import lombok.Data;

@Data
public class NomineeDto {
    private String name;
    private String relation; // SPOUSE, CHILD, PARENT, SIBLING, OTHER
    private Integer allocationPercent;
    private String proofType;  // ACCOUNT_NUMBER or ID_NUMBER
    private String proofValue;
}
