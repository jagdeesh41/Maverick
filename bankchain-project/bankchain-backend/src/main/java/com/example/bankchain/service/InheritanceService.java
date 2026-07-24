package com.example.bankchain.service;

import com.example.bankchain.dto.InheritancePolicyRequest;
import com.example.bankchain.dto.RuleCheckResponse;
import com.example.bankchain.entity.Asset;
import com.example.bankchain.entity.InheritancePolicy;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.InheritancePolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InheritanceService {

    private final InheritancePolicyRepository inheritancePolicyRepository;
    private final AssetService assetService;
    private final AuditService auditService;
    private final SmartContractClient smartContractClient; // the Python rule engine

    public InheritancePolicy setPolicy(InheritancePolicyRequest request) {
        Asset asset = assetService.getAssetOrThrow(request.getAssetId());

        InheritancePolicy policy = inheritancePolicyRepository.findByAssetId(asset.getId())
                .orElse(InheritancePolicy.builder().asset(asset).build());

        policy.setPrimaryNominee(request.getPrimaryNominee());
        policy.setPrimaryAllocation(request.getPrimaryAllocation());
        policy.setSecondaryNominee(request.getSecondaryNominee());
        policy.setSecondaryAllocation(request.getSecondaryAllocation());
        policy.setTriggerCondition(request.getTriggerCondition());
        policy.setDisputeAction(request.getDisputeAction());
        policy.setStatus("ACTIVE");

        InheritancePolicy saved = inheritancePolicyRepository.save(policy);
        auditService.log("Inheritance policy updated", "Smart contract (digital will)", "Recorded",
                "Asset #" + asset.getId());
        return saved;
    }

    public InheritancePolicy getPolicyForAsset(Long assetId) {
        return inheritancePolicyRepository.findByAssetId(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("No inheritance policy for asset: " + assetId));
    }

    /**
     * Rule 3 is decided by the Python smart contract (contracts.py ::
     * evaluate_dispute) - raising a dispute always returns a FREEZE
     * action. Java just applies whatever action the contract returns.
     */
    public InheritancePolicy raiseDispute(Long assetId) {
        InheritancePolicy policy = getPolicyForAsset(assetId);

        RuleCheckResponse decision = smartContractClient.evaluateDispute(assetId, policy.getStatus());

        policy.setStatus("DISPUTED");
        InheritancePolicy saved = inheritancePolicyRepository.save(policy);

        if ("FREEZE".equalsIgnoreCase(decision.getAction())) {
            assetService.freezeAsset(assetId); // apply the contract's decision via the ledger
        }

        auditService.log("Inheritance dispute raised", "Smart contract (Python)", "Recorded", decision.getReason());
        return saved;
    }
}
