package com.portfolio.backend.service;

import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.repo.AssetRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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
        return repository.save(asset);
    }

    public void sellAsset(String ticker, int quantityToSell) {
        if (quantityToSell <= 0) {
            throw new IllegalArgumentException("Sell quantity must be greater than 0");
        }

        List<Asset> lots = repository.findByTickerOrderByBuyDateAsc(ticker);
        int remaining = quantityToSell;

        for (Asset lot : lots) {
            if (remaining <= 0) break;

            int lotQty = lot.getQuantity();
            if (lotQty <= remaining) {
                remaining -= lotQty;
                repository.deleteById(lot.getId());
            } else {
                lot.setQuantity(lotQty - remaining);
                repository.save(lot);
                remaining = 0;
            }
        }

        if (remaining > 0) {
            throw new IllegalArgumentException("Not enough shares to sell");
        }
    }

    public void deleteAsset(Long id) {
        repository.deleteById(id);
    }
}
