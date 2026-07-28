package com.example.bankchain.controller;

import com.example.bankchain.dto.*;
import com.example.bankchain.entity.AuditEvent;
import com.example.bankchain.entity.PropertyClaim;
import com.example.bankchain.entity.InheritancePolicy;
import com.example.bankchain.entity.Kyc;
import com.example.bankchain.entity.RecoveryRequest;
import com.example.bankchain.entity.Transfer;
import com.example.bankchain.service.AssetService;
import com.example.bankchain.service.AuditService;
import com.example.bankchain.service.PropertyClaimService;
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
    private final PropertyClaimService propertyClaimService;
    private final com.example.bankchain.repository.UserRepository userRepository;
    private final com.example.bankchain.repository.AssetRepository assetRepository;

    // ---- Section 1: Asset Issuance Confirmations ----
    @GetMapping("/assets/pending-confirmation")
    public ApiResponse<List<AssetResponse>> pendingConfirmation() {
        return ApiResponse.ok(assetService.getPendingConfirmationAssets());
    }

    @PostMapping("/assets/{id}/confirm")
    public ApiResponse<AssetResponse> confirmAsset(@PathVariable Long id) {
        return ApiResponse.ok("Asset confirmed - now ACTIVE", assetService.confirmAsset(id));
    }

    @PostMapping("/assets/{id}/hold")
    public ApiResponse<AssetResponse> holdAsset(@PathVariable Long id, @RequestBody HoldRequest request) {
        return ApiResponse.ok("Asset put on hold - customer will see your note", assetService.holdAsset(id, request.getNote()));
    }

    // ---- Transfer Confirmations ----
    @GetMapping("/approval-queue")
    public ApiResponse<List<TransferQueueItemResponse>> approvalQueue() {
        return ApiResponse.ok(transferService.getApprovalQueue());
    }

    @PostMapping("/transfer/{id}/approve")
    public ApiResponse<Transfer> approveTransfer(@PathVariable Long id) {
        return ApiResponse.ok("Transfer settled", transferService.approveTransfer(id));
    }

    @PostMapping("/transfer/{id}/reject")
    public ApiResponse<Transfer> rejectTransfer(@PathVariable Long id) {
        return ApiResponse.ok("Transfer rejected", transferService.rejectTransfer(id));
    }

    @PostMapping("/transfer/{id}/hold")
    public ApiResponse<Transfer> holdTransfer(@PathVariable Long id, @RequestBody HoldRequest request) {
        return ApiResponse.ok("Transfer held for reverification", transferService.holdTransfer(id, request.getNote()));
    }

    // ---- Oversight ----
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

    // ---- Universal lookup - user ID, username, asset ID, or token ID, all in one box ----
    @GetMapping("/lookup")
    public ApiResponse<LookupResponse> lookup(@RequestParam String query) {
        String q = query.trim();
        LookupResponse.LookupResponseBuilder response = LookupResponse.builder();

        com.example.bankchain.entity.User matchedUser = null;
        try {
            matchedUser = userRepository.findById(Long.parseLong(q)).orElse(null);
        } catch (NumberFormatException ignored) { /* not numeric, fall through to username lookup */ }
        if (matchedUser == null) {
            matchedUser = userRepository.findByUsername(q).orElse(null);
        }

        if (matchedUser != null) {
            final com.example.bankchain.entity.User u = matchedUser;
            com.example.bankchain.entity.Kyc kyc = null;
            try {
                kyc = kycService.getForUser(u.getId());
            } catch (Exception ignored) { /* no KYC record yet */ }

            response.user(LookupResponse.UserBundle.builder()
                    .userId(u.getId())
                    .username(u.getUsername())
                    .fullName(u.getFullName())
                    .role(u.getRole().name())
                    .holdings(assetService.getHoldingsForUser(u.getId()))
                    .transfers(transferService.getTransfersForUser(u))
                    .kyc(kyc)
                    .recoveryRequests(new java.util.ArrayList<>(recoveryService.getRequestsForUser(u.getId())))
                    .claimsFiled(new java.util.ArrayList<>(propertyClaimService.getForClaimant(u.getId())))
                    .build());
        }

        com.example.bankchain.entity.Asset matchedAsset = null;
        try {
            matchedAsset = assetRepository.findById(Long.parseLong(q)).orElse(null);
        } catch (NumberFormatException ignored) { /* not numeric */ }
        if (matchedAsset == null) {
            matchedAsset = assetRepository.findByLedgerTokenId(q).orElse(null);
        }

        if (matchedAsset != null) {
            response.asset(assetService.getAssetDetails(matchedAsset.getId()));
            response.assetTransfers(transferService.getTransfersForAsset(matchedAsset.getId()));
            response.assetClaims(new java.util.ArrayList<>(propertyClaimService.getForAsset(matchedAsset.getId())));
        }

        return ApiResponse.ok(response.build());
    }

    // ---- Section 2: property claims (any inheritance-style claim, not just after death) ----
    @GetMapping("/claims")
    public ApiResponse<List<PropertyClaim>> allClaims() {
        return ApiResponse.ok(propertyClaimService.getAll());
    }

    @PostMapping("/claims/{id}/approve")
    public ApiResponse<PropertyClaim> approveClaim(@PathVariable Long id) {
        return ApiResponse.ok("Claim approved", propertyClaimService.approve(id));
    }

    @PostMapping("/claims/{id}/reject")
    public ApiResponse<PropertyClaim> rejectClaim(@PathVariable Long id) {
        return ApiResponse.ok("Claim rejected", propertyClaimService.reject(id));
    }

    @PostMapping("/claims/{id}/hold")
    public ApiResponse<PropertyClaim> holdClaim(@PathVariable Long id, @RequestBody HoldRequest request) {
        return ApiResponse.ok("Claim held for more documents", propertyClaimService.hold(id, request.getNote()));
    }

    // ---- Recovery requests ----
    @GetMapping("/recovery")
    public ApiResponse<List<RecoveryRequest>> allRecoveryRequests() {
        return ApiResponse.ok(recoveryService.getAll());
    }

    @PostMapping("/recovery/{id}/advance")
    public ApiResponse<RecoveryRequest> advanceRecovery(@PathVariable Long id, @RequestParam String status) {
        return ApiResponse.ok(recoveryService.advanceStatus(id, status));
    }

    // ---- Audit Trail ----
    @GetMapping("/audit-trail")
    public ApiResponse<List<AuditEvent>> auditTrail() {
        return ApiResponse.ok(auditService.getAllEvents());
    }

    // ---- KYC Approvals ----
    @GetMapping("/kyc/pending")
    public ApiResponse<List<KycQueueItemResponse>> pendingKyc() {
        return ApiResponse.ok(kycService.getPending());
    }

    @PostMapping("/kyc/{userId}/approve")
    public ApiResponse<Kyc> approveKyc(@PathVariable Long userId) {
        return ApiResponse.ok("KYC approved", kycService.approve(userId));
    }

    // ---- Inheritance dispute ----
    @PostMapping("/inheritance/{assetId}/dispute")
    public ApiResponse<InheritancePolicy> raiseDispute(@PathVariable Long assetId) {
        return ApiResponse.ok("Dispute raised - asset auto-frozen", inheritanceService.raiseDispute(assetId));
    }
}
