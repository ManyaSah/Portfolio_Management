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

    public void deleteAsset(Long id) {
        repository.deleteById(id);
    }
}
