package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "issuer_id", nullable = false)
    private User issuer;

    @Column(nullable = false)
    private String assetType;

    @Column(nullable = false)
    private BigDecimal assetValue;

    @Column(nullable = false)
    private Integer ownershipUnits;

    // What % of the FULL real-world asset this token actually represents.
    // Fixed Deposit / Bond / Equity / Commodity are always fully owned (100)
    // once issued. Real Estate can be partial - e.g. still paying a mortgage.
    @Column(nullable = false)
    private Integer ownershipPercent;

    private String policyTemplate;

    private String nominee;

    // Who the nominee is to the issuer - SELF, FAMILY, FRIEND, FAMILY_FRIEND, RELATIVE
    private String relationType;

    @Lob
    private String proofDocumentBase64; // ownership/asset proof photo, base64

    @Column(nullable = false)
    private String status; // PENDING_CONFIRMATION, ON_HOLD, ACTIVE, FROZEN

    private String rmNote;

    @Column(nullable = false)
    private boolean priority; // set when RM places this ON_HOLD, shown back to the customer

    private String ledgerTokenId;

    private String evidenceHash;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "PENDING_CONFIRMATION";
        }
    }
}
