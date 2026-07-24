package com.example.bankchain.controller;

import com.example.bankchain.dto.*;
import com.example.bankchain.entity.InheritancePolicy;
import com.example.bankchain.entity.RecoveryRequest;
import com.example.bankchain.entity.Transfer;
import com.example.bankchain.service.AssetService;
import com.example.bankchain.service.InheritanceService;
import com.example.bankchain.dto.KycRequest;
import com.example.bankchain.entity.Kyc;
import com.example.bankchain.service.KycService;
import com.example.bankchain.service.RecoveryService;
import com.example.bankchain.service.TransferService;
import com.example.bankchain.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final AssetService assetService;
    private final TransferService transferService;
    private final InheritanceService inheritanceService;
    private final RecoveryService recoveryService;
    private final UserService userService;
    private final KycService kycService;

    // ---- Dashboard ----
    @GetMapping("/dashboard/{userId}")
    public ApiResponse<DashboardResponse> dashboard(@PathVariable Long userId) {
        var user = userService.getUserOrThrow(userId);
        List<AssetResponse> assets = assetService.getAssetsForOwner(userId);

        BigDecimal portfolioValue = assets.stream()
                .map(AssetResponse::getAssetValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        DashboardResponse dashboard = DashboardResponse.builder()
                .customerName(user.getFullName())
                .totalAssets(assets.size())
                .portfolioValue(portfolioValue)
                .pendingApprovals(assets.stream().filter(a -> "PLEDGED".equals(a.getStatus())).count())
                .complianceStatus("Verified")
                .assets(assets)
                .build();

        return ApiResponse.ok(dashboard);
    }

    // ---- Issue Asset ----
    @PostMapping("/assets/issue")
    public ApiResponse<AssetResponse> issueAsset(@Valid @RequestBody IssueAssetRequest request) {
        return ApiResponse.ok("Token minted", assetService.issueAsset(request));
    }

    // ---- My Assets ----
    @GetMapping("/assets/{userId}")
    public ApiResponse<List<AssetResponse>> myAssets(@PathVariable Long userId) {
        return ApiResponse.ok(assetService.getAssetsForOwner(userId));
    }

    // ---- Asset Details ----
    @GetMapping("/assets/details/{assetId}")
    public ApiResponse<AssetResponse> assetDetails(@PathVariable Long assetId) {
        return ApiResponse.ok(assetService.getAssetDetails(assetId));
    }

    // ---- Transfer / DvP ----
    @PostMapping("/transfer")
    public ApiResponse<Transfer> initiateTransfer(@Valid @RequestBody TransferRequest request) {
        return ApiResponse.ok("DvP settlement initiated", transferService.initiateTransfer(request));
    }

    // ---- Inheritance ----
    @PostMapping("/inheritance")
    public ApiResponse<InheritancePolicy> setInheritance(@Valid @RequestBody InheritancePolicyRequest request) {
        return ApiResponse.ok("Inheritance policy updated", inheritanceService.setPolicy(request));
    }

    @GetMapping("/inheritance/{assetId}")
    public ApiResponse<InheritancePolicy> getInheritance(@PathVariable Long assetId) {
        return ApiResponse.ok(inheritanceService.getPolicyForAsset(assetId));
    }

    // ---- Recovery ----
    @PostMapping("/recovery")
    public ApiResponse<RecoveryRequest> submitRecovery(@Valid @RequestBody RecoveryRequestDto dto) {
        return ApiResponse.ok("Recovery request submitted", recoveryService.submitRequest(dto));
    }

    @GetMapping("/recovery/{userId}")
    public ApiResponse<List<RecoveryRequest>> getRecoveryRequests(@PathVariable Long userId) {
        return ApiResponse.ok(recoveryService.getRequestsForUser(userId));
    }

    // ---- KYC ----
    @PostMapping("/kyc")
    public ApiResponse<Kyc> submitKyc(@Valid @RequestBody KycRequest request) {
        return ApiResponse.ok("KYC submitted - pending approval", kycService.submit(request));
    }

    @GetMapping("/kyc/{userId}")
    public ApiResponse<Kyc> getKyc(@PathVariable Long userId) {
        return ApiResponse.ok(kycService.getForUser(userId));
    }
}
