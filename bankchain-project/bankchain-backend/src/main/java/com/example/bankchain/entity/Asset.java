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
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String assetType; // Fixed Deposit, Real Estate, Corporate Bond...

    @Column(nullable = false)
    private BigDecimal assetValue;

    @Column(nullable = false)
    private Integer ownershipUnits;

    private String policyTemplate; // "Maturity lock + nominee + payout"

    private String nominee;

    @Column(nullable = false)
    private String status; // ACTIVE, PLEDGED, FROZEN

    private String ledgerTokenId;  // returned by LedgerService.mint()

    private String evidenceHash;   // fake vault/document hash

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "ACTIVE";
        }
    }
}
