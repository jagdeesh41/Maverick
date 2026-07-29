package com.example.bankchain.dto;

import lombok.Data;

/** Body for a customer resubmitting proof after being placed on hold. */
@Data
public class ResubmitProofRequest {
    private String proofDocumentKey;
}
