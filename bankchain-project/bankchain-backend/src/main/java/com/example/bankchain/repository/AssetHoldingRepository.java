package com.example.bankchain.repository;

import com.example.bankchain.entity.AssetHolding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssetHoldingRepository extends JpaRepository<AssetHolding, Long> {
    List<AssetHolding> findByHolderId(Long holderId);
    List<AssetHolding> findByAssetId(Long assetId);
    Optional<AssetHolding> findByAssetIdAndHolderId(Long assetId, Long holderId);
}
