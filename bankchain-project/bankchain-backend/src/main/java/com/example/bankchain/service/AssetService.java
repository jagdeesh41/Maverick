package com.example.bankchain.service;

import com.example.bankchain.dto.AssetResponse;
import com.example.bankchain.dto.IssueAssetRequest;
import com.example.bankchain.entity.Asset;
import com.example.bankchain.entity.User;
import com.example.bankchain.exception.ResourceNotFoundException;
import com.example.bankchain.repository.AssetRepository;
import com.example.bankchain.service.ledger.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final UserService userService;
    private final LedgerService ledgerService; // MockGCULAdapter injected here

    public AssetResponse issueAsset(IssueAssetRequest request) {
        User owner = userService.getUserOrThrow(request.getOwnerId());

        Asset asset = Asset.builder()
                .owner(owner)
                .assetType(request.getAssetType())
                .assetValue(request.getAssetValue())
                .ownershipUnits(request.getOwnershipUnits())
                .policyTemplate(request.getPolicyTemplate())
                .nominee(request.getNominee())
                .status("ACTIVE")
                .evidenceHash("Qm" + UUID.randomUUID().toString().replace("-", "").substring(0, 8))
                .build();

        // Mint on the (mocked) ledger - this is the "Mint Token" step in the UI
        String tokenId = ledgerService.mint(null, request.getAssetValue(), request.getOwnershipUnits());
        asset.setLedgerTokenId(tokenId);

        Asset saved = assetRepository.save(asset);
        return toResponse(saved);
    }

    public List<AssetResponse> getAssetsForOwner(Long ownerId) {
        return assetRepository.findByOwnerId(ownerId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public AssetResponse getAssetDetails(Long assetId) {
        Asset asset = getAssetOrThrow(assetId);
        return toResponse(asset);
    }

    public List<AssetResponse> getAllAssets() {
        return assetRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Asset getAssetOrThrow(Long assetId) {
        return assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found: " + assetId));
    }

    public void freezeAsset(Long assetId) {
        Asset asset = getAssetOrThrow(assetId);
        asset.setStatus("FROZEN");
        assetRepository.save(asset);
        ledgerService.freeze(asset.getLedgerTokenId());
    }

    public void unfreezeAsset(Long assetId) {
        Asset asset = getAssetOrThrow(assetId);
        asset.setStatus("ACTIVE");
        assetRepository.save(asset);
        ledgerService.unfreeze(asset.getLedgerTokenId());
    }

    private AssetResponse toResponse(Asset asset) {
        return AssetResponse.builder()
                .id(asset.getId())
                .assetType(asset.getAssetType())
                .assetValue(asset.getAssetValue())
                .ownershipUnits(asset.getOwnershipUnits())
                .policyTemplate(asset.getPolicyTemplate())
                .nominee(asset.getNominee())
                .status(asset.getStatus())
                .ledgerTokenId(asset.getLedgerTokenId())
                .evidenceHash(asset.getEvidenceHash())
                .ownerName(asset.getOwner().getFullName())
                .createdAt(asset.getCreatedAt())
                .build();
    }
}
