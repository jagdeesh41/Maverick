package com.example.bankchain.dto;

import lombok.Data;

@Data
public class RuleCheckResponse {
    private boolean allowed;
    private String reason;
    private String action; // only present for the dispute rule ("FREEZE")
}
