package com.example.bankchain.service.storage;

import com.example.bankchain.exception.BusinessRuleException;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Every "proof" upload in the app (asset proof, KYC photo, transferee ID,
 * death certificate, recovery/inheritance documents) goes through here.
 * Only the returned object key is ever persisted in H2 - never the file
 * bytes or a base64 copy. The bucket ("maverick_gcs") is private, so
 * reads always go through a short-lived signed URL (signedUrl()),
 * generated fresh each time an entity carrying a key is returned to the
 * frontend - never stored, since it would expire.
 */
@Service
@RequiredArgsConstructor
public class GcsFileService {

    private final Storage storage;

    @Value("${gcs.bucket-name}")
    private String bucketName;

    @Value("${gcs.signed-url-ttl-minutes:15}")
    private long signedUrlTtlMinutes;

    /** Uploads a customer-submitted file under a random key and returns that key to persist. */
    public String upload(MultipartFile file, String category) {
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String safeName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
        String key = category + "/" + UUID.randomUUID() + "-" + safeName;
        try {
            uploadBytes(file.getBytes(), file.getContentType(), key);
        } catch (IOException e) {
            throw new BusinessRuleException("Could not read the uploaded file - please try again.");
        }
        return key;
    }

    /** Fixed-key upload used by DataSeeder to seed one shared placeholder image, reused across all demo rows. */
    public String uploadBytes(byte[] bytes, String contentType, String key) {
        BlobId blobId = BlobId.of(bucketName, key);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(contentType).build();
        storage.create(blobInfo, bytes);
        return key;
    }

    /** Short-lived V4 signed GET URL for a stored key - null if there's no key (nothing attached yet). */
    public String signedUrl(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(bucketName, key)).build();
        return storage.signUrl(blobInfo, signedUrlTtlMinutes, TimeUnit.MINUTES,
                Storage.SignUrlOption.withV4Signature()).toString();
    }
}
