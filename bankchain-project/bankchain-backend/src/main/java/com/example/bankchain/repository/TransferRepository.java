package com.example.bankchain.repository;

import com.example.bankchain.entity.Transfer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransferRepository extends JpaRepository<Transfer, Long> {
    List<Transfer> findByAssetId(Long assetId);
    List<Transfer> findByStatus(String status);
    List<Transfer> findBySellerIdAndStatus(Long sellerId, String status);
    List<Transfer> findByBuyerCustomerIdAndStatus(String buyerCustomerId, String status);
    List<Transfer> findBySellerId(Long sellerId);
    List<Transfer> findByBuyerCustomerId(String buyerCustomerId);
}
