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

    @Lob
    private String proofPhotoBase64;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED
}
