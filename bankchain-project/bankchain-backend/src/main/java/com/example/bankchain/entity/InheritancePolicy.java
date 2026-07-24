package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

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

    private String primaryNominee;
    private Integer primaryAllocation; // percentage

    private String secondaryNominee;
    private Integer secondaryAllocation; // percentage

    private String triggerCondition; // "Verified death certificate + probate approval"
    private String disputeAction;    // "Temporary freeze"

    @Column(nullable = false)
    private String status; // ACTIVE, TRIGGERED
}
