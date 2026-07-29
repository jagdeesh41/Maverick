package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Filed by a logged-in user claiming a tokenized asset they believe
 * they're entitled to - typically because the original holder has
 * died and never transferred/inherited it. Not exclusively a "death
 * claim" - any inheritance-style claim goes through this same flow.
 * Only approved if the smart contract (Rule 5) confirms a recognised
 * blood relation AND a certificate/proof was provided.
 */
@Entity
@Table(name = "property_claims")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    // The logged-in user filing the claim - once approved, the asset
    // shows up directly in THEIR portal, no separate account needed.
    @ManyToOne
    @JoinColumn(name = "claimant_id", nullable = false)
    private User claimant;

    @Column(nullable = false)
    private String claimantRelation; // SPOUSE, CHILD, PARENT, SIBLING, OTHER

    // GCS object key for the death certificate + relationship proof - never the file itself.
    private String certificateProofKey;

    // Signed read URL, populated at read time from certificateProofKey - never persisted.
    @Transient
    private String certificateProofUrl;

    @Column(nullable = false)
    private String status; // SUBMITTED, ON_HOLD, APPROVED, REJECTED

    private String rmNote;

    @Column(nullable = false)
    private boolean priority;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "SUBMITTED";
        }
    }
}
