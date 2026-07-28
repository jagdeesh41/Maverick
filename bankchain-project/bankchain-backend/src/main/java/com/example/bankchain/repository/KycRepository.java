package com.example.bankchain.repository;

import com.example.bankchain.entity.Kyc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface KycRepository extends JpaRepository<Kyc, Long> {
    Optional<Kyc> findByUserId(Long userId);
    List<Kyc> findByStatus(String status);
}
