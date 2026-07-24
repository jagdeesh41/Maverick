package com.example.bankchain.service;

import com.example.bankchain.dto.KycRequest;
import com.example.bankchain.entity.Kyc;
import com.example.bankchain.entity.User;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.KycRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KycService {

    private final KycRepository kycRepository;
    private final UserService userService;
    private final AuditService auditService;

    /** Customer submits KYC documents. Starts as PENDING - needs RM/compliance approval. */
    public Kyc submit(KycRequest request) {
        User user = userService.getUserOrThrow(request.getUserId());

        Kyc kyc = kycRepository.findByUserId(user.getId())
                .orElse(Kyc.builder().user(user).build());

        kyc.setDocumentType(request.getDocumentType());
        kyc.setDocumentNumber(request.getDocumentNumber());
        kyc.setStatus("PENDING");

        Kyc saved = kycRepository.save(kyc);
        auditService.log("KYC submitted", "KYC/eKYC", "Pending", "User #" + user.getId());
        return saved;
    }

    /** RM/compliance approves a pending KYC record - required before that user can buy in a transfer. */
    public Kyc approve(Long userId) {
        Kyc kyc = kycRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No KYC record for user: " + userId));
        kyc.setStatus("APPROVED");
        Kyc saved = kycRepository.save(kyc);
        auditService.log("KYC approved", "KYC/eKYC", "Recorded", "User #" + userId);
        return saved;
    }

    public Kyc getForUser(Long userId) {
        return kycRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No KYC record for user: " + userId));
    }
}
