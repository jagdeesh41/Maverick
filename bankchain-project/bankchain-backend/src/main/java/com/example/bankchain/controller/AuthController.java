package com.example.bankchain.controller;

import com.example.bankchain.dto.ApiResponse;
import com.example.bankchain.dto.LoginRequest;
import com.example.bankchain.dto.LoginResponse;
import com.example.bankchain.service.SessionService;
import com.example.bankchain.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final SessionService sessionService;

    /**
     * Mocked MFA/KYC, but the password itself is real: first login for a
     * username sets it, every login after that must match (UserService.login).
     * Maps to the "Access type" dropdown in the UI (Customer / RM / Legal / Compliance).
     */
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Login successful (MFA + KYC mocked)", userService.login(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            sessionService.invalidate(authHeader.substring(7));
        }
        return ApiResponse.ok("Logged out", null);
    }
}
