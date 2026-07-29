package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycQueueItemResponse {
    private Long userId;
    private String username;
    private String fullName;
    private String documentType;
    private String documentNumber;
    private String proofPhotoUrl;
    private String status;
}
