package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kyc")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kyc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String documentType;

    @Column(nullable = false)
    private String documentNumber;

    // GCS object key for the KYC proof photo - never the file itself.
    private String proofPhotoKey;

    // Signed read URL, populated at read time from proofPhotoKey - never persisted.
    @Transient
    private String proofPhotoUrl;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED
}
