package com.example.bankchain.repository;

import com.example.bankchain.entity.RecoveryRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecoveryRequestRepository extends JpaRepository<RecoveryRequest, Long> {
    List<RecoveryRequest> findByUserId(Long userId);
}
