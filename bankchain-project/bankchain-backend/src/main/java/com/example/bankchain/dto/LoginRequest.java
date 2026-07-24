package com.example.bankchain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String username;

    // Role the user picked from the "Access type" dropdown in the UI.
    // No password is checked - this is a mocked-auth hackathon build.
    @NotBlank
    private String role; // CUSTOMER, RM, LEGAL, COMPLIANCE
}
