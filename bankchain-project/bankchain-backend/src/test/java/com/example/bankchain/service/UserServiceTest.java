package com.example.bankchain.service;

import com.example.bankchain.dto.LoginRequest;
import com.example.bankchain.dto.LoginResponse;
import com.example.bankchain.entity.Role;
import com.example.bankchain.entity.User;
import com.example.bankchain.exception.BusinessRuleException;
import com.example.bankchain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Covers the login/password behaviour added when the auth gate went in:
 * a brand-new username provisions itself with whatever password it logs
 * in with, and every login after that must match the stored hash.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private AuditService auditService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private SessionService sessionService;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, auditService, passwordEncoder, sessionService);
    }

    @Test
    void newUsernameIsProvisionedWithGivenPassword() {
        LoginRequest request = new LoginRequest();
        request.setUsername("newuser");
        request.setRole("CUSTOMER");
        request.setPassword("myPassword1");

        when(userRepository.findByUsername("newuser")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("myPassword1")).thenReturn("hashed-pw");
        User saved = User.builder().id(1L).username("newuser").fullName("newuser")
                .role(Role.CUSTOMER).password("hashed-pw").enabled(true).build();
        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(sessionService.createSession(1L, "newuser", Role.CUSTOMER)).thenReturn("token-123");

        LoginResponse response = userService.login(request);

        assertThat(response.getToken()).isEqualTo("token-123");
        assertThat(response.getUsername()).isEqualTo("newuser");
        verify(passwordEncoder).encode("myPassword1");
    }

    @Test
    void existingUsernameWithCorrectPasswordLogsIn() {
        LoginRequest request = new LoginRequest();
        request.setUsername("priyal");
        request.setRole("CUSTOMER");
        request.setPassword("Passw0rd1");

        User existing = User.builder().id(1L).username("priyal").fullName("Priyal Agarwal")
                .role(Role.CUSTOMER).password("hashed-existing").enabled(true).build();
        when(userRepository.findByUsername("priyal")).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("Passw0rd1", "hashed-existing")).thenReturn(true);
        when(sessionService.createSession(1L, "priyal", Role.CUSTOMER)).thenReturn("token-456");

        LoginResponse response = userService.login(request);

        assertThat(response.getToken()).isEqualTo("token-456");
        verify(userRepository, never()).save(any());
    }

    @Test
    void existingUsernameWithWrongPasswordIsRejected() {
        LoginRequest request = new LoginRequest();
        request.setUsername("priyal");
        request.setRole("CUSTOMER");
        request.setPassword("wrong-password");

        User existing = User.builder().id(1L).username("priyal").fullName("Priyal Agarwal")
                .role(Role.CUSTOMER).password("hashed-existing").enabled(true).build();
        when(userRepository.findByUsername("priyal")).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("wrong-password", "hashed-existing")).thenReturn(false);

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Invalid username or password");

        verify(sessionService, never()).createSession(any(), any(), any());
    }
}
