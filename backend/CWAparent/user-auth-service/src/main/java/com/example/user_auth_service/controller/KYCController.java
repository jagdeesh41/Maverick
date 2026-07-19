package com.example.user_auth_service.controller;

import com.example.user_auth_service.entity.KYC;
import com.example.user_auth_service.entity.User;
import com.example.user_auth_service.repository.KYCRepository;
import com.example.user_auth_service.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/kyc")
public class KYCController {

    @Autowired
    private KYCRepository kycRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<String> submitKYC(@RequestBody KYC kyc) {
        kyc.setStatus("PENDING");
        kycRepository.save(kyc);
        return ResponseEntity.ok("KYC submitted successfully");
    }

    @GetMapping("/{userId}")
    public ResponseEntity<KYC> getKYC(@PathVariable Long userId) {
        Optional<KYC> kyc = kycRepository.findById(userId);
        return kyc.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.status(404).build());
    }

    @PutMapping("/approve")
    public ResponseEntity<String> approveKYC(@RequestParam Long kycId) {
        Optional<KYC> kyc = kycRepository.findById(kycId);
        if (kyc.isPresent()) {
            KYC existingKYC = kyc.get();
            existingKYC.setStatus("APPROVED");
            kycRepository.save(existingKYC);
            return ResponseEntity.ok("KYC approved");
        }
        return ResponseEntity.status(404).body("KYC not found");
    }

    @PutMapping("/reject")
    public ResponseEntity<String> rejectKYC(@RequestParam Long kycId) {
        Optional<KYC> kyc = kycRepository.findById(kycId);
        if (kyc.isPresent()) {
            KYC existingKYC = kyc.get();
            existingKYC.setStatus("REJECTED");
            kycRepository.save(existingKYC);
            return ResponseEntity.ok("KYC rejected");
        }
        return ResponseEntity.status(404).body("KYC not found");
    }
}
