package com.example.bankchain.repository;

import com.example.bankchain.entity.InheritancePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InheritancePolicyRepository extends JpaRepository<InheritancePolicy, Long> {
    Optional<InheritancePolicy> findByAssetId(Long assetId);
}
