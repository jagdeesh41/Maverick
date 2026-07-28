package com.example.bankchain.dto;

import lombok.Data;

/** Body for live proof/account-number validation (Rule 6), used as-you-type on the frontend. */
@Data
public class ProofCheckRequest {
    private String proofValue;
}
