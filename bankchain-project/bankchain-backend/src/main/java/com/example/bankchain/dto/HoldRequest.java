package com.example.bankchain.dto;

import lombok.Data;

/** Body for RM "hold and ask for more documents" actions. */
@Data
public class HoldRequest {
    private String note;
}
