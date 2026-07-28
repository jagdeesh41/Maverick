package com.example.bankchain.repository;

import com.example.bankchain.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {
    List<Asset> findByIssuerId(Long issuerId);
    List<Asset> findByStatus(String status);
    java.util.Optional<Asset> findByLedgerTokenId(String ledgerTokenId);
}
