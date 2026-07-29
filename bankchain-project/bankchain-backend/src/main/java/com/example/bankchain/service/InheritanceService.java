package com.example.bankchain.service;

import com.example.bankchain.dto.InheritancePolicyRequest;
import com.example.bankchain.dto.NomineeDto;
import com.example.bankchain.dto.RuleCheckResponse;
import com.example.bankchain.entity.Asset;
import com.example.bankchain.entity.InheritancePolicy;
import com.example.bankchain.entity.Nominee;
import com.example.bankchain.exception.BusinessRuleException;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.InheritancePolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InheritanceService {

    private final InheritancePolicyRepository inheritancePolicyRepository;
    private final AssetService assetService;
    private final AuditService auditService;
    private final SmartContractClient smartContractClient; // the Python rule engine
    private final NotificationService notificationService;

    public InheritancePolicy setPolicy(InheritancePolicyRequest request) {
        Asset asset = assetService.getAssetOrThrow(request.getAssetId());

        InheritancePolicy policy = inheritancePolicyRepository.findByAssetId(asset.getId())
                .orElse(InheritancePolicy.builder().asset(asset).build());

        List<NomineeDto> incoming = request.getNominees() != null ? request.getNominees() : List.of();
        int totalAllocation = incoming.stream().mapToInt(n -> n.getAllocationPercent() != null ? n.getAllocationPercent() : 0).sum();
        if (totalAllocation > 100) {
            throw new BusinessRuleException("Nominee allocations cannot exceed 100% (got " + totalAllocation + "%).");
        }
        if (incoming.isEmpty()) {
            throw new BusinessRuleException("Add at least one nominee before saving a policy.");
        }

        // Validate every nominee's proof through the same smart contract rule (Rule 6) used elsewhere.
        for (NomineeDto n : incoming) {
            if (n.getProofValue() != null && !n.getProofValue().isBlank()) {
                RuleCheckResponse decision = smartContractClient.validateProof(n.getProofValue());
                if (!decision.isAllowed()) {
                    throw new BusinessRuleException("Nominee '" + n.getName() + "': " + decision.getReason());
                }
            }
        }

        policy.getNominees().clear();
        List<Nominee> nominees = new ArrayList<>();
        for (NomineeDto n : incoming) {
            nominees.add(Nominee.builder()
                    .policy(policy)
                    .name(n.getName())
                    .relation(n.getRelation())
                    .allocationPercent(n.getAllocationPercent() != null ? n.getAllocationPercent() : 0)
                    .proofType(n.getProofType())
                    .proofValue(n.getProofValue())
                    .build());
        }
        policy.getNominees().addAll(nominees);

        policy.setTriggerCondition(request.getTriggerCondition());
        policy.setProofDocumentBase64(request.getProofDocumentBase64());
        policy.setDisputeAction(request.getDisputeAction());
        policy.setSelfRetainedPercent(100 - totalAllocation);
        policy.setStatus("ACTIVE");
        policy.setContractHash("0x" + java.util.UUID.randomUUID().toString().replace("-", ""));

        InheritancePolicy saved = inheritancePolicyRepository.save(policy);
        auditService.log("Inheritance policy updated", "Smart contract (digital will)", "Recorded",
                "Asset #" + asset.getId() + " - " + incoming.size() + " nominee(s), trigger: " + request.getTriggerCondition());
        notificationService.notify(asset.getIssuer(), "Inheritance policy for asset #" + asset.getId()
                + " saved - " + incoming.size() + " nominee(s), triggers " + request.getTriggerCondition() + ".",
                "INHERITANCE", asset.getId(), "INFO");
        return saved;
    }

    public InheritancePolicy getPolicyForAsset(Long assetId) {
        return inheritancePolicyRepository.findByAssetId(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("No inheritance policy for asset: " + assetId));
    }

    public InheritancePolicy raiseDispute(Long assetId) {
        InheritancePolicy policy = getPolicyForAsset(assetId);

        RuleCheckResponse decision = smartContractClient.evaluateDispute(assetId, policy.getStatus());

        policy.setStatus("DISPUTED");
        InheritancePolicy saved = inheritancePolicyRepository.save(policy);

        if ("FREEZE".equalsIgnoreCase(decision.getAction())) {
            assetService.raiseDisputeAndFreeze(assetId);
        }

        auditService.log("Inheritance dispute raised", "Smart contract (Python)", "Recorded", decision.getReason());
        return saved;
    }
}
