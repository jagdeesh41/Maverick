package com.example.bankchain.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RecoveryRequestDto {

    @NotNull
    private Long userId;

    private String recoveryReason;
    private String verificationMethod;
    private String emergencyContact;
}
