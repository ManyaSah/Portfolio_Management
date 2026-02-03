package com.portfolio.backend.service;

import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.AssetRepository;
import com.portfolio.backend.repo.StockPriceRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PortfolioServiceTest {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private StockPriceRepository stockPriceRepository;

    @Autowired
    private PortfolioService portfolioService;

    @Test
    void portfolioSummary_shouldContainTotals() {
        // Arrange
        Asset asset = new Asset();
        asset.setTicker("MSFT");
        asset.setQuantity(5);
        asset.setBuyPrice(new BigDecimal("200"));
        assetRepository.save(asset);

        StockPrice price = new StockPrice();
        price.setTicker("MSFT");
        price.setPriceDate(LocalDate.now());
        price.setClosePrice(new BigDecimal("220"));
        stockPriceRepository.save(price);

        // Act
        Map<String, Object> summary = portfolioService.getPortfolioSummary();

        // Assert
        assertNotNull(summary);
        assertTrue(summary.containsKey("totalValue"));
        assertTrue(summary.containsKey("totalCost"));
        assertTrue(summary.containsKey("totalProfit"));
        assertTrue(summary.containsKey("assets"));

        BigDecimal totalValue = (BigDecimal) summary.get("totalValue");
        BigDecimal totalCost = (BigDecimal) summary.get("totalCost");

        assertTrue(totalValue.compareTo(BigDecimal.ZERO) > 0);
        assertTrue(totalCost.compareTo(BigDecimal.ZERO) > 0);
    }
}
