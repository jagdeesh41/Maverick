package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private String customerName;
    private int totalAssets;
    private BigDecimal portfolioValue;
    private long pendingApprovals;
    private String complianceStatus;
    private List<AssetResponse> assets;
}
