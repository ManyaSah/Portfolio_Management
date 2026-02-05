package com.portfolio.backend.service;

import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.AssetRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class PortfolioService {

    // Tax rates
    private static final BigDecimal SHORT_TERM_TAX_RATE = new BigDecimal("0.22"); // 22%
    private static final BigDecimal LONG_TERM_TAX_RATE = new BigDecimal("0.15"); // 15%
    private static final int LONG_TERM_HOLDING_DAYS = 730; // 2 years = 730 days

    private final AssetRepository assetRepository;
    private final PriceService priceService;
    private final PriceTargetService priceTargetService;

    public PortfolioService(AssetRepository assetRepository,
                            PriceService priceService,
                            PriceTargetService priceTargetService) {
        this.assetRepository = assetRepository;
        this.priceService = priceService;
        this.priceTargetService = priceTargetService;
    }

    public Map<String, Object> getPortfolioSummary() {
        List<Asset> assets = assetRepository.findAll();

        BigDecimal totalValue = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalShortTermTax = BigDecimal.ZERO;
        BigDecimal totalLongTermTax = BigDecimal.ZERO;

        List<Map<String, Object>> assetViews = new ArrayList<>();

        for (Asset asset : assets) {
            StockPrice latestPrice = priceService.getLatestPriceForTicker(asset.getTicker());
            BigDecimal marketValue = BigDecimal.ZERO;
            if (latestPrice != null && latestPrice.getClosePrice() != null) {
                marketValue = latestPrice.getClosePrice().multiply(BigDecimal.valueOf(asset.getQuantity()));
            }

            BigDecimal cost = BigDecimal.ZERO;
            if (asset.getBuyPrice() != null) {
                cost = asset.getBuyPrice().multiply(BigDecimal.valueOf(asset.getQuantity()));
            }

            totalValue = totalValue.add(marketValue);
            totalCost = totalCost.add(cost);

            // Calculate tax liability for this asset
            BigDecimal unrealizedGain = marketValue.subtract(cost);
            BigDecimal taxLiability = BigDecimal.ZERO;
            String taxType = "N/A";
            long holdingDays = 0;

            if (asset.getBuyDate() != null && unrealizedGain.compareTo(BigDecimal.ZERO) > 0) {
                holdingDays = ChronoUnit.DAYS.between(asset.getBuyDate(), LocalDate.now());

                if (holdingDays >= LONG_TERM_HOLDING_DAYS) {
                    taxType = "LONG_TERM";
                    taxLiability = unrealizedGain.multiply(LONG_TERM_TAX_RATE);
                    totalLongTermTax = totalLongTermTax.add(taxLiability);
                } else {
                    taxType = "SHORT_TERM";
                    taxLiability = unrealizedGain.multiply(SHORT_TERM_TAX_RATE);
                    totalShortTermTax = totalShortTermTax.add(taxLiability);
                }
            }

            Map<String, Object> av = new HashMap<>();
            av.put("asset", asset);
            av.put("marketValue", marketValue);
            av.put("cost", cost);
            av.put("latestPrice", latestPrice != null ? latestPrice.getClosePrice() : null);
            av.put("unrealizedGain", unrealizedGain);
            av.put("taxLiability", taxLiability);
            av.put("taxType", taxType);
            av.put("holdingDays", holdingDays);
            assetViews.add(av);
        }

        BigDecimal totalProfit = totalValue.subtract(totalCost);
        BigDecimal totalTaxLiability = totalShortTermTax.add(totalLongTermTax);

        // Evaluate price targets and collect alerts (inline to avoid mismatch)
        List<String> alerts = new ArrayList<>();
        List<PriceTarget> targets = priceTargetService.getActiveTargets();
        for (PriceTarget t : targets) {
            var sp = priceService.getLatestPriceForTicker(t.getTicker());
            if (sp == null || sp.getClosePrice() == null) continue;

            int cmp = sp.getClosePrice().compareTo(t.getTargetPrice());
            boolean triggered;
            if ("BUY".equalsIgnoreCase(t.getAction())) {
                triggered = cmp <= 0;
            } else {
                triggered = cmp >= 0;
            }

            if (triggered) {
                t.setTriggered(true);
                priceTargetService.saveTarget(t);
                String msg = String.format("Target %s %s hit: current %s target %s",
                        t.getTicker(), t.getAction(), sp.getClosePrice().toPlainString(), t.getTargetPrice().toPlainString());
                alerts.add(msg);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("assets", assetViews);
        result.put("totalValue", totalValue);
        result.put("totalCost", totalCost);
        result.put("totalProfit", totalProfit);
        result.put("totalTaxLiability", totalTaxLiability);
        result.put("shortTermTax", totalShortTermTax);
        result.put("longTermTax", totalLongTermTax);
        result.put("alerts", alerts);

        return result;
    }
}
