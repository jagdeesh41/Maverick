package com.example.bankchain.service;

import com.example.bankchain.dto.RuleCheckResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Bridge between the Java backend and the Python smart-contract engine
 * (smart-contracts/app.py). This is what a "Smart Contract Adapter" does
 * in the reference architecture: it calls out to the contract execution
 * layer and returns its decision - it never decides the rule itself.
 *
 * If the Python service is unreachable (e.g. not started for a quick
 * demo), this falls back to the same rules evaluated locally, so the
 * backend degrades gracefully instead of hard-failing every request.
 * The fallback is logged clearly so it's obvious which path was used.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SmartContractClient {

    private final RestTemplate restTemplate;
    private final AuditService auditService;

    @Value("${smartcontract.service.url:http://localhost:5000}")
    private String baseUrl;

    public RuleCheckResponse checkTransferAllowed(String assetStatus) {
        try {
            return restTemplate.postForObject(
                    baseUrl + "/rules/check-transfer",
                    Map.of("assetStatus", assetStatus),
                    RuleCheckResponse.class);
        } catch (RestClientException ex) {
            log.warn("Python smart contract engine unreachable, falling back to local rule check: {}", ex.getMessage());
            auditService.log("Smart contract fallback", "Local Java fallback", "Warning",
                    "Python engine unreachable - evaluated check-transfer locally");
            RuleCheckResponse fallback = new RuleCheckResponse();
            boolean frozen = "FROZEN".equalsIgnoreCase(assetStatus);
            fallback.setAllowed(!frozen);
            fallback.setReason(frozen ? "Asset is FROZEN (local fallback check)." : "Asset is transferable (local fallback check).");
            return fallback;
        }
    }

    public RuleCheckResponse checkApprovalAllowed(String kycStatus) {
        try {
            return restTemplate.postForObject(
                    baseUrl + "/rules/check-approval",
                    Map.of("kycStatus", kycStatus == null ? "" : kycStatus),
                    RuleCheckResponse.class);
        } catch (RestClientException ex) {
            log.warn("Python smart contract engine unreachable, falling back to local rule check: {}", ex.getMessage());
            auditService.log("Smart contract fallback", "Local Java fallback", "Warning",
                    "Python engine unreachable - evaluated check-approval locally");
            RuleCheckResponse fallback = new RuleCheckResponse();
            boolean approved = "APPROVED".equalsIgnoreCase(kycStatus);
            fallback.setAllowed(approved);
            fallback.setReason(approved ? "Buyer KYC verified (local fallback check)."
                    : "Buyer KYC not approved (local fallback check).");
            return fallback;
        }
    }

    public RuleCheckResponse checkUnitsAvailable(Integer availableUnits, Integer requestedUnits) {
        try {
            return restTemplate.postForObject(
                    baseUrl + "/rules/check-units",
                    Map.of("availableUnits", availableUnits, "requestedUnits", requestedUnits),
                    RuleCheckResponse.class);
        } catch (RestClientException ex) {
            log.warn("Python smart contract engine unreachable, falling back to local rule check: {}", ex.getMessage());
            auditService.log("Smart contract fallback", "Local Java fallback", "Warning",
                    "Python engine unreachable - evaluated check-units locally");
            RuleCheckResponse fallback = new RuleCheckResponse();
            boolean ok = requestedUnits != null && availableUnits != null
                    && requestedUnits > 0 && requestedUnits <= availableUnits;
            fallback.setAllowed(ok);
            fallback.setReason(ok
                    ? "Requested units within holding (local fallback check)."
                    : "Requested units exceed current holding (local fallback check).");
            return fallback;
        }
    }

    public RuleCheckResponse evaluateIssuance(String assetType, Integer ownershipPercent, boolean hasProof) {
        try {
            return restTemplate.postForObject(
                    baseUrl + "/rules/issuance",
                    Map.of("assetType", assetType == null ? "" : assetType,
                            "ownershipPercent", ownershipPercent == null ? 0 : ownershipPercent,
                            "hasProof", hasProof),
                    RuleCheckResponse.class);
        } catch (RestClientException ex) {
            log.warn("Python smart contract engine unreachable, falling back to local rule check: {}", ex.getMessage());
            auditService.log("Smart contract fallback", "Local Java fallback", "Warning",
                    "Python engine unreachable - evaluated issuance locally");
            java.util.Set<String> fullyOwnedTypes = java.util.Set.of("FIXED DEPOSIT", "CORPORATE BOND", "EQUITY", "COMMODITY");
            String typeKey = assetType == null ? "" : assetType.trim().toUpperCase();
            int percent = ownershipPercent == null ? 0 : ownershipPercent;
            RuleCheckResponse fallback = new RuleCheckResponse();
            boolean ok;
            String reason;
            if (fullyOwnedTypes.contains(typeKey) && percent != 100) {
                ok = false; reason = assetType + " must be 100% owned at issuance - got " + percent + "% (local fallback check).";
            } else if (percent < 1 || percent > 100) {
                ok = false; reason = "Ownership percent must be between 1 and 100 (local fallback check).";
            } else if (!hasProof) {
                ok = false; reason = "No proof document attached (local fallback check).";
            } else {
                ok = true; reason = "Eligible for confirmation (local fallback check).";
            }
            fallback.setAllowed(ok);
            fallback.setReason(reason);
            return fallback;
        }
    }

    public RuleCheckResponse evaluateRecoveryAdvance(boolean hasProof, boolean hasPhone, boolean hasEmail) {
        try {
            return restTemplate.postForObject(
                    baseUrl + "/rules/recovery-advance",
                    Map.of("hasProof", hasProof, "hasPhone", hasPhone, "hasEmail", hasEmail),
                    RuleCheckResponse.class);
        } catch (RestClientException ex) {
            log.warn("Python smart contract engine unreachable, falling back to local rule check: {}", ex.getMessage());
            auditService.log("Smart contract fallback", "Local Java fallback", "Warning",
                    "Python engine unreachable - evaluated recovery-advance locally");
            RuleCheckResponse fallback = new RuleCheckResponse();
            boolean ok = hasProof && hasPhone && hasEmail;
            fallback.setAllowed(ok);
            fallback.setReason(ok ? "Eligible to advance (local fallback check)." : "Missing required info (local fallback check).");
            return fallback;
        }
    }

    public RuleCheckResponse validateProof(String proofValue) {
        try {
            return restTemplate.postForObject(
                    baseUrl + "/rules/validate-proof",
                    Map.of("proofValue", proofValue == null ? "" : proofValue),
                    RuleCheckResponse.class);
        } catch (RestClientException ex) {
            log.warn("Python smart contract engine unreachable, falling back to local rule check: {}", ex.getMessage());
            auditService.log("Smart contract fallback", "Local Java fallback", "Warning",
                    "Python engine unreachable - evaluated validate-proof locally");
            String value = proofValue == null ? "" : proofValue.trim();
            String digitsOnly = value.replaceAll("[^0-9]", "");
            boolean allZeros = !digitsOnly.isEmpty() && digitsOnly.chars().allMatch(c -> c == '0');
            RuleCheckResponse fallback = new RuleCheckResponse();
            boolean ok = !value.isEmpty() && !allZeros;
            fallback.setAllowed(ok);
            fallback.setReason(ok ? "Passed validation (local fallback check)." : "Invalid value - all zeros or empty (local fallback check).");
            return fallback;
        }
    }

    public RuleCheckResponse evaluateDeathClaim(String claimantRelation, boolean hasCertificate) {
        try {
            return restTemplate.postForObject(
                    baseUrl + "/rules/death-claim",
                    Map.of("claimantRelation", claimantRelation == null ? "" : claimantRelation,
                            "hasCertificate", hasCertificate),
                    RuleCheckResponse.class);
        } catch (RestClientException ex) {
            log.warn("Python smart contract engine unreachable, falling back to local rule check: {}", ex.getMessage());
            auditService.log("Smart contract fallback", "Local Java fallback", "Warning",
                    "Python engine unreachable - evaluated death-claim locally");
            java.util.Set<String> bloodRelations = java.util.Set.of("SPOUSE", "CHILD", "PARENT", "SIBLING");
            String relation = claimantRelation == null ? "" : claimantRelation.toUpperCase();
            RuleCheckResponse fallback = new RuleCheckResponse();
            boolean ok = bloodRelations.contains(relation) && hasCertificate;
            fallback.setAllowed(ok);
            fallback.setReason(ok
                    ? "Blood relation with certificate confirmed (local fallback check)."
                    : "Not a recognised blood relation, or no certificate provided (local fallback check).");
            return fallback;
        }
    }

    public RuleCheckResponse evaluateDispute(Long assetId, String currentStatus) {
        try {
            return restTemplate.postForObject(
                    baseUrl + "/rules/dispute",
                    Map.of("assetId", assetId, "currentStatus", currentStatus),
                    RuleCheckResponse.class);
        } catch (RestClientException ex) {
            log.warn("Python smart contract engine unreachable, falling back to local rule check: {}", ex.getMessage());
            auditService.log("Smart contract fallback", "Local Java fallback", "Warning",
                    "Python engine unreachable - evaluated dispute rule locally");
            RuleCheckResponse fallback = new RuleCheckResponse();
            fallback.setAllowed(true);
            fallback.setAction("FREEZE");
            fallback.setReason("Dispute raised (local fallback check) - auto-freezing.");
            return fallback;
        }
    }
}
