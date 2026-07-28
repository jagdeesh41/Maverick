package com.example.bankchain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String username;

    // Role the user picked from the "Access type" dropdown in the UI.
    @NotBlank
    private String role; // CUSTOMER, RM, LEGAL, COMPLIANCE

    // First login for a brand-new username provisions this as its password;
    // every login after that must match it (see UserService.login).
    @NotBlank
    private String password;
}
