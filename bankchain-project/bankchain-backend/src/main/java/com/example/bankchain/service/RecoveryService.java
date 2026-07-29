package com.example.bankchain.service;

import com.example.bankchain.dto.RecoveryRequestDto;
import com.example.bankchain.entity.RecoveryRequest;
import com.example.bankchain.entity.User;
import com.example.bankchain.repository.RecoveryRequestRepository;
import com.example.bankchain.service.storage.GcsFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecoveryService {

    private final RecoveryRequestRepository recoveryRequestRepository;
    private final UserService userService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final SmartContractClient smartContractClient;
    private final GcsFileService gcsFileService;

    public RecoveryRequest submitRequest(RecoveryRequestDto dto) {
        User user = userService.getUserOrThrow(dto.getUserId());

        RecoveryRequest request = RecoveryRequest.builder()
                .user(user)
                .recoveryReason(dto.getRecoveryReason())
                .verificationMethod(dto.getVerificationMethod())
                .phoneNumber(dto.getPhoneNumber())
                .email(dto.getEmail())
                .proofDocumentKey(dto.getProofDocumentKey())
                .status("REQUESTED")
                .build();

        RecoveryRequest saved = recoveryRequestRepository.save(request);
        auditService.log("Recovery request submitted", "IAM", "Pending",
                "User #" + user.getId() + " - " + dto.getRecoveryReason());
        notificationService.notify(user, "Your recovery request was submitted - status REQUESTED.", "RECOVERY", saved.getId(), "PENDING");
        return withUrl(saved);
    }

    public List<RecoveryRequest> getRequestsForUser(Long userId) {
        return recoveryRequestRepository.findByUserId(userId).stream().map(this::withUrl).collect(Collectors.toList());
    }

    /** Every recovery request, newest first - gives RM an actual worklist. */
    public List<RecoveryRequest> getAll() {
        return recoveryRequestRepository.findAllByOrderByCreatedAtDesc().stream().map(this::withUrl).collect(Collectors.toList());
    }

    public RecoveryRequest advanceStatus(Long requestId, String newStatus) {
        RecoveryRequest request = recoveryRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Recovery request not found: " + requestId));

        // Moving past REQUESTED for the first time requires the contract's sign-off -
        // RM can't just click through without the minimum info on file.
        if ("REQUESTED".equals(request.getStatus())) {
            boolean hasProof = request.getProofDocumentKey() != null && !request.getProofDocumentKey().isBlank();
            boolean hasPhone = request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank();
            boolean hasEmail = request.getEmail() != null && !request.getEmail().isBlank();
            com.example.bankchain.dto.RuleCheckResponse decision = smartContractClient.evaluateRecoveryAdvance(hasProof, hasPhone, hasEmail);
            if (!decision.isAllowed()) {
                auditService.log("Recovery advance rejected", "Smart contract (Python)", "Blocked", decision.getReason());
                throw new com.example.bankchain.exception.BusinessRuleException(decision.getReason());
            }
        }

        request.setStatus(newStatus);
        RecoveryRequest saved = recoveryRequestRepository.save(request);
        notificationService.notify(request.getUser(), "Your recovery request advanced to " + newStatus + ".",
                "RECOVERY", requestId, "RESET".equals(newStatus) ? "APPROVED" : "PENDING");
        return withUrl(saved);
    }

    /** Populates the transient signed-URL field before a RecoveryRequest entity goes back to the frontend. */
    private RecoveryRequest withUrl(RecoveryRequest request) {
        request.setProofDocumentUrl(gcsFileService.signedUrl(request.getProofDocumentKey()));
        return request;
    }
}
