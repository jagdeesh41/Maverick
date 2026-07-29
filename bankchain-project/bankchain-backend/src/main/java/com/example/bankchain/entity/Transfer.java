package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "transfers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(nullable = false)
    private String buyerCustomerId;

    @Column(nullable = false)
    private Integer units;

    private String settlementRail;

    // GCS object key for the transferee's ID proof - never the file itself.
    private String transfereeProofKey;

    // Signed read URL, populated at read time from transfereeProofKey - never persisted.
    @Transient
    private String transfereeProofUrl;

    private String buyerProofType;  // ACCOUNT_NUMBER or ID_NUMBER
    private String buyerProofValue;

    @Column(nullable = false)
    private boolean consentGiven;

    private String rmNote;

    @Column(nullable = false)
    private boolean priority;

    private String contractHash; // immutable record of this transfer, set once LOCKED // set when RM places this ON_HOLD for reverification

    @Column(nullable = false)
    private String status; // LOCKED, ON_HOLD, SETTLED, REJECTED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "LOCKED";
        }
    }
}
