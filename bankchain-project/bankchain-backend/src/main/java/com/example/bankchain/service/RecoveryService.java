package com.example.bankchain.service;

import com.example.bankchain.dto.RecoveryRequestDto;
import com.example.bankchain.entity.RecoveryRequest;
import com.example.bankchain.entity.User;
import com.example.bankchain.repository.RecoveryRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecoveryService {

    private final RecoveryRequestRepository recoveryRequestRepository;
    private final UserService userService;
    private final AuditService auditService;

    public RecoveryRequest submitRequest(RecoveryRequestDto dto) {
        User user = userService.getUserOrThrow(dto.getUserId());

        RecoveryRequest request = RecoveryRequest.builder()
                .user(user)
                .recoveryReason(dto.getRecoveryReason())
                .verificationMethod(dto.getVerificationMethod())
                .emergencyContact(dto.getEmergencyContact())
                .status("REQUESTED")
                .build();

        RecoveryRequest saved = recoveryRequestRepository.save(request);
        auditService.log("Recovery request submitted", "IAM", "Pending",
                "User #" + user.getId() + " - " + dto.getRecoveryReason());
        return saved;
    }

    public List<RecoveryRequest> getRequestsForUser(Long userId) {
        return recoveryRequestRepository.findByUserId(userId);
    }

    public RecoveryRequest advanceStatus(Long requestId, String newStatus) {
        RecoveryRequest request = recoveryRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Recovery request not found: " + requestId));
        request.setStatus(newStatus);
        return recoveryRequestRepository.save(request);
    }
}
