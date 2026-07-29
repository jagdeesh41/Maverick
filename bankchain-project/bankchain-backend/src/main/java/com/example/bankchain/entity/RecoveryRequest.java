package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "recovery_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String recoveryReason;
    private String verificationMethod;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String email;

    // GCS object key for the ID/KYC-style proof supporting this request - never the file itself.
    private String proofDocumentKey;

    // Signed read URL, populated at read time from proofDocumentKey - never persisted.
    @Transient
    private String proofDocumentUrl;

    @Column(nullable = false)
    private String status; // REQUESTED, IDENTITY_PROOFING, GOVERNANCE_APPROVAL, RESET

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "REQUESTED";
        }
    }
}
