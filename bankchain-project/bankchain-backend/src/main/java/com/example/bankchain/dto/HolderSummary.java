package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** One line in an asset's cap table - who holds how much of it. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HolderSummary {
    private Long holderId;
    private String holderName;
    private Integer unitsHeld;
    private BigDecimal valueShare;
}
