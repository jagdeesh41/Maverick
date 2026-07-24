package com.example.bankchain.controller;

import com.example.bankchain.dto.ApiResponse;
import com.example.bankchain.dto.AssetResponse;
import com.example.bankchain.entity.AuditEvent;
import com.example.bankchain.entity.InheritancePolicy;
import com.example.bankchain.entity.Kyc;
import com.example.bankchain.entity.RecoveryRequest;
import com.example.bankchain.entity.Transfer;
import com.example.bankchain.service.AssetService;
import com.example.bankchain.service.AuditService;
import com.example.bankchain.service.InheritanceService;
import com.example.bankchain.service.KycService;
import com.example.bankchain.service.RecoveryService;
import com.example.bankchain.service.TransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rm")
@RequiredArgsConstructor
public class RmController {

    private final AssetService assetService;
    private final TransferService transferService;
    private final AuditService auditService;
    private final RecoveryService recoveryService;
    private final KycService kycService;
    private final InheritanceService inheritanceService;

    // ---- Ops / Legal / Compliance: approval queue ----
    @GetMapping("/approval-queue")
    public ApiResponse<List<Transfer>> approvalQueue() {
        return ApiResponse.ok(transferService.getPendingTransfers());
    }

    @PostMapping("/transfer/{id}/approve")
    public ApiResponse<Transfer> approveTransfer(@PathVariable Long id) {
        return ApiResponse.ok("Transfer settled", transferService.approveTransfer(id));
    }

    @PostMapping("/transfer/{id}/reject")
    public ApiResponse<Transfer> rejectTransfer(@PathVariable Long id) {
        return ApiResponse.ok("Transfer rejected", transferService.rejectTransfer(id));
    }

    // ---- All assets across customers (RM oversight view) ----
    @GetMapping("/assets")
    public ApiResponse<List<AssetResponse>> allAssets() {
        return ApiResponse.ok(assetService.getAllAssets());
    }

    @PostMapping("/assets/{id}/freeze")
    public ApiResponse<Void> freezeAsset(@PathVariable Long id) {
        assetService.freezeAsset(id);
        return ApiResponse.ok("Asset frozen", null);
    }

    @PostMapping("/assets/{id}/unfreeze")
    public ApiResponse<Void> unfreezeAsset(@PathVariable Long id) {
        assetService.unfreezeAsset(id);
        return ApiResponse.ok("Asset unfrozen", null);
    }

    // ---- Recovery review ----
    @PostMapping("/recovery/{id}/advance")
    public ApiResponse<RecoveryRequest> advanceRecovery(@PathVariable Long id, @RequestParam String status) {
        return ApiResponse.ok(recoveryService.advanceStatus(id, status));
    }

    // ---- Audit Trail ----
    @GetMapping("/audit-trail")
    public ApiResponse<List<AuditEvent>> auditTrail() {
        return ApiResponse.ok(auditService.getAllEvents());
    }

    // ---- KYC approval (needed before a buyer can be approved in a transfer) ----
    @PostMapping("/kyc/{userId}/approve")
    public ApiResponse<Kyc> approveKyc(@PathVariable Long userId) {
        return ApiResponse.ok("KYC approved", kycService.approve(userId));
    }

    // ---- Inheritance dispute -> auto-freezes the asset (smart contract rule) ----
    @PostMapping("/inheritance/{assetId}/dispute")
    public ApiResponse<InheritancePolicy> raiseDispute(@PathVariable Long assetId) {
        return ApiResponse.ok("Dispute raised - asset auto-frozen", inheritanceService.raiseDispute(assetId));
    }
}
