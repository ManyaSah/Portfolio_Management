package com.portfolio.backend.service;

import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.AssetRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
public class PortfolioService {

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

            Map<String, Object> av = new HashMap<>();
            av.put("asset", asset);
            av.put("marketValue", marketValue);
            av.put("cost", cost);
            av.put("latestPrice", latestPrice != null ? latestPrice.getClosePrice() : null);
            assetViews.add(av);
        }

        BigDecimal totalProfit = totalValue.subtract(totalCost);

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
        result.put("alerts", alerts);

        return result;
    }
}
