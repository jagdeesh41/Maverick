package com.example.bankchain.service;

import com.example.bankchain.dto.KycQueueItemResponse;
import com.example.bankchain.dto.KycRequest;
import com.example.bankchain.dto.RuleCheckResponse;
import com.example.bankchain.entity.Kyc;
import com.example.bankchain.entity.User;
import com.example.bankchain.exception.BusinessRuleException;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.KycRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KycService {

    private final KycRepository kycRepository;
    private final UserService userService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final SmartContractClient smartContractClient;

    /** Customer submits KYC documents. Starts as PENDING - needs RM/compliance approval. */
    public Kyc submit(KycRequest request) {
        User user = userService.getUserOrThrow(request.getUserId());

        Kyc kyc = kycRepository.findByUserId(user.getId())
                .orElse(Kyc.builder().user(user).build());

        kyc.setDocumentType(request.getDocumentType());
        kyc.setDocumentNumber(request.getDocumentNumber());
        kyc.setProofPhotoBase64(request.getProofPhotoBase64());
        kyc.setStatus("PENDING");

        Kyc saved = kycRepository.save(kyc);
        auditService.log("KYC submitted", "KYC/eKYC", "Pending", "User #" + user.getId());
        notificationService.notify(user, "Your KYC was submitted - status PENDING.", "KYC", user.getId(), "PENDING");
        return saved;
    }

    /** RM/compliance approves a pending KYC record - required before that user can buy in a transfer. */
    public Kyc approve(Long userId) {
        Kyc kyc = kycRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No KYC record for user: " + userId));

        RuleCheckResponse decision = smartContractClient.validateProof(kyc.getDocumentNumber());
        if (!decision.isAllowed()) {
            auditService.log("KYC approval rejected", "Smart contract (Python)", "Blocked", decision.getReason());
            throw new BusinessRuleException("Document number failed validation: " + decision.getReason());
        }
        if (kyc.getProofPhotoBase64() == null || kyc.getProofPhotoBase64().isBlank()) {
            auditService.log("KYC approval rejected", "Smart contract (Python)", "Blocked", "No proof photo attached.");
            throw new BusinessRuleException("No proof photo attached to this KYC record - cannot approve.");
        }

        kyc.setStatus("APPROVED");
        Kyc saved = kycRepository.save(kyc);
        auditService.log("KYC approved", "Smart contract (Python)", "Success", decision.getReason());
        notificationService.notify(kyc.getUser(), "Your KYC was APPROVED - you can now be a buyer in transfers.", "KYC", userId, "APPROVED");
        return saved;
    }

    public Kyc getForUser(Long userId) {
        return kycRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No KYC record for user: " + userId));
    }

    /** Every KYC record still PENDING - this is what gives RM an actual queue instead of lookup-by-id. */
    public List<KycQueueItemResponse> getPending() {
        return kycRepository.findByStatus("PENDING").stream()
                .map(k -> KycQueueItemResponse.builder()
                        .userId(k.getUser().getId())
                        .username(k.getUser().getUsername())
                        .fullName(k.getUser().getFullName())
                        .documentType(k.getDocumentType())
                        .documentNumber(k.getDocumentNumber())
                        .proofPhotoBase64(k.getProofPhotoBase64())
                        .status(k.getStatus())
                        .build())
                .collect(Collectors.toList());
    }
}
