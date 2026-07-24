package com.example.bankchain.service;

import com.example.bankchain.dto.LoginRequest;
import com.example.bankchain.dto.LoginResponse;
import com.example.bankchain.entity.Role;
import com.example.bankchain.entity.User;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    /**
     * Mocked login: no password check. If the username exists, log them in
     * as that user. If not, auto-create a user with the chosen role so the
     * demo never blocks on "user doesn't exist".
     */
    public LoginResponse login(LoginRequest request) {
        Role role = Role.valueOf(request.getRole().toUpperCase());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseGet(() -> userRepository.save(User.builder()
                        .username(request.getUsername())
                        .fullName(request.getUsername())
                        .role(role)
                        .enabled(true)
                        .build()));

        auditService.log("Customer login", "IAM", "Success", "MFA verified (mocked)");

        return LoginResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .verifiedCustomer(true)
                .build();
    }

    public User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }
}
