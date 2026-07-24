package com.example.bankchain.service;

import com.example.bankchain.dto.RuleCheckResponse;
import com.example.bankchain.dto.TransferRequest;
import com.example.bankchain.entity.Asset;
import com.example.bankchain.entity.Kyc;
import com.example.bankchain.entity.Transfer;
import com.example.bankchain.entity.User;
import com.example.bankchain.exception.BusinessRuleException;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.KycRepository;
import com.example.bankchain.repository.TransferRepository;
import com.example.bankchain.repository.UserRepository;
import com.example.bankchain.service.ledger.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final TransferRepository transferRepository;
    private final AssetService assetService;
    private final LedgerService ledgerService;
    private final UserRepository userRepository;
    private final KycRepository kycRepository;
    private final AuditService auditService;
    private final SmartContractClient smartContractClient; // the Python rule engine

    /**
     * Customer initiates a transfer/DvP request.
     * Rule 1 is decided by the Python smart contract (contracts.py ::
     * check_transfer_allowed) - a FROZEN asset can never be moved.
     */
    public Transfer initiateTransfer(TransferRequest request) {
        Asset asset = assetService.getAssetOrThrow(request.getAssetId());

        RuleCheckResponse decision = smartContractClient.checkTransferAllowed(asset.getStatus());
        if (!decision.isAllowed()) {
            auditService.log("Transfer rejected", "Smart contract (Python)", "Blocked", decision.getReason());
            throw new BusinessRuleException(decision.getReason());
        }

        Transfer transfer = Transfer.builder()
                .asset(asset)
                .buyerCustomerId(request.getBuyerCustomerId())
                .units(request.getUnits())
                .settlementRail(request.getSettlementRail() != null
                        ? request.getSettlementRail() : "Tokenised deposit rail")
                .status("LOCKED")
                .build();

        ledgerService.transfer(asset.getLedgerTokenId(), request.getUnits(), request.getBuyerCustomerId());

        return transferRepository.save(transfer);
    }

    /**
     * RM approves a pending transfer -> settlement completes.
     * Rule 2 is decided by the Python smart contract (contracts.py ::
     * check_approval_allowed) - buyer must have an APPROVED KYC record.
     * buyerCustomerId is expected to match a User.username in this build.
     */
    public Transfer approveTransfer(Long transferId) {
        Transfer transfer = getTransferOrThrow(transferId);
        Asset asset = transfer.getAsset();

        // Re-check the frozen rule too - asset state may have changed since initiation.
        RuleCheckResponse transferDecision = smartContractClient.checkTransferAllowed(asset.getStatus());
        if (!transferDecision.isAllowed()) {
            auditService.log("Transfer approval rejected", "Smart contract (Python)", "Blocked", transferDecision.getReason());
            throw new BusinessRuleException(transferDecision.getReason());
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

        transfer.setStatus("SETTLED");
        Transfer saved = transferRepository.save(transfer);
        auditService.log("DvP transfer settled", "Settlement layer", "Success",
                "Transfer #" + transferId + " - " + approvalDecision.getReason());
        return saved;
    }

    public Transfer rejectTransfer(Long transferId) {
        Transfer transfer = getTransferOrThrow(transferId);
        transfer.setStatus("REJECTED");
        return transferRepository.save(transfer);
    }

    public List<Transfer> getPendingTransfers() {
        return transferRepository.findByStatus("LOCKED");
    }

    public List<Transfer> getAllTransfers() {
        return transferRepository.findAll();
    }

    private Transfer getTransferOrThrow(Long id) {
        return transferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found: " + id));
    }
}
