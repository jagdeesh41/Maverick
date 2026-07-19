package com.example.user_auth_service.repository;

import com.example.user_auth_service.entity.KYC;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KYCRepository extends JpaRepository<KYC, Long> {
}
