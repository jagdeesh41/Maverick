package com.example.bankchain.service;

import com.example.bankchain.dto.AssetResponse;
import com.example.bankchain.dto.HolderSummary;
import com.example.bankchain.dto.HoldingResponse;
import com.example.bankchain.dto.IssueAssetRequest;
import com.example.bankchain.dto.RuleCheckResponse;
import com.example.bankchain.entity.Asset;
import com.example.bankchain.entity.AssetHolding;
import com.example.bankchain.entity.User;
import com.example.bankchain.exception.BusinessRuleException;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.AssetHoldingRepository;
import com.example.bankchain.repository.AssetRepository;
import com.example.bankchain.service.ledger.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final AssetHoldingRepository holdingRepository;
    private final UserService userService;
    private final LedgerService ledgerService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final SmartContractClient smartContractClient;

    public AssetResponse issueAsset(IssueAssetRequest request) {
        User issuer = userService.getUserOrThrow(request.getOwnerId());

        Asset asset = Asset.builder()
                .issuer(issuer)
                .assetType(request.getAssetType())
                .assetValue(request.getAssetValue())
                .ownershipUnits(request.getOwnershipUnits())
                .ownershipPercent(request.getOwnershipPercent() != null ? request.getOwnershipPercent() : 100)
                .policyTemplate(request.getPolicyTemplate())
                .nominee(request.getNominee())
                .relationType(request.getRelationType())
                .proofDocumentBase64(request.getProofDocumentBase64())
                .status("PENDING_CONFIRMATION")
                .evidenceHash("Qm" + UUID.randomUUID().toString().replace("-", "").substring(0, 8))
                .build();

        String tokenId = ledgerService.mint(null, request.getAssetValue(), request.getOwnershipUnits());
        asset.setLedgerTokenId(tokenId);

        Asset saved = assetRepository.save(asset);

        holdingRepository.save(AssetHolding.builder()
                .asset(saved)
                .holder(issuer)
                .unitsHeld(request.getOwnershipUnits())
                .build());

        auditService.log("Asset issuance requested", "Smart contract + ledger", "Pending",
                "Asset #" + saved.getId() + " awaiting RM confirmation");
        notificationService.notify(issuer, "Your " + saved.getAssetType() + " (asset #" + saved.getId() + ") was submitted and is awaiting RM confirmation.",
                "ASSET", saved.getId(), "PENDING");

        return toAssetResponse(saved);
    }
h
    public AssetResponse confirmAsset(Long assetId) {
        Asset asset = getAssetOrThrow(assetId);
        if (!"PENDING_CONFIRMATION".equals(asset.getStatus()) && !"ON_HOLD".equals(asset.getStatus())) {
            throw new BusinessRuleException("Asset #" + assetId + " is not awaiting confirmation (status: " + asset.getStatus() + ").");
        }

        boolean hasProof = asset.getProofDocumentBase64() != null && !asset.getProofDocumentBase64().isBlank();
        RuleCheckResponse decision = smartContractClient.evaluateIssuance(asset.getAssetType(), asset.getOwnershipPercent(), hasProof);
        if (!decision.isAllowed()) {
            auditService.log("Asset issuance confirmation rejected", "Smart contract (Python)", "Blocked", decision.getReason());
            throw new BusinessRuleException(decision.getReason());
        }

        asset.setStatus("ACTIVE");
        asset.setRmNote(null);
        Asset saved = assetRepository.save(asset);
        auditService.log("Asset issuance confirmed", "Smart contract (Python)", "Success", decision.getReason());
        notificationService.notify(asset.getIssuer(), "Your " + asset.getAssetType() + " (asset #" + assetId + ") was approved and is now ACTIVE.",
                "ASSET", assetId, "APPROVED");
        return toAssetResponse(saved);
    }

    /** RM holds an issuance and asks the customer for more documents/proof. */
    public AssetResponse holdAsset(Long assetId, String note) {
        Asset asset = getAssetOrThrow(assetId);
        asset.setStatus("ON_HOLD");
        asset.setRmNote(note != null && !note.isBlank() ? note : "RM has requested more documentation for this asset.");
        Asset saved = assetRepository.save(asset);
        auditService.log("Asset issuance held", "RM review", "On hold", "Asset #" + assetId + " - " + asset.getRmNote());
        notificationService.notify(asset.getIssuer(), "Your " + asset.getAssetType() + " (asset #" + assetId + ") needs more documents: " + asset.getRmNote(),
                "ASSET", assetId, "ON_HOLD");
        return toAssetResponse(saved);
    }

    /** Customer flags their own pending request as urgent - RM queues surface these first. */
    public AssetResponse markPriority(Long assetId, boolean priority) {
        Asset asset = getAssetOrThrow(assetId);
        asset.setPriority(priority);
        return toAssetResponse(assetRepository.save(asset));
    }

    /** Customer responds to a hold by resubmitting proof - goes back into the queue as PENDING_CONFIRMATION. */
    public AssetResponse resubmitProof(Long assetId, String proofDocumentBase64) {
        Asset asset = getAssetOrThrow(assetId);
        if (!"ON_HOLD".equals(asset.getStatus())) {
            throw new BusinessRuleException("Asset #" + assetId + " is not on hold.");
        }
        if (proofDocumentBase64 != null && !proofDocumentBase64.isBlank()) {
            asset.setProofDocumentBase64(proofDocumentBase64);
        }
        asset.setStatus("PENDING_CONFIRMATION");
        Asset saved = assetRepository.save(asset);
        auditService.log("Asset proof resubmitted", "Customer", "Pending", "Asset #" + assetId + " back in issuance queue");
        return toAssetResponse(saved);
    }

    public List<AssetResponse> getPendingConfirmationAssets() {
        return assetRepository.findAll().stream()
                .filter(a -> "PENDING_CONFIRMATION".equals(a.getStatus()) || "ON_HOLD".equals(a.getStatus()))
                .map(this::toAssetResponse)
                .collect(Collectors.toList());
    }

    public List<HoldingResponse> getHoldingsForUser(Long userId) {
        return holdingRepository.findByHolderId(userId).stream()
                .map(this::toHoldingResponse)
                .collect(Collectors.toList());
    }

    public AssetResponse getAssetDetails(Long assetId) {
        return toAssetResponse(getAssetOrThrow(assetId));
    }

    public List<AssetResponse> getAllAssets() {
        return assetRepository.findAll().stream()
                .map(this::toAssetResponse)
                .collect(Collectors.toList());
    }

    public Asset getAssetOrThrow(Long assetId) {
        return assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + assetId));
    }

    public AssetHolding getHoldingOrThrow(Long assetId, Long holderId) {
        return holdingRepository.findByAssetIdAndHolderId(assetId, holderId)
                .orElseThrow(() -> new BusinessRuleException(
                        "You don't currently hold any units of asset #" + assetId + "."));
    }

    public void freezeAsset(Long assetId) {
        Asset asset = getAssetOrThrow(assetId);
        asset.setStatus("FROZEN");
        assetRepository.save(asset);
        ledgerService.freeze(asset.getLedgerTokenId());
    }

    public void unfreezeAsset(Long assetId) {
        Asset asset = getAssetOrThrow(assetId);
        asset.setStatus("ACTIVE");
        assetRepository.save(asset);
        ledgerService.unfreeze(asset.getLedgerTokenId());
    }

    private AssetResponse toAssetResponse(Asset asset) {
        List<HolderSummary> holders = holdingRepository.findByAssetId(asset.getId()).stream()
                .map(h -> HolderSummary.builder()
                        .holderId(h.getHolder().getId())
                        .holderName(h.getHolder().getFullName())
                        .unitsHeld(h.getUnitsHeld())
                        .valueShare(valueShare(asset, h.getUnitsHeld()))
                        .build())
                .collect(Collectors.toList());

        return AssetResponse.builder()
                .id(asset.getId())
                .assetType(asset.getAssetType())
                .assetValue(asset.getAssetValue())
                .ownershipUnits(asset.getOwnershipUnits())
                .ownershipPercent(asset.getOwnershipPercent())
                .policyTemplate(asset.getPolicyTemplate())
                .nominee(asset.getNominee())
                .relationType(asset.getRelationType())
                .proofDocumentBase64(asset.getProofDocumentBase64())
                .status(asset.getStatus())
                .rmNote(asset.getRmNote())
                .priority(asset.isPriority())
                .ledgerTokenId(asset.getLedgerTokenId())
                .evidenceHash(asset.getEvidenceHash())
                .issuerName(asset.getIssuer().getFullName())
                .issuerId(asset.getIssuer().getId())
                .createdAt(asset.getCreatedAt())
                .holders(holders)
                .build();
    }

    private HoldingResponse toHoldingResponse(AssetHolding holding) {
        Asset asset = holding.getAsset();
        return HoldingResponse.builder()
                .assetId(asset.getId())
                .assetType(asset.getAssetType())
                .unitsHeld(holding.getUnitsHeld())
                .totalUnits(asset.getOwnershipUnits())
                .ownershipPercent(asset.getOwnershipPercent())
                .valueShare(valueShare(asset, holding.getUnitsHeld()))
                .status(asset.getStatus())
                .rmNote(asset.getRmNote())
                .priority(asset.isPriority())
                .ledgerTokenId(asset.getLedgerTokenId())
                .nominee(asset.getNominee())
                .policyTemplate(asset.getPolicyTemplate())
                .build();
    }

    private BigDecimal valueShare(Asset asset, Integer units) {
        if (asset.getOwnershipUnits() == null || asset.getOwnershipUnits() == 0) {
            return BigDecimal.ZERO;
        }
        return asset.getAssetValue()
                .multiply(BigDecimal.valueOf(units))
                .divide(BigDecimal.valueOf(asset.getOwnershipUnits()), 2, RoundingMode.HALF_UP);
    }
}
