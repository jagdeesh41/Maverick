package com.example.bankchain.repository;

import com.example.bankchain.entity.PropertyClaim;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PropertyClaimRepository extends JpaRepository<PropertyClaim, Long> {
    List<PropertyClaim> findByAssetId(Long assetId);
    List<PropertyClaim> findByAssetIdAndStatus(Long assetId, String status);
    List<PropertyClaim> findByClaimantId(Long claimantId);
    List<PropertyClaim> findAllByOrderByCreatedAtDesc();
}
