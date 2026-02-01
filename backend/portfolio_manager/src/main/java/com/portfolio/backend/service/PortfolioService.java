package com.portfolio.backend.service;

import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.AssetRepository;
import com.portfolio.backend.repo.StockPriceRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PortfolioService {

    private final AssetRepository assetRepository;
    private final StockPriceRepository stockPriceRepository;

    public PortfolioService(AssetRepository assetRepository,
                            StockPriceRepository stockPriceRepository) {
        this.assetRepository = assetRepository;
        this.stockPriceRepository = stockPriceRepository;
    }

    public BigDecimal calculateTotalPortfolioValue() {

        List<Asset> assets = assetRepository.findAll();
        BigDecimal totalValue = BigDecimal.ZERO;

        for (Asset asset : assets) {
            StockPrice latestPrice =
                    stockPriceRepository.findLatestPrice(asset.getTicker());

            if (latestPrice != null) {
                BigDecimal assetValue =
                        latestPrice.getClosePrice()
                                .multiply(BigDecimal.valueOf(asset.getQuantity()));

                totalValue = totalValue.add(assetValue);
            }
        }

        return totalValue;
    }
}
