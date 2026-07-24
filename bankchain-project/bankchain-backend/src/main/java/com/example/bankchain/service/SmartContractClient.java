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
