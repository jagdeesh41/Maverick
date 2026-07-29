package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean enabled;

    // BCrypt hash, never the raw password. Set on first login for a new
    // username (auto-provision) and checked on every login after that.
    @Column(nullable = false)
    private String password;

    // Universal Ledger account alias for this user (e.g. "customer-42"), provisioned
    // on demand (Cloud KMS key + accounts create) the first time this user needs to
    // hold balance/kyc_approved on a contract. Null until then - see UserService.ensureLedgerAccount.
    private String ledgerAccountAlias;
}
