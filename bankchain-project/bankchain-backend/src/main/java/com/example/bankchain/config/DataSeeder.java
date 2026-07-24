package com.example.bankchain.config;

import com.example.bankchain.entity.Asset;
import com.example.bankchain.entity.Role;
import com.example.bankchain.entity.User;
import com.example.bankchain.repository.AssetRepository;
import com.example.bankchain.repository.UserRepository;
import com.example.bankchain.service.ledger.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final LedgerService ledgerService;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Override
    public void run(String... args) {
        if (!seedEnabled || userRepository.count() > 0) {
            return;
        }

        User customer = userRepository.save(User.builder()
                .username("priyal")
                .fullName("Priyal Agarwal")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build());

        userRepository.save(User.builder()
                .username("rm.admin")
                .fullName("RM Admin")
                .role(Role.RM)
                .enabled(true)
                .build());

        // Mocked-only profiles, seeded so the "Access type" dropdown always resolves
        userRepository.save(User.builder()
                .username("legal.exec")
                .fullName("Legal Executor")
                .role(Role.LEGAL)
                .enabled(true)
                .build());

        userRepository.save(User.builder()
                .username("compliance.audit")
                .fullName("Compliance Auditor")
                .role(Role.COMPLIANCE)
                .enabled(true)
                .build());

        // One demo asset so "My Assets" / "Dashboard" aren't empty on first run
        String tokenId = ledgerService.mint(null, new BigDecimal("500000"), 1000);
        assetRepository.save(Asset.builder()
                .owner(customer)
                .assetType("Fixed Deposit")
                .assetValue(new BigDecimal("500000"))
                .ownershipUnits(1000)
                .policyTemplate("Maturity lock + nominee + payout")
                .nominee("Rahul Sharma")
                .status("ACTIVE")
                .ledgerTokenId(tokenId)
                .evidenceHash("Qm" + UUID.randomUUID().toString().replace("-", "").substring(0, 8))
                .build());
    }
}
