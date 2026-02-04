package com.portfolio.backend.service;

import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.repo.AssetRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
public class AssetService {

    private final AssetRepository repository;

    public AssetService(AssetRepository repository) {
        this.repository = repository;
    }

    public List<Asset> getAllAssets() {
        return repository.findAll();
    }

    public Asset addAsset(Asset asset) {
        // Check if asset with same ticker already exists
        Optional<Asset> existing = repository.findAll().stream()
                .filter(a -> a.getTicker().equals(asset.getTicker()))
                .findFirst();

        if (existing.isPresent()) {
            Asset existingAsset = existing.get();
            // Update quantity and average buy price
            int newQuantity = existingAsset.getQuantity() + asset.getQuantity();
            BigDecimal totalCost = existingAsset.getBuyPrice().multiply(BigDecimal.valueOf(existingAsset.getQuantity()))
                    .add(asset.getBuyPrice().multiply(BigDecimal.valueOf(asset.getQuantity())));
            BigDecimal averagePrice = totalCost.divide(BigDecimal.valueOf(newQuantity), 2, RoundingMode.HALF_UP);

            existingAsset.setQuantity(newQuantity);
            existingAsset.setBuyPrice(averagePrice);
            // Keep the earliest buy date
            if (asset.getBuyDate() != null && (existingAsset.getBuyDate() == null || asset.getBuyDate().isBefore(existingAsset.getBuyDate()))) {
                existingAsset.setBuyDate(asset.getBuyDate());
            }
            return repository.save(existingAsset);
        } else {
            return repository.save(asset);
        }
    }

    public void deleteAsset(Long id) {
        repository.deleteById(id);
    }
}
