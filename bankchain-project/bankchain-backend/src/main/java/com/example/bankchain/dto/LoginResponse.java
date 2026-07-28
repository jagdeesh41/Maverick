package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private Long userId;
    private String username;
    private String fullName;
    private String role;
    private boolean verifiedCustomer;

    // Bearer token for this session - send it back as "Authorization: Bearer <token>"
    // on every /customer/** and /rm/** call (see AuthInterceptor).
    private String token;
}
