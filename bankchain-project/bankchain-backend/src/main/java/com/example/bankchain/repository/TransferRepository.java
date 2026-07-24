package com.example.bankchain.repository;

import com.example.bankchain.entity.Transfer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransferRepository extends JpaRepository<Transfer, Long> {
    List<Transfer> findByAssetId(Long assetId);
    List<Transfer> findByStatus(String status);
}
