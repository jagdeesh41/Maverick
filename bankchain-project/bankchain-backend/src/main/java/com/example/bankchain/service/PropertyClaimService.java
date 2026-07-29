package com.example.bankchain.service;

import com.example.bankchain.dto.PropertyClaimRequest;
import com.example.bankchain.dto.RuleCheckResponse;
import com.example.bankchain.entity.Asset;
import com.example.bankchain.entity.AssetHolding;
import com.example.bankchain.entity.PropertyClaim;
import com.example.bankchain.entity.User;
import com.example.bankchain.exception.BusinessRuleException;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.AssetHoldingRepository;
import com.example.bankchain.repository.PropertyClaimRepository;
import com.example.bankchain.repository.UserRepository;
import com.example.bankchain.service.ledger.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Handles someone claiming a tokenized asset they believe they're
 * entitled to (typically after the original holder's death). The smart
 * contract (Rule 5) decides ELIGIBILITY - blood relation + certificate
 * on file. RM still approves, and can hold for more documents.
 *
 * Split logic: if more than one claim on the same asset ends up
 * APPROVED (e.g. two children), the asset's original holding is split
 * EQUALLY across all approved claimants, recomputed every time a new
 * one is approved - this is a simplified equal-split model (not a
 * percentage-of-choice model), matching "2 children -> 50/50".
 *
 * Ledger scope: the on-ledger contract's approve_death_claim() only
 * supports a single full transfer from the deceased to one claimant - it
 * has no way to claw back units from an already-credited claimant to
 * re-split when a second claim is approved later. So the real ledger
 * call only fires for the single-claimant case (see approve() below);
 * multi-claimant equal-split redistribution stays Postgres-only, a known
 * gap versus a fully on-chain model.
 */
@Service
@RequiredArgsConstructor
public class PropertyClaimService {

    private final PropertyClaimRepository propertyClaimRepository;
    private final AssetHoldingRepository holdingRepository;
    private final AssetService assetService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final LedgerService ledgerService;
    private final AuditService auditService;
    private final SmartContractClient smartContractClient;
    private final NotificationService notificationService;

    public PropertyClaim submitClaim(PropertyClaimRequest request) {
        Asset asset = assetService.getAssetOrThrow(request.getAssetId());
        User claimant = userRepository.findById(request.getClaimantUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getClaimantUserId()));

        PropertyClaim claim = PropertyClaim.builder()
                .asset(asset)
                .claimant(claimant)
                .claimantRelation(request.getClaimantRelation())
                .certificateProofBase64(request.getCertificateProofBase64())
                .status("SUBMITTED")
                .build();

        PropertyClaim saved = propertyClaimRepository.save(claim);
        auditService.log("Property claim submitted", "Customer", "Pending",
                "Asset #" + asset.getId() + " claimed by " + claimant.getFullName()
                        + " (" + request.getClaimantRelation() + ")");
        notificationService.notify(claimant, "Your claim on asset #" + asset.getId() + " was submitted - awaiting RM review.",
                "CLAIM", saved.getId(), "PENDING");
        return saved;
    }

    /** Claimant flags their own pending claim as urgent - RM queues surface these first. */
    public PropertyClaim markPriority(Long claimId, boolean priority) {
        PropertyClaim claim = getOrThrow(claimId);
        claim.setPriority(priority);
        return propertyClaimRepository.save(claim);
    }

    public List<PropertyClaim> getAll() {
        return propertyClaimRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<PropertyClaim> getForAsset(Long assetId) {
        return propertyClaimRepository.findByAssetId(assetId);
    }

    public List<PropertyClaim> getForClaimant(Long claimantId) {
        return propertyClaimRepository.findByClaimantId(claimantId);
    }

    public PropertyClaim approve(Long claimId) {
        PropertyClaim claim = getOrThrow(claimId);

        boolean hasCertificate = claim.getCertificateProofBase64() != null && !claim.getCertificateProofBase64().isBlank();
        RuleCheckResponse decision = smartContractClient.evaluateDeathClaim(claim.getClaimantRelation(), hasCertificate);

        if (!decision.isAllowed()) {
            auditService.log("Property claim rejected by contract", "Smart contract (Python)", "Blocked", decision.getReason());
            throw new BusinessRuleException(decision.getReason());
        }

        claim.setStatus("APPROVED");
        claim.setRmNote(null);
        propertyClaimRepository.save(claim);

        List<PropertyClaim> approvedClaims = propertyClaimRepository.findByAssetIdAndStatus(claim.getAsset().getId(), "APPROVED");
        if (approvedClaims.size() == 1) {
            // Single claimant - the common case, and the only shape the
            // on-ledger contract can express (see class docstring).
            Asset asset = claim.getAsset();
            User deceased = userService.ensureLedgerAccount(asset.getIssuer());
            User claimantWithLedger = userService.ensureLedgerAccount(claim.getClaimant());
            ledgerService.approveDeathClaim(asset.getLedgerTokenId(), deceased.getLedgerAccountAlias(),
                    claimantWithLedger.getLedgerAccountAlias(), claim.getClaimantRelation());
        }

        redistribute(claim.getAsset().getId());

        auditService.log("Property claim approved", "RM review", "Success",
                "Claim #" + claimId + " on asset #" + claim.getAsset().getId() + " - " + decision.getReason());
        notificationService.notify(claim.getClaimant(), "Your claim on asset #" + claim.getAsset().getId()
                + " was APPROVED - check My Assets, it's now yours.", "CLAIM", claimId, "APPROVED");
        return claim;
    }

    /**
     * Recomputes an equal split of the asset's original holding across
     * every currently-APPROVED claim on it. Simplified model: pools the
     * original holder's remaining units plus whatever's already been
     * given to earlier claimants, then divides evenly; any remainder
     * unit goes to the most recently approved claimant.
     */
    private void redistribute(Long assetId) {
        Asset asset = assetService.getAssetOrThrow(assetId);
        List<PropertyClaim> approved = propertyClaimRepository.findByAssetIdAndStatus(assetId, "APPROVED");
        if (approved.isEmpty()) return;

        AssetHolding originalHolding = holdingRepository.findByAssetIdAndHolderId(assetId, asset.getIssuer().getId())
                .orElse(null);

        int pool = originalHolding != null ? originalHolding.getUnitsHeld() : 0;
        for (PropertyClaim c : approved) {
            AssetHolding h = holdingRepository.findByAssetIdAndHolderId(assetId, c.getClaimant().getId()).orElse(null);
            if (h != null) pool += h.getUnitsHeld();
        }

        if (pool <= 0) {
            throw new BusinessRuleException("This asset's holding has already been fully distributed.");
        }

        int share = pool / approved.size();
        int remainder = pool % approved.size();

        if (originalHolding != null) {
            holdingRepository.delete(originalHolding);
        }

        for (int i = 0; i < approved.size(); i++) {
            PropertyClaim c = approved.get(i);
            int units = share + (i == approved.size() - 1 ? remainder : 0);
            AssetHolding h = holdingRepository.findByAssetIdAndHolderId(assetId, c.getClaimant().getId())
                    .orElse(AssetHolding.builder().asset(asset).holder(c.getClaimant()).unitsHeld(0).build());
            h.setUnitsHeld(units);
            holdingRepository.save(h);
        }
    }

    public PropertyClaim reject(Long claimId) {
        PropertyClaim claim = getOrThrow(claimId);
        claim.setStatus("REJECTED");
        PropertyClaim saved = propertyClaimRepository.save(claim);
        auditService.log("Property claim rejected by RM", "RM review", "Recorded", "Claim #" + claimId);
        notificationService.notify(claim.getClaimant(), "Your claim on asset #" + claim.getAsset().getId() + " was rejected.",
                "CLAIM", claimId, "REJECTED");
        return saved;
    }

    public PropertyClaim hold(Long claimId, String note) {
        PropertyClaim claim = getOrThrow(claimId);
        claim.setStatus("ON_HOLD");
        claim.setRmNote(note != null && !note.isBlank() ? note : "RM has requested more documentation for this claim.");
        PropertyClaim saved = propertyClaimRepository.save(claim);
        auditService.log("Property claim held", "RM review", "On hold", "Claim #" + claimId + " - " + claim.getRmNote());
        notificationService.notify(claim.getClaimant(), "Your claim on asset #" + claim.getAsset().getId() + " needs more info: " + claim.getRmNote(),
                "CLAIM", claimId, "ON_HOLD");
        return saved;
    }

    private PropertyClaim getOrThrow(Long claimId) {
        return propertyClaimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Property claim not found: " + claimId));
    }
}
