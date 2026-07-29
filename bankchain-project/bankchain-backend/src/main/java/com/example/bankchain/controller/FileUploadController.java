package com.example.bankchain.controller;

import com.example.bankchain.dto.ApiResponse;
import com.example.bankchain.dto.FileUploadResponse;
import com.example.bankchain.service.storage.GcsFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Every FileUpload.jsx picker calls this the moment a file is chosen -
 * uploads straight to GCS and hands back the object key, which is what
 * every other form (issue asset, KYC, transfer, claim, recovery,
 * inheritance) actually submits. Sits under /customer/** so it's covered
 * by AuthInterceptor like every other customer-facing endpoint.
 */
@RestController
@RequestMapping("/customer/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final GcsFileService gcsFileService;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ApiResponse<FileUploadResponse> upload(@RequestParam("file") MultipartFile file,
                                                   @RequestParam("category") String category) {
        String key = gcsFileService.upload(file, category);
        return ApiResponse.ok(new FileUploadResponse(key));
    }
}
