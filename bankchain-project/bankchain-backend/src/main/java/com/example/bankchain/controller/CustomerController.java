package com.example.bankchain.controller;

import com.example.bankchain.dto.*;
import com.example.bankchain.entity.PropertyClaim;
import com.example.bankchain.entity.InheritancePolicy;
import com.example.bankchain.entity.RecoveryRequest;
import com.example.bankchain.entity.Transfer;
import com.example.bankchain.entity.User;
import com.example.bankchain.service.AssetService;
import com.example.bankchain.service.PropertyClaimService;
import com.example.bankchain.service.InheritanceService;
import com.example.bankchain.entity.Kyc;
import com.example.bankchain.service.KycService;
import com.example.bankchain.service.NotificationService;
import com.example.bankchain.service.RecoveryService;
import com.example.bankchain.service.SmartContractClient;
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
    private final PropertyClaimService propertyClaimService;
    private final SmartContractClient smartContractClient;
    private final NotificationService notificationService;
    private final com.example.bankchain.repository.AssetRepository assetRepository;
    private final com.example.bankchain.repository.InheritancePolicyRepository inheritancePolicyRepository;

    @GetMapping("/dashboard/{userId}")
    public ApiResponse<DashboardResponse> dashboard(@PathVariable Long userId) {
        User user = userService.getUserOrThrow(userId);
        List<HoldingResponse> holdings = assetService.getHoldingsForUser(userId);
        List<TransferQueueItemResponse> myTransfers = transferService.getTransfersForUser(user);

        BigDecimal portfolioValue = holdings.stream()
                .map(HoldingResponse::getValueShare)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<TransferQueueItemResponse> pending = myTransfers.stream()
                .filter(t -> "LOCKED".equals(t.getStatus()) || "ON_HOLD".equals(t.getStatus()))
                .toList();

        DashboardResponse dashboard = DashboardResponse.builder()
                .customerName(user.getFullName())
                .totalAssets(holdings.size())
                .portfolioValue(portfolioValue)
                .pendingApprovals(pending.size())
                .complianceStatus("Verified")
                .assets(holdings)
                .pendingTransfers(pending)
                .build();

        return ApiResponse.ok(dashboard);
    }

    @PostMapping("/assets/issue")
    public ApiResponse<AssetResponse> issueAsset(@Valid @RequestBody IssueAssetRequest request) {
        return ApiResponse.ok("Token minted - awaiting RM confirmation", assetService.issueAsset(request));
    }

    /** Customer responds to an RM hold by resubmitting proof - goes back into the issuance queue. */
    @PostMapping("/assets/{id}/resubmit")
    public ApiResponse<AssetResponse> resubmitProof(@PathVariable Long id, @RequestBody ResubmitProofRequest request) {
        return ApiResponse.ok("Proof resubmitted - back in RM's issuance queue", assetService.resubmitProof(id, request.getProofDocumentKey()));
    }

    @GetMapping("/assets/{userId}")
    public ApiResponse<List<HoldingResponse>> myAssets(@PathVariable Long userId) {
        return ApiResponse.ok(assetService.getHoldingsForUser(userId));
    }

    @GetMapping("/assets/details/{assetId}")
    public ApiResponse<AssetResponse> assetDetails(@PathVariable Long assetId) {
        return ApiResponse.ok(assetService.getAssetDetails(assetId));
    }

    @GetMapping("/transfers/{userId}")
    public ApiResponse<List<TransferQueueItemResponse>> myTransfers(@PathVariable Long userId) {
        User user = userService.getUserOrThrow(userId);
        return ApiResponse.ok(transferService.getTransfersForUser(user));
    }

    @PostMapping("/transfer")
    public ApiResponse<Transfer> initiateTransfer(@Valid @RequestBody TransferRequest request) {
        return ApiResponse.ok("DvP settlement initiated - awaiting RM approval", transferService.initiateTransfer(request));
    }

    @PostMapping("/inheritance")
    public ApiResponse<InheritancePolicy> setInheritance(@Valid @RequestBody InheritancePolicyRequest request) {
        return ApiResponse.ok("Inheritance policy updated", inheritanceService.setPolicy(request));
    }

    @GetMapping("/inheritance/{assetId}")
    public ApiResponse<InheritancePolicy> getInheritance(@PathVariable Long assetId) {
        return ApiResponse.ok(inheritanceService.getPolicyForAsset(assetId));
    }

    @PostMapping("/recovery")
    public ApiResponse<RecoveryRequest> submitRecovery(@Valid @RequestBody RecoveryRequestDto dto) {
        return ApiResponse.ok("Recovery request submitted", recoveryService.submitRequest(dto));
    }

    @GetMapping("/recovery/{userId}")
    public ApiResponse<List<RecoveryRequest>> getRecoveryRequests(@PathVariable Long userId) {
        return ApiResponse.ok(recoveryService.getRequestsForUser(userId));
    }

    @PostMapping("/kyc")
    public ApiResponse<Kyc> submitKyc(@Valid @RequestBody KycRequest request) {
        return ApiResponse.ok("KYC submitted - pending approval", kycService.submit(request));
    }

    @GetMapping("/kyc/{userId}")
    public ApiResponse<Kyc> getKyc(@PathVariable Long userId) {
        return ApiResponse.ok(kycService.getForUser(userId));
    }

    /** Someone claiming an asset they believe they're entitled to - RM reviews it. */
    @PostMapping("/claims")
    public ApiResponse<PropertyClaim> submitClaim(@Valid @RequestBody PropertyClaimRequest request) {
        return ApiResponse.ok("Claim submitted - awaiting RM review", propertyClaimService.submitClaim(request));
    }

    @GetMapping("/claims/asset/{assetId}")
    public ApiResponse<List<PropertyClaim>> getClaimsForAsset(@PathVariable Long assetId) {
        return ApiResponse.ok(propertyClaimService.getForAsset(assetId));
    }

    /** Every claim this user has personally filed - so an approved claim shows up on THEIR dashboard. */
    @GetMapping("/claims/mine/{userId}")
    public ApiResponse<List<PropertyClaim>> getMyClaims(@PathVariable Long userId) {
        return ApiResponse.ok(propertyClaimService.getForClaimant(userId));
    }

    /** Live validation for any proof/account-number field (Rule 6) - called on blur as the user types. */
    @PostMapping("/validate-proof")
    public ApiResponse<RuleCheckResponse> validateProof(@RequestBody ProofCheckRequest request) {
        return ApiResponse.ok(smartContractClient.validateProof(request.getProofValue()));
    }

    // ---- Unified "Raised Requests" view - every request type, one place ----
    @GetMapping("/requests/{userId}")
    public ApiResponse<List<RequestSummary>> myRequests(@PathVariable Long userId) {
        List<RequestSummary> out = new java.util.ArrayList<>();

        for (com.example.bankchain.entity.Asset a : assetRepository.findByIssuerId(userId)) {
            out.add(RequestSummary.builder().type("ASSET").id(a.getId())
                    .description(a.getAssetType() + " #" + a.getId() + " - £" + a.getAssetValue())
                    .status(a.getStatus()).priority(a.isPriority()).createdAt(a.getCreatedAt()).build());

            inheritancePolicyRepository.findByAssetId(a.getId()).ifPresent(p ->
                    out.add(RequestSummary.builder().type("INHERITANCE").id(p.getId())
                            .description("Inheritance policy on asset #" + a.getId() + " (" + p.getNominees().size() + " nominee(s))")
                            .status(p.getStatus()).priority(false).createdAt(a.getCreatedAt()).build()));
        }

        User user = userService.getUserOrThrow(userId);
        for (TransferQueueItemResponse t : transferService.getTransfersForUser(user)) {
            if (t.getSellerId().equals(userId)) {
                out.add(RequestSummary.builder().type("TRANSFER").id(t.getId())
                        .description("Transfer #" + t.getId() + " - " + t.getUnits() + " unit(s) of asset #" + t.getAssetId() + " to " + t.getBuyerUsername())
                        .status(t.getStatus()).priority(t.isPriority()).createdAt(t.getCreatedAt()).build());
            }
        }

        for (com.example.bankchain.entity.PropertyClaim c : propertyClaimService.getForClaimant(userId)) {
            out.add(RequestSummary.builder().type("CLAIM").id(c.getId())
                    .description("Claim on asset #" + c.getAsset().getId() + " (" + c.getClaimantRelation() + ")")
                    .status(c.getStatus()).priority(c.isPriority()).createdAt(c.getCreatedAt()).build());
        }

        for (com.example.bankchain.entity.RecoveryRequest r : recoveryService.getRequestsForUser(userId)) {
            out.add(RequestSummary.builder().type("RECOVERY").id(r.getId())
                    .description("Recovery request - " + r.getRecoveryReason())
                    .status(r.getStatus()).priority(false).createdAt(r.getCreatedAt()).build());
        }

        try {
            Kyc kyc = kycService.getForUser(userId);
            out.add(RequestSummary.builder().type("KYC").id(kyc.getId())
                    .description(kyc.getDocumentType() + " — " + kyc.getDocumentNumber())
                    .status(kyc.getStatus()).priority(false).createdAt(null).build());
        } catch (Exception ignored) { /* no KYC record yet */ }

        out.sort((a, b) -> {
            if (a.getCreatedAt() == null) return 1;
            if (b.getCreatedAt() == null) return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });
        return ApiResponse.ok(out);
    }

    // ---- Notifications - "Recent Updates" panel on the dashboard ----
    @GetMapping("/notifications/{userId}")
    public ApiResponse<List<com.example.bankchain.entity.Notification>> myNotifications(@PathVariable Long userId) {
        return ApiResponse.ok(notificationService.getForUser(userId));
    }

    @PostMapping("/notifications/{id}/read")
    public ApiResponse<Void> markNotificationRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ApiResponse.ok("Marked read", null);
    }

    // ---- Priority flags - "I need this looked at first" ----
    @PostMapping("/assets/{id}/priority")
    public ApiResponse<AssetResponse> markAssetPriority(@PathVariable Long id, @RequestBody PriorityRequest request) {
        return ApiResponse.ok(assetService.markPriority(id, request.isPriority()));
    }

    @PostMapping("/transfer/{id}/priority")
    public ApiResponse<Transfer> markTransferPriority(@PathVariable Long id, @RequestBody PriorityRequest request) {
        return ApiResponse.ok(transferService.markPriority(id, request.isPriority()));
    }

    @PostMapping("/claims/{id}/priority")
    public ApiResponse<com.example.bankchain.entity.PropertyClaim> markClaimPriority(@PathVariable Long id, @RequestBody PriorityRequest request) {
        return ApiResponse.ok(propertyClaimService.markPriority(id, request.isPriority()));
    }
}
