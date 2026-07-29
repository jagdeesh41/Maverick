package com.example.bankchain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** The GCS object key to send back in the actual form submission - never the file bytes again. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {
    private String key;
}
