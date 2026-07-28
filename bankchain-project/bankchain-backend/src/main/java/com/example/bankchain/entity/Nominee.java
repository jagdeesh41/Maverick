package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * One row per nominee on an inheritance policy - as many as needed
 * (not capped at 2), as long as their allocations sum to <= 100%.
 */
@Entity
@Table(name = "nominees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Nominee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "policy_id", nullable = false)
    private InheritancePolicy policy;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String relation; // SPOUSE, CHILD, PARENT, SIBLING, OTHER

    @Column(nullable = false)
    private Integer allocationPercent;

    private String proofType;  // ACCOUNT_NUMBER or ID_NUMBER
    private String proofValue;
}
