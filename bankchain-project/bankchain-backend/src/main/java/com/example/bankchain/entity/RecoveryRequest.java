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

    private String recoveryReason;     // "Lost device"
    private String verificationMethod; // "Bank KYC + MFA"
    private String emergencyContact;

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
