package com.example.bankchain.service;

import com.example.bankchain.dto.LoginRequest;
import com.example.bankchain.dto.LoginResponse;
import com.example.bankchain.entity.Role;
import com.example.bankchain.entity.User;
import com.example.bankchain.exception.BusinessRuleException;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.UserRepository;
import com.example.bankchain.service.ledger.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessionService;
    private final LedgerService ledgerService;

    /**
     * First login for a brand-new username provisions it with the password
     * given right then (so the demo never blocks on "user doesn't exist").
     * Every login after that must match the stored (hashed) password, and a
     * successful login returns a bearer token that AuthInterceptor checks
     * on every /customer/** and /rm/** call from here on.
     */
    public LoginResponse login(LoginRequest request) {
        Role role = Role.valueOf(request.getRole().toUpperCase());

        User user = userRepository.findByUsername(request.getUsername()).orElse(null);
        boolean newlyProvisioned = false;

        if (user == null) {
            try {
                user = userRepository.save(User.builder()
                        .username(request.getUsername())
                        .fullName(request.getUsername())
                        .role(role)
                        .password(passwordEncoder.encode(request.getPassword()))
                        .enabled(true)
                        .build());
                newlyProvisioned = true;
            } catch (DataIntegrityViolationException raceLoss) {
                // Someone else (e.g. DataSeeder on a cold start, or a concurrent
                // request for the same brand-new username) inserted this row
                // between our findByUsername() and save() - re-fetch and fall
                // through to the normal password check instead of failing.
                user = userRepository.findByUsername(request.getUsername())
                        .orElseThrow(() -> raceLoss);
            }
        }

        if (!newlyProvisioned && !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            auditService.log("Customer login", "IAM", "Blocked", "Invalid password for " + request.getUsername());
            throw new BusinessRuleException("Invalid username or password.");
        }

        String token = sessionService.createSession(user.getId(), user.getUsername(), user.getRole());

        auditService.log("Customer login", "IAM", "Success", "MFA verified (mocked)");

        return LoginResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .verifiedCustomer(true)
                .token(token)
                .build();
    }

    public User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    /**
     * Provisions this user a Universal Ledger account the first time they
     * need one (issuing an asset, buying in a transfer, filing/being a
     * claimant) - a Cloud KMS signing key + accounts create, see
     * GculLedgerAdapter.provisionAccount. Idempotent: does nothing once
     * User.ledgerAccountAlias is already set.
     */
    public User ensureLedgerAccount(User user) {
        if (user.getLedgerAccountAlias() != null) {
            return user;
        }
        String alias = ledgerService.provisionAccount("customer-" + user.getId());
        user.setLedgerAccountAlias(alias);
        return userRepository.save(user);
    }
}
