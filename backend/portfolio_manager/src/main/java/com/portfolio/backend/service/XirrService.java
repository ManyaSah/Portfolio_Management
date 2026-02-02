package com.portfolio.backend.service;

import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.AssetRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

@Service
public class XirrService {

    private final AssetRepository assetRepository;
    private final PriceService priceService;

    public XirrService(AssetRepository assetRepository, PriceService priceService) {
        this.assetRepository = assetRepository;
        this.priceService = priceService;
    }

    /**
     * Compute annualized return percentage for a single ticker using stored prices.
     * We consider total buy cost (sum of buys) and a single current value (latest stored price).
     * Return value is percent (e.g. 12.34 means 12.34%).
     */
    public Double computeXirrForTicker(String ticker) {
        List<Asset> assets = assetRepository.findAll();

        BigDecimal totalQuantity = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        LocalDate earliestBuy = null;

        for (Asset a : assets) {
            if (!ticker.equals(a.getTicker())) continue;
            totalQuantity = totalQuantity.add(BigDecimal.valueOf(a.getQuantity()));
            if (a.getBuyPrice() != null) {
                totalCost = totalCost.add(a.getBuyPrice().multiply(BigDecimal.valueOf(a.getQuantity())));
            }
            if (a.getBuyDate() != null) {
                if (earliestBuy == null || a.getBuyDate().isBefore(earliestBuy)) {
                    earliestBuy = a.getBuyDate();
                }
            }
        }

        if (totalQuantity.compareTo(BigDecimal.ZERO) == 0 || totalCost.compareTo(BigDecimal.ZERO) == 0 || earliestBuy == null) {
            return null;
        }

        StockPrice latest = priceService.getLatestPriceForTicker(ticker);
        if (latest == null || latest.getClosePrice() == null) return null;

        BigDecimal currentValue = latest.getClosePrice().multiply(totalQuantity);

        // Simple annualized return: ((current / cost)^(1/years)) - 1
        double years = Math.max(1.0 / 365.0, Duration.between(earliestBuy.atStartOfDay(), LocalDate.now().atStartOfDay()).toDays() / 365.0);
        double ratio = currentValue.divide(totalCost, 10, RoundingMode.HALF_UP).doubleValue();
        double annualized = Math.pow(ratio, 1.0 / years) - 1.0;

        return annualized * 100.0;
    }
}
