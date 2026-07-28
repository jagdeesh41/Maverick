package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inheritance_policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InheritancePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "asset_id", nullable = false, unique = true)
    private Asset asset;

    // AFTER_DEATH, AFTER_AGE_70, AFTER_MATURITY
    private String triggerCondition;

    @OneToMany(mappedBy = "policy", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Nominee> nominees = new ArrayList<>();

    // Computed at save time: 100 - sum(nominee allocations). What the
    // issuer keeps for themselves until the trigger condition is met.
    private Integer selfRetainedPercent;

    @Lob
    private String proofDocumentBase64;

    private String disputeAction;

    private String contractHash; // immutable record, regenerated each time the policy is saved

    @Column(nullable = false)
    private String status; // ACTIVE, TRIGGERED, DISPUTED
}
