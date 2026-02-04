package com.portfolio.backend.service;

import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.AssetRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class PortfolioService {

    private final AssetRepository assetRepository;
    private final PriceService priceService;
    private final PriceTargetService priceTargetService;

    @Value("${tax.ltcg.rate:0.15}")
    private BigDecimal ltcgRate;

    @Value("${tax.stcg.rate:0.30}")
    private BigDecimal stcgRate;

    @Value("${tax.ltcg.holdingDays:365}")
    private long ltcgHoldingDays;

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
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalLtcgTax = BigDecimal.ZERO;
        BigDecimal totalStcgTax = BigDecimal.ZERO;

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

            BigDecimal gainLoss = marketValue.subtract(cost);
            String capitalGainType = determineCapitalGainType(asset.getBuyDate());
            BigDecimal applicableRate = "LTCG".equals(capitalGainType) ? safeRate(ltcgRate) : safeRate(stcgRate);
            BigDecimal taxableGain = gainLoss.max(BigDecimal.ZERO);
            BigDecimal taxAmount = taxableGain.multiply(applicableRate).setScale(2, RoundingMode.HALF_UP);

            totalTax = totalTax.add(taxAmount);
            if ("LTCG".equals(capitalGainType)) {
                totalLtcgTax = totalLtcgTax.add(taxAmount);
            } else {
                totalStcgTax = totalStcgTax.add(taxAmount);
            }

            Map<String, Object> av = new HashMap<>();
            av.put("asset", asset);
            av.put("marketValue", marketValue);
            av.put("cost", cost);
            av.put("latestPrice", latestPrice != null ? latestPrice.getClosePrice() : null);
            av.put("gainLoss", gainLoss);
            av.put("capitalGainType", capitalGainType);
            av.put("holdingDays", holdingDays(asset.getBuyDate()));
            av.put("taxRate", applicableRate);
            av.put("taxAmount", taxAmount);
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
        result.put("totalTax", totalTax);
        result.put("totalLtcgTax", totalLtcgTax);
        result.put("totalStcgTax", totalStcgTax);
        result.put("alerts", alerts);

        return result;
    }

    private String determineCapitalGainType(LocalDate buyDate) {
        // If buyDate missing, default to STCG to be conservative.
        if (buyDate == null) return "STCG";
        long days = ChronoUnit.DAYS.between(buyDate, LocalDate.now());
        return days >= ltcgHoldingDays ? "LTCG" : "STCG";
    }

    private long holdingDays(LocalDate buyDate) {
        if (buyDate == null) return 0;
        long days = ChronoUnit.DAYS.between(buyDate, LocalDate.now());
        return Math.max(days, 0);
    }

    private BigDecimal safeRate(BigDecimal rate) {
        if (rate == null) return BigDecimal.ZERO;
        // Guardrails: clamp to [0, 1]
        if (rate.compareTo(BigDecimal.ZERO) < 0) return BigDecimal.ZERO;
        if (rate.compareTo(BigDecimal.ONE) > 0) return BigDecimal.ONE;
        return rate;
    }
}
