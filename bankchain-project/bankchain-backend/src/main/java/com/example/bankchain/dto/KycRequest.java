package com.example.bankchain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KycRequest {

    @NotNull
    private Long userId;

    @NotBlank
    private String documentType;   // Passport, Driver's License...

    @NotBlank
    private String documentNumber;
}
