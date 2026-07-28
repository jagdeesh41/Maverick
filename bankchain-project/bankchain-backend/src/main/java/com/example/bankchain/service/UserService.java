package com.example.bankchain.service;

import com.example.bankchain.dto.LoginRequest;
import com.example.bankchain.dto.LoginResponse;
import com.example.bankchain.entity.Role;
import com.example.bankchain.entity.User;
import com.example.bankchain.exception.BusinessRuleException;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessionService;

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

        if (user == null) {
            user = userRepository.save(User.builder()
                    .username(request.getUsername())
                    .fullName(request.getUsername())
                    .role(role)
                    .password(passwordEncoder.encode(request.getPassword()))
                    .enabled(true)
                    .build());
        } else if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
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
}
