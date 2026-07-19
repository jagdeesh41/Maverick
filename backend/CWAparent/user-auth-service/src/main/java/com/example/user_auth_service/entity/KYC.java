package com.example.user_auth_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class KYC {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String documentType; // e.g., Passport, Driver's License

    @Column(nullable = false)
    private String documentNumber;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED
}
