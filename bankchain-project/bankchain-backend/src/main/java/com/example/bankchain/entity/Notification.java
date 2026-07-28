package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One row per person who needs to know something changed. Every
 * state-changing action in the system (issue, confirm, hold, transfer,
 * approve, reject, inheritance save, claim, recovery, KYC) writes one
 * of these for whoever's affected - the actor AND the counterparty
 * where there is one (e.g. both seller and buyer on a transfer).
 * This is what powers "Recent Updates" on every dashboard.
 */
@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private String entityType; // ASSET, TRANSFER, INHERITANCE, CLAIM, RECOVERY, KYC

    private Long entityId;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED, ON_HOLD, INFO

    @Column(nullable = false)
    private boolean isRead;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
