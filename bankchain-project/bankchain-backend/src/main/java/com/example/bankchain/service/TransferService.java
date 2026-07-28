package com.example.bankchain.service;

import com.example.bankchain.dto.RuleCheckResponse;
import com.example.bankchain.dto.TransferQueueItemResponse;
import com.example.bankchain.dto.TransferRequest;
import com.example.bankchain.entity.Asset;
import com.example.bankchain.entity.AssetHolding;
import com.example.bankchain.entity.Kyc;
import com.example.bankchain.entity.Transfer;
import com.example.bankchain.entity.User;
import com.example.bankchain.exception.BusinessRuleException;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.AssetHoldingRepository;
import com.example.bankchain.repository.KycRepository;
import com.example.bankchain.repository.TransferRepository;
import com.example.bankchain.repository.UserRepository;
import com.example.bankchain.service.ledger.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final TransferRepository transferRepository;
    private final AssetService assetService;
    private final AssetHoldingRepository holdingRepository;
    private final LedgerService ledgerService;
    private final UserRepository userRepository;
    private final KycRepository kycRepository;
    private final AuditService auditService;
    private final SmartContractClient smartContractClient; // the Python rule engine
    private final NotificationService notificationService;

    /**
     * Customer initiates a transfer/DvP request for units they hold.
     * Order of checks, all decided by the Python smart contract:
     *   1. Asset must be ACTIVE (not still pending confirmation, not frozen) - Rule 1
     *   2. Seller must currently hold >= requested units             - Rule 4
     * The seller's holding is NOT decremented yet - only on RM approval,
     * so a rejected/pending transfer never locks anything up.
     */
    public Transfer initiateTransfer(TransferRequest request) {
        Asset asset = assetService.getAssetOrThrow(request.getAssetId());
        User seller = userRepository.findById(request.getSellerId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getSellerId()));

        if ("PENDING_CONFIRMATION".equals(asset.getStatus())) {
            throw new BusinessRuleException(
                    "Asset #" + asset.getId() + " is still awaiting RM confirmation and can't be transferred yet.");
        }

        RuleCheckResponse transferDecision = smartContractClient.checkTransferAllowed(asset.getStatus());
        if (!transferDecision.isAllowed()) {
            auditService.log("Transfer rejected", "Smart contract (Python)", "Blocked", transferDecision.getReason());
            throw new BusinessRuleException(transferDecision.getReason());
        }

        AssetHolding holding = assetService.getHoldingOrThrow(asset.getId(), seller.getId());
        RuleCheckResponse unitsDecision = smartContractClient.checkUnitsAvailable(holding.getUnitsHeld(), request.getUnits());
        if (!unitsDecision.isAllowed()) {
            auditService.log("Transfer rejected", "Smart contract (Python)", "Blocked", unitsDecision.getReason());
            throw new BusinessRuleException(unitsDecision.getReason());
        }

        RuleCheckResponse proofDecision = smartContractClient.validateProof(request.getBuyerProofValue());
        if (!proofDecision.isAllowed()) {
            auditService.log("Transfer rejected", "Smart contract (Python)", "Blocked", proofDecision.getReason());
            throw new BusinessRuleException(proofDecision.getReason());
        }

        Transfer transfer = Transfer.builder()
                .asset(asset)
                .seller(seller)
                .buyerCustomerId(request.getBuyerCustomerId())
                .units(request.getUnits())
                .settlementRail(request.getSettlementRail() != null
                        ? request.getSettlementRail() : "Tokenised deposit rail")
                .transfereeProofBase64(request.getTransfereeProofBase64())
                .buyerProofType(request.getBuyerProofType())
                .buyerProofValue(request.getBuyerProofValue())
                .consentGiven(request.isConsentGiven())
                .contractHash("0x" + java.util.UUID.randomUUID().toString().replace("-", ""))
                .status("LOCKED")
                .build();

        ledgerService.transfer(asset.getLedgerTokenId(), request.getUnits(), request.getBuyerCustomerId());

        Transfer saved = transferRepository.save(transfer);

        notificationService.notify(seller, "You initiated a transfer of " + transfer.getUnits() + " unit(s) of asset #"
                + asset.getId() + " to " + transfer.getBuyerCustomerId() + " - awaiting RM approval.", "TRANSFER", saved.getId(), "PENDING");
        userRepository.findByUsername(transfer.getBuyerCustomerId()).ifPresent(buyer ->
                notificationService.notify(buyer, seller.getFullName() + " wants to send you " + transfer.getUnits()
                        + " unit(s) of asset #" + asset.getId() + " - awaiting RM approval.", "TRANSFER", saved.getId(), "PENDING"));

        return saved;
    }

    /**
     * RM approves a pending transfer -> the actual unit split happens here.
     * Re-checks Rule 1 and Rule 4 (holding may have changed since
     * initiation), then Rule 2 (buyer KYC) before moving any units.
     */
    public Transfer approveTransfer(Long transferId) {
        Transfer transfer = getTransferOrThrow(transferId);
        if (!"LOCKED".equals(transfer.getStatus())) {
            throw new BusinessRuleException("Transfer #" + transferId + " is not pending (status: " + transfer.getStatus() + ").");
        }
        Asset asset = transfer.getAsset();

        RuleCheckResponse transferDecision = smartContractClient.checkTransferAllowed(asset.getStatus());
        if (!transferDecision.isAllowed()) {
            auditService.log("Transfer approval rejected", "Smart contract (Python)", "Blocked", transferDecision.getReason());
            throw new BusinessRuleException(transferDecision.getReason());
        }

        AssetHolding sellerHolding = assetService.getHoldingOrThrow(asset.getId(), transfer.getSeller().getId());
        RuleCheckResponse unitsDecision = smartContractClient.checkUnitsAvailable(sellerHolding.getUnitsHeld(), transfer.getUnits());
        if (!unitsDecision.isAllowed()) {
            auditService.log("Transfer approval rejected", "Smart contract (Python)", "Blocked", unitsDecision.getReason());
            throw new BusinessRuleException(unitsDecision.getReason());
        }

        Optional<User> buyer = userRepository.findByUsername(transfer.getBuyerCustomerId());
        String kycStatus = null;
        if (buyer.isPresent()) {
            Kyc kyc = kycRepository.findByUserId(buyer.get().getId()).orElse(null);
            kycStatus = kyc == null ? null : kyc.getStatus();
        }

        RuleCheckResponse approvalDecision = smartContractClient.checkApprovalAllowed(kycStatus);
        if (!approvalDecision.isAllowed()) {
            auditService.log("Transfer approval rejected", "Smart contract (Python)", "Blocked", approvalDecision.getReason());
            throw new BusinessRuleException(approvalDecision.getReason());
        }

        // ---- The actual split: decrement seller, credit buyer ----
        int remaining = sellerHolding.getUnitsHeld() - transfer.getUnits();
        if (remaining > 0) {
            sellerHolding.setUnitsHeld(remaining);
            holdingRepository.save(sellerHolding);
        } else {
            holdingRepository.delete(sellerHolding); // seller fully exited this asset
        }

        AssetHolding buyerHolding = holdingRepository.findByAssetIdAndHolderId(asset.getId(), buyer.get().getId())
                .orElse(AssetHolding.builder().asset(asset).holder(buyer.get()).unitsHeld(0).build());
        buyerHolding.setUnitsHeld(buyerHolding.getUnitsHeld() + transfer.getUnits());
        holdingRepository.save(buyerHolding);

        transfer.setStatus("SETTLED");
        Transfer saved = transferRepository.save(transfer);
        auditService.log("DvP transfer settled", "Settlement layer", "Success",
                "Transfer #" + transferId + " - " + transfer.getUnits() + " unit(s) of asset #" + asset.getId()
                        + " moved to " + transfer.getBuyerCustomerId());

        notificationService.notify(transfer.getSeller(), "Your transfer of " + transfer.getUnits() + " unit(s) of asset #"
                + asset.getId() + " to " + transfer.getBuyerCustomerId() + " has SETTLED.", "TRANSFER", transferId, "APPROVED");
        notificationService.notify(buyer.orElse(null), "You received " + transfer.getUnits() + " unit(s) of asset #"
                + asset.getId() + " (" + asset.getAssetType() + ") - it's now in your My Assets.", "TRANSFER", transferId, "APPROVED");

        return saved;
    }

    public Transfer rejectTransfer(Long transferId) {
        Transfer transfer = getTransferOrThrow(transferId);
        transfer.setStatus("REJECTED");
        Transfer saved = transferRepository.save(transfer);
        auditService.log("Transfer rejected by RM", "RM review", "Recorded", "Transfer #" + transferId);
        notificationService.notify(transfer.getSeller(), "Your transfer #" + transferId + " was rejected by RM.",
                "TRANSFER", transferId, "REJECTED");
        return saved;
    }

    /** Customer flags their own pending transfer as urgent - RM queues surface these first. */
    public Transfer markPriority(Long transferId, boolean priority) {
        Transfer transfer = getTransferOrThrow(transferId);
        transfer.setPriority(priority);
        return transferRepository.save(transfer);
    }

    /** RM holds a transfer and asks for reverification (extra proof) before deciding. */
    public Transfer holdTransfer(Long transferId, String note) {
        Transfer transfer = getTransferOrThrow(transferId);
        transfer.setStatus("ON_HOLD");
        transfer.setRmNote(note != null && !note.isBlank() ? note : "RM has requested reverification for this transfer.");
        Transfer saved = transferRepository.save(transfer);
        auditService.log("Transfer held for reverification", "RM review", "On hold", "Transfer #" + transferId + " - " + transfer.getRmNote());
        notificationService.notify(transfer.getSeller(), "Your transfer #" + transferId + " needs more info: " + transfer.getRmNote(),
                "TRANSFER", transferId, "ON_HOLD");
        return saved;
    }

    public List<Transfer> getPendingTransfers() {
        List<Transfer> pending = new ArrayList<>(transferRepository.findByStatus("LOCKED"));
        pending.addAll(transferRepository.findByStatus("ON_HOLD"));
        return pending;
    }

    public List<TransferQueueItemResponse> getApprovalQueue() {
        return getPendingTransfers().stream().map(this::toQueueItem).collect(Collectors.toList());
    }

    /** Every transfer this user is involved in, either side, any status - for their own dashboard/history. */
    public List<TransferQueueItemResponse> getTransfersForUser(User user) {
        List<Transfer> all = new ArrayList<>();
        all.addAll(transferRepository.findBySellerId(user.getId()));
        all.addAll(transferRepository.findByBuyerCustomerId(user.getUsername()));
        return all.stream().map(this::toQueueItem).collect(Collectors.toList());
    }

    public List<Transfer> getAllTransfers() {
        return transferRepository.findAll();
    }

    /** Every transfer ever made on one specific asset - used by RM lookup. */
    public List<TransferQueueItemResponse> getTransfersForAsset(Long assetId) {
        return transferRepository.findByAssetId(assetId).stream().map(this::toQueueItem).collect(Collectors.toList());
    }

    private TransferQueueItemResponse toQueueItem(Transfer t) {
        Kyc buyerKyc = userRepository.findByUsername(t.getBuyerCustomerId())
                .flatMap(u -> kycRepository.findByUserId(u.getId()))
                .orElse(null);

        return TransferQueueItemResponse.builder()
                .id(t.getId())
                .assetId(t.getAsset().getId())
                .assetType(t.getAsset().getAssetType())
                .sellerId(t.getSeller().getId())
                .sellerName(t.getSeller().getFullName())
                .buyerUsername(t.getBuyerCustomerId())
                .buyerKycStatus(buyerKyc == null ? null : buyerKyc.getStatus())
                .units(t.getUnits())
                .status(t.getStatus())
                .rmNote(t.getRmNote())
                .priority(t.isPriority())
                .contractHash(t.getContractHash())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private Transfer getTransferOrThrow(Long id) {
        return transferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found: " + id));
    }
}
