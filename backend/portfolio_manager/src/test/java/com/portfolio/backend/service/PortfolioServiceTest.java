package com.portfolio.backend.service;

import com.portfolio.backend.TestUtils;
import com.portfolio.backend.entity.Asset;
import com.portfolio.backend.entity.PriceTarget;
import com.portfolio.backend.entity.StockPrice;
import com.portfolio.backend.repo.AssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class PortfolioServiceTest {

    @InjectMocks
    private PortfolioService portfolioService;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private PriceService priceService;

    @Mock
    private PriceTargetService priceTargetService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetPortfolioSummary() {
        Asset asset1 = new Asset();
        TestUtils.setId(asset1, 1L);
        asset1.setTicker("AAPL");
        asset1.setQuantity(10);
        asset1.setBuyPrice(new BigDecimal("150.00"));
        asset1.setBuyDate(LocalDate.now().minusDays(100));

        Asset asset2 = new Asset();
        TestUtils.setId(asset2, 2L);
        asset2.setTicker("GOOGL");
        asset2.setQuantity(5);
        asset2.setBuyPrice(new BigDecimal("2500.00"));
        asset2.setBuyDate(LocalDate.now().minusDays(800));

        List<Asset> assets = Arrays.asList(asset1, asset2);

        StockPrice price1 = new StockPrice();
        price1.setTicker("AAPL");
        price1.setClosePrice(new BigDecimal("160.00"));
        price1.setPriceDate(LocalDate.now());

        StockPrice price2 = new StockPrice();
        price2.setTicker("GOOGL");
        price2.setClosePrice(new BigDecimal("2600.00"));
        price2.setPriceDate(LocalDate.now());

        when(assetRepository.findAll()).thenReturn(assets);
        when(priceService.getLatestPriceForTicker("AAPL")).thenReturn(price1);
        when(priceService.getLatestPriceForTicker("GOOGL")).thenReturn(price2);
        when(priceTargetService.getActiveTargets()).thenReturn(Arrays.asList());
        when(priceTargetService.saveTarget(any(PriceTarget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> summary = portfolioService.getPortfolioSummary();

        assertNotNull(summary);
        assertTrue(summary.containsKey("assets"));
        assertTrue(summary.containsKey("totalValue"));
        assertTrue(summary.containsKey("totalCost"));
        assertTrue(summary.containsKey("totalProfit"));
        assertTrue(summary.containsKey("totalTaxLiability"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> assetViews = (List<Map<String, Object>>) summary.get("assets");
        assertEquals(2, assetViews.size());

        BigDecimal totalValue = (BigDecimal) summary.get("totalValue");
        BigDecimal totalCost = (BigDecimal) summary.get("totalCost");
        assertTrue(totalValue.compareTo(BigDecimal.ZERO) > 0);
        assertTrue(totalCost.compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    public void testGetPortfolioSummaryWithPriceTargets() {
        Asset asset = new Asset();
        TestUtils.setId(asset, 1L);
        asset.setTicker("AAPL");
        asset.setQuantity(10);
        asset.setBuyPrice(new BigDecimal("150.00"));
        asset.setBuyDate(LocalDate.now().minusDays(100));

        StockPrice price = new StockPrice();
        price.setTicker("AAPL");
        price.setClosePrice(new BigDecimal("200.00"));
        price.setPriceDate(LocalDate.now());

        PriceTarget target = new PriceTarget();
        TestUtils.setId(target, 1L);
        target.setTicker("AAPL");
        target.setTargetPrice(new BigDecimal("200.00"));
        target.setAction("SELL");
        target.setTriggered(false);

        when(assetRepository.findAll()).thenReturn(Arrays.asList(asset));
        when(priceService.getLatestPriceForTicker("AAPL")).thenReturn(price);
        when(priceTargetService.getActiveTargets()).thenReturn(Arrays.asList(target));
        when(priceTargetService.saveTarget(any(PriceTarget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> summary = portfolioService.getPortfolioSummary();

        assertNotNull(summary);
        @SuppressWarnings("unchecked")
        List<String> alerts = (List<String>) summary.get("alerts");
        assertNotNull(alerts);
        assertTrue(alerts.size() > 0);
    }

    @Test
    public void testGetPortfolioSummaryNoAssets() {
        when(assetRepository.findAll()).thenReturn(Arrays.asList());
        when(priceTargetService.getActiveTargets()).thenReturn(Arrays.asList());

        Map<String, Object> summary = portfolioService.getPortfolioSummary();

        assertNotNull(summary);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> assetViews = (List<Map<String, Object>>) summary.get("assets");
        assertEquals(0, assetViews.size());

        BigDecimal totalValue = (BigDecimal) summary.get("totalValue");
        BigDecimal totalCost = (BigDecimal) summary.get("totalCost");
        assertEquals(0, totalValue.compareTo(BigDecimal.ZERO));
        assertEquals(0, totalCost.compareTo(BigDecimal.ZERO));
    }

    @Test
    public void testGetPortfolioSummaryWithNoPriceData() {
        Asset asset = new Asset();
        TestUtils.setId(asset, 1L);
        asset.setTicker("AAPL");
        asset.setQuantity(10);
        asset.setBuyPrice(new BigDecimal("150.00"));
        asset.setBuyDate(LocalDate.now().minusDays(100));

        when(assetRepository.findAll()).thenReturn(Arrays.asList(asset));
        when(priceService.getLatestPriceForTicker("AAPL")).thenReturn(null);
        when(priceTargetService.getActiveTargets()).thenReturn(Arrays.asList());

        Map<String, Object> summary = portfolioService.getPortfolioSummary();

        assertNotNull(summary);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> assetViews = (List<Map<String, Object>>) summary.get("assets");
        assertEquals(1, assetViews.size());
    }

    @Test
    public void testGetPortfolioSummaryShortTermTax() {
        Asset asset = new Asset();
        TestUtils.setId(asset, 1L);
        asset.setTicker("AAPL");
        asset.setQuantity(10);
        asset.setBuyPrice(new BigDecimal("150.00"));
        asset.setBuyDate(LocalDate.now().minusDays(100));

        StockPrice price = new StockPrice();
        price.setTicker("AAPL");
        price.setClosePrice(new BigDecimal("200.00"));
        price.setPriceDate(LocalDate.now());

        when(assetRepository.findAll()).thenReturn(Arrays.asList(asset));
        when(priceService.getLatestPriceForTicker("AAPL")).thenReturn(price);
        when(priceTargetService.getActiveTargets()).thenReturn(Arrays.asList());
        when(priceTargetService.saveTarget(any(PriceTarget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> summary = portfolioService.getPortfolioSummary();

        assertNotNull(summary);
        BigDecimal shortTermTax = (BigDecimal) summary.get("shortTermTax");
        assertNotNull(shortTermTax);
        assertTrue(shortTermTax.compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    public void testGetPortfolioSummaryLongTermTax() {
        Asset asset = new Asset();
        TestUtils.setId(asset, 1L);
        asset.setTicker("AAPL");
        asset.setQuantity(10);
        asset.setBuyPrice(new BigDecimal("150.00"));
        asset.setBuyDate(LocalDate.now().minusDays(800));

        StockPrice price = new StockPrice();
        price.setTicker("AAPL");
        price.setClosePrice(new BigDecimal("200.00"));
        price.setPriceDate(LocalDate.now());

        when(assetRepository.findAll()).thenReturn(Arrays.asList(asset));
        when(priceService.getLatestPriceForTicker("AAPL")).thenReturn(price);
        when(priceTargetService.getActiveTargets()).thenReturn(Arrays.asList());
        when(priceTargetService.saveTarget(any(PriceTarget.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> summary = portfolioService.getPortfolioSummary();

        assertNotNull(summary);
        BigDecimal longTermTax = (BigDecimal) summary.get("longTermTax");
        assertNotNull(longTermTax);
        assertTrue(longTermTax.compareTo(BigDecimal.ZERO) > 0);
    }
}
