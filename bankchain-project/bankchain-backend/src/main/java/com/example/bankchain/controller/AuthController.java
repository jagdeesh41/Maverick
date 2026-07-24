package com.example.bankchain.controller;

import com.example.bankchain.dto.ApiResponse;
import com.example.bankchain.dto.LoginRequest;
import com.example.bankchain.dto.LoginResponse;
import com.example.bankchain.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    /**
     * Mocked login/MFA. Maps to the "Access type" dropdown in the UI
     * (Customer / Relationship Manager / Legal-Executor / Compliance-Audit).
     * No password check - role + username is enough to resolve/create the user.
     */
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Login successful (MFA + KYC mocked)", userService.login(request));
    }
}
